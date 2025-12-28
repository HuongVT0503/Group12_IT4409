import { useState, useEffect, useMemo } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Heart,
  MessageSquare,
  Trash2,
  Share2,
  MoreVertical,
  Flag,
  Smile,
  Image as ImageIcon,
  X,
} from "lucide-react";
import {
  likePost,
  unlikePost,
  deletePost,
  sharePost,
} from "../../services/postService";
import {
  getComments,
  createComment,
  deleteComment,
} from "../../services/commentService";
import { useAuth } from "../../context/AuthContext";
import { useSocketContext } from "../../context/SocketContext";
import { Link, useNavigate } from "react-router-dom";
import Avatar from "../common/Avatar";
import CommentItem from "./CommentItem";
import ReportModal from "../common/ReportModal";
import EmojiPicker from "emoji-picker-react";
import ShareModal from "../common/ShareModal";
import { uploadMedia } from "../../services/mediaService";
import { useTheme } from "../../context/ThemeContext";

const safeFormatDate = (dateString) => {
  try {
    if (!dateString) return "Just now";
    return formatDistanceToNow(new Date(dateString)) + " ago";
  } catch (e) {
    console.error(e);
    return "";
  }
};

export default function PostCard({
  post,
  onDelete,
  highlightId,
  readOnly = false,
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { socket, isUserOnline } = useSocketContext();
  const { theme } = useTheme();

  const [isSharing, setIsSharing] = useState(false);
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [showComments, setShowComments] = useState(false);
  const [likeCount, setLikeCount] = useState(post.stats?.likes || 0);
  const [commentCount, setCommentCount] = useState(post.stats?.comments || 0);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [shareCount, setShareCount] = useState(post.stats?.shares || 0);

  const [showMenu, setShowMenu] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const [isUploading, setIsUploading] = useState(false);

  const [commentFile, setCommentFile] = useState(null);
  const [commentPreview, setCommentPreview] = useState(null);

  const isVideoUrl = (url) => {
    if (!url) return false;
    return (
      url.match(/\.(mp4|webm|ogg|mov)$/i) != null || url.includes("data:video")
    );
  };

  const handleCommentFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCommentFile(file);
      setCommentPreview(URL.createObjectURL(file));
    }
  };

  const clearCommentFile = () => {
    setCommentFile(null);
    setCommentPreview(null);
  };

  const commentTree = useMemo(() => {
    const map = {};
    const roots = [];

    comments.forEach((c) => {
      map[c.comment.id] = { ...c, replies: [] };
    });

    comments.forEach((c) => {
      if (c.parentId && map[c.parentId]) {
        map[c.parentId].replies.push(map[c.comment.id]);
      } else {
        roots.push(map[c.comment.id]);
      }
    });

    return roots;
  }, [comments]);

  useEffect(() => {
    if (!socket || !post.id) return;

    socket.emit("join_post", post.id);

    const handleUpdate = (payload) => {
      if (payload.postId && payload.postId !== post.id) return;

      if (payload.deleted) {
        if (onDelete) onDelete(post.id);
        return;
      }

      if (payload.likedBy === user?.id || payload.unlikedBy === user?.id) {
        return;
      }

      if (payload.likedBy) {
        setLikeCount((prev) => prev + 1);
      }

      if (payload.unlikedBy) {
        setLikeCount((prev) => Math.max(0, prev - 1));
      }

      if (payload.newComment) {
        if (payload.newComment.author?.id === user?.id) {
          return;
        }
        setCommentCount((prev) => prev + 1);

        if (showComments) {
          setComments((prev) => {
            if (prev.find((c) => c.comment.id === payload.newComment.id))
              return prev;
            return [
              ...prev,
              {
                comment: payload.newComment,
                author: payload.newComment.author || {
                  display_name: "User",
                  avatar_url: "",
                },
                parentId: payload.newComment.parentId,
              },
            ];
          });
        }
      }

      if (payload.deletedCommentId) {
        //check existence b4 del //if all cmts r loadedbut this id is missing then it is del locally already
        const isCommentPresent = comments.some(
          (c) => c.comment.id === payload.deletedCommentId
        );
        if (comments.length > 0 && !isCommentPresent) {
          return;
        }

        const idsToRemove = new Set([
          payload.deletedCommentId,
          ...getDescendantIds(payload.deletedCommentId, comments),
        ]);

        setCommentCount((prev) => Math.max(0, prev - idsToRemove.size));
        if (showComments) {
          setComments((prev) =>
            prev.filter((c) => !idsToRemove.has(c.comment.id))
          );
        }
      }

      if (payload.reactionChange) {
        const { commentId, userId, reaction } = payload.reactionChange;

        setComments((prev) =>
          prev.map((c) => {
            if (c.comment.id === commentId) {
              const isMe = userId === user?.id;

              let newCount = c.comment.stats?.likes || 0;

              if (reaction) {
                newCount++;
              } else {
                newCount = Math.max(0, newCount - 1);
              }

              return {
                ...c,
                isLiked: isMe ? !!reaction : c.isLiked,
                comment: {
                  ...c.comment,
                  stats: {
                    ...c.comment.stats,
                    likes: newCount,
                  },
                },
              };
            }
            return c;
          })
        );
      }
    };

    socket.on("post_update", handleUpdate);

    //leave the room
    return () => {
      socket.off("post_update", handleUpdate);
      socket.emit("leave_post", post.id);
    };
  }, [socket, post.id, user?.id, showComments, onDelete, comments]);

  //auto openning & scrolling
  useEffect(() => {
    if (highlightId && !showComments) {
      handleFetchComments();
    }
  }, [highlightId]);

  //scroll once cmt is loaded
  useEffect(() => {
    if (highlightId && showComments && comments.length > 0) {
      setTimeout(() => {
        const element = document.getElementById(`comment-${highlightId}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          element.classList.add(
            "bg-blue-50",
            "transition-colors",
            "duration-1000"
          );
          setTimeout(() => element.classList.remove("bg-blue-50"), 2000);
        }
      }, 500);
    }
  }, [highlightId, showComments, comments.length]);

  const toggleLike = async () => {
    // UI update
    const previousState = isLiked;
    setIsLiked(!isLiked);
    setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));

    try {
      if (previousState) {
        await unlikePost(post.id);
      } else {
        await likePost(post.id);
      }
    } catch (error) {
      setIsLiked(previousState);
      setLikeCount((prev) => (previousState ? prev + 1 : prev - 1));
      console.error("Like failed", error);
    }
  };

  const getDescendantIds = (rootId, allComments) => {
    const children = allComments.filter((c) => c.parentId === rootId);
    let ids = children.map((c) => c.comment.id);
    children.forEach((child) => {
      ids = [...ids, ...getDescendantIds(child.comment.id, allComments)];
    });
    return ids;
  };

  const handleFetchComments = async () => {
    if (!showComments && comments.length === 0) {
      setLoadingComments(true);
      try {
        const res = await getComments(post.id);
        setComments(res.data.data);
      } catch (e) {
        console.error(e);
      }
      setLoadingComments(false);
    }
    setShowComments(!showComments);
  };

  const handlePostComment = async (e) => {
    if (
      e.key === "Enter" &&
      (newComment.trim() || commentFile) &&
      !isUploading
    ) {
      try {
        let mediaUrl = null;
        if (commentFile) {
          setIsUploading(true);
          const uploaded = await uploadMedia(commentFile);
          mediaUrl = uploaded.url;
          setIsUploading(false);
        }
        const res = await createComment(post.id, newComment, null, mediaUrl);
        setComments((prev) => {
          if (prev.some((c) => c.comment.id === res.data.comment.id))
            return prev;

          return [
            ...prev,
            { comment: res.data.comment, author: user, parentId: null },
          ];
        });
        setNewComment("");
        clearCommentFile();
        setCommentCount((prev) => prev + 1);
      } catch (err) {
        console.error(err);
        setIsUploading(false);
      }
    }
  };

  const handleReplySubmit = async (parentId, content, mediaUrl) => {
    try {
      const res = await createComment(post.id, content, parentId, mediaUrl);

      setComments((prev) => {
        if (prev.some((c) => c.comment.id === res.data.comment.id)) return prev;

        return [
          ...prev,
          { comment: res.data.comment, author: user, parentId: parentId },
        ];
      });

      setCommentCount((prev) => prev + 1);
    } catch (err) {
      console.error("Reply failed", err);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Delete this post?")) {
      await deletePost(post.id);
      if (onDelete) onDelete(post.id);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Delete this comment?")) return;

    const idsToRemove = new Set([
      commentId,
      ...getDescendantIds(commentId, comments),
    ]);

    //error safety
    const previousComments = [...comments];
    const previousCount = commentCount;

    setComments((prev) => prev.filter((c) => !idsToRemove.has(c.comment.id)));
    setCommentCount((prev) => Math.max(0, prev - idsToRemove.size));

    try {
      await deleteComment(commentId);
    } catch (err) {
      console.error("Delete failed", err);
      alert("Could not delete comment");
      // Revert on error
      setComments(previousComments);
      setCommentCount(previousCount);
    }
  };

  const handleShareClick = () => {
    setShowShareModal(true);
  };

  const handleShareSubmit = async (caption) => {
    setIsSharing(true);
    setShowShareModal(false);
    try {
      await sharePost(post.id, caption);
      alert("Post shared successfully!");
      setShareCount((prev) => prev + 1);
    } catch (error) {
      console.error("Share failed", error);
      alert("Failed to share post.");
    } finally {
      setIsSharing(false);
    }
  };

  const onEmojiClick = (emojiData) => {
    setNewComment((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  ///
  const isAuthor =
    user?.id === post.author.id || user?.id === post.author.userId;

  return (
    <div
      style={{
        backgroundColor: "var(--post-card-bg)",
        borderColor: "var(--post-card-border)",
        boxShadow: `0 8px 32px var(--post-card-shadow)`,
      }}
      className={`w-full backdrop-blur-md rounded-2xl border p-5 transition-all duration-300 hover:shadow-[0_12px_40px_var(--post-card-hover-shadow)] hover:-translate-y-0.5 ${
        showMenu ? "relative z-20" : "relative z-0"
      }`}
    >
      <div className="flex justify-between items-center mb-4">
        <Link
          to={`/profile/${post.author.id}`}
          className={`flex gap-3 ${readOnly ? "pointer-events-none" : ""}`}
        >
          <div className="relative">
            <Avatar
              src={
                post.author.avatar ||
                `https://ui-avatars.com/api/?name=${post.author.name}`
              }
              alt={post.author.name}
              size={11}
            />
            {isUserOnline(post.author.id) && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
            )}
          </div>

          <div className="flex flex-col items-start justify-between">
            <h3
              style={{ color: "var(--post-author-name)" }}
              className="font-bold leading-tight"
            >
              {post.author.name}
            </h3>
            <p
              style={{ color: "var(--post-text-secondary)" }}
              className="text-sm"
            >
              @{post.author.handle} • {safeFormatDate(post.timestamp)}
            </p>
          </div>
        </Link>
        {isAuthor ? (
          <button
            onClick={handleDelete}
            style={{ color: "var(--post-icon-secondary)" }}
            className="hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-all"
          >
            <Trash2 size={20} />
          </button>
        ) : (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              style={{ color: "var(--post-icon-secondary)" }}
              className="hover:[background:var(--panel-hover-bg)] p-2 rounded-lg transition-all cursor-pointer"
            >
              <MoreVertical size={20} />
            </button>

            {showMenu && (
              <div
                style={{
                  backgroundColor: "var(--post-menu-bg)",
                  borderColor: "var(--post-menu-border)",
                }}
                className="absolute right-0 top-full mt-1 w-32 rounded-lg shadow-lg border-2 z-10 overflow-hidden"
              >
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setIsReportOpen(true);
                  }}
                  className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                >
                  <Flag size={16} /> Report
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mb-3 2xl:mb-5">
        <p
          style={{ color: "var(--post-text)" }}
          className="text-[15px] 2xl:text-lg leading-relaxed whitespace-pre-line"
        >
          {post.content}
        </p>
      </div>

      {post.image && !post.sharePost && (
        <div
          style={{ borderColor: "var(--post-input-border)" }}
          className="mb-4 rounded-xl overflow-hidden border shadow-sm"
        >
          {isVideoUrl(post.image) ? (
            <video
              src={post.image}
              controls
              className="w-full h-auto object-cover max-h-[500px]"
            />
          ) : (
            <img
              src={post.image}
              alt="Post content"
              className="w-full h-auto object-cover max-h-[500px]"
            />
          )}
        </div>
      )}

      {post.sharedPost && (
        <div
          style={{
            background: "var(--post-shared-bg)",
            borderColor: "var(--post-shared-border)",
          }}
          className="mb-4 border rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition-all shadow-sm"
          onClick={() => navigate(`/post/${post.sharedPost.id}`)}
        >
          {post.sharedPost.image && (
            <div className="h-48 w-full overflow-hidden bg-gray-100 border-b border-neutral-300">
              {isVideoUrl(post.sharedPost.image) ? (
                <video
                  src={post.sharedPost.image}
                  controls
                  preload="metadata"
                  className="w-full h-full object-cover"
                  onClick={(e) => {
                    //e.preventDefault();
                    e.target.paused ? e.target.play() : e.target.pause();
                  }}
                />
              ) : (
                <img
                  src={post.sharedPost.image}
                  alt="Shared post content"
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          )}
          <div className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <img
                src={
                  post.sharedPost.author.avatar ||
                  `https://ui-avatars.com/api/?name=${post.sharedPost.author.name}`
                }
                alt={post.sharedPost.author.name}
                className="w-6 h-6 rounded-full object-cover border border-gray-200"
              />
              <span className="font-bold text-sm 2xl:text-base">
                {post.sharedPost.author.name}
              </span>
              <span className="text-xs 2xl:text-sm text-gray-500">
                • {safeFormatDate(post.sharedPost.timestamp)}
              </span>
            </div>
            <p className="text-sm 2xl:text-base text-gray-800 line-clamp-3">
              {post.sharedPost.content}
            </p>
          </div>
        </div>
      )}

      <div
        style={{ borderTopColor: "var(--post-border)" }}
        className="flex items-center gap-6 border-t pt-4 mt-3"
      >
        <button
          onClick={toggleLike}
          style={{
            color: isLiked
              ? "var(--post-like-active)"
              : "var(--post-icon-secondary)",
          }}
          className="flex items-center gap-2 text-sm font-semibold transition-all hover:scale-105 cursor-pointer"
        >
          <Heart size={21} className={isLiked ? "fill-current" : ""} />
          <span>{likeCount > 0 ? likeCount : "Like"}</span>
        </button>

        <button
          onClick={handleFetchComments}
          style={{ color: "var(--post-icon-secondary)" }}
          className="flex items-center gap-2 text-sm font-semibold hover:scale-105 cursor-pointer"
        >
          <MessageSquare size={21} />
          <span>{commentCount > 0 ? commentCount : "Comment"}</span>
        </button>

        <button
          onClick={handleShareClick}
          disabled={isSharing}
          style={{ color: "var(--post-icon-secondary)" }}
          className="flex items-center gap-2 text-sm font-semibold hover:scale-105 cursor-pointer disabled:opacity-50"
        >
          <Share2 size={21} />
          <span>
            {isSharing ? "Sharing..." : shareCount > 0 ? shareCount : "Share"}
          </span>
        </button>
      </div>

      {!readOnly && showComments && (
        <div className="mt-4 pt-4 border-t border-gray-200/60 animate-in fade-in slide-in-from-top-2">
          {commentPreview && (
            <div className="relative mb-2 ml-12 w-24 h-24 group">
              {commentFile?.type?.startsWith("video/") ? (
                <video
                  src={commentPreview}
                  className="w-full h-full object-cover rounded-lg border border-gray-200"
                  autoPlay
                  muted
                  loop
                />
              ) : (
                <img
                  src={commentPreview}
                  className="w-full h-full object-cover rounded-lg border border-gray-200"
                />
              )}
              <button
                onClick={clearCommentFile}
                className="absolute -top-2 -right-2 bg-gray-900 text-white rounded-full p-1 hover:bg-black transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          )}
          <div className="flex gap-3 items-center mb-4 relative">
            <img
              src={
                user?.avatar_url ||
                `https://ui-avatars.com/api/?name=${user?.display_name}`
              }
              className="w-9 h-9 rounded-full ring-2 ring-primary-400/20"
            />

            <div className="relative w-full">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={handlePostComment}
                placeholder="Write a comment..."
                disabled={isUploading}
                style={{
                  background: "var(--post-input-bg)",
                  color: "var(--post-text)",
                }}
                className="w-full rounded-full py-2.5 px-5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--post-icon-primary)]/40 transition-all pr-20 placeholder:text-[var(--post-text-secondary)]"
              />

              <label
                style={{ color: "var(--post-icon-secondary)" }}
                className="absolute right-10 top-1/2 -translate-y-1/2 hover:[color:var(--post-icon-primary)] cursor-pointer p-1"
              >
                <input
                  type="file"
                  hidden
                  accept="image/*,video/*"
                  onChange={handleCommentFileSelect}
                />
                <ImageIcon size={18} />
              </label>

              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                style={{ color: "var(--post-icon-secondary)" }}
                className="absolute right-3 top-1/2 -translate-y-1/2 hover:text-yellow-500"
              >
                <Smile size={20} />
              </button>
            </div>
          </div>

          {showEmojiPicker && (
            <div className="absolute top-10 right-0 z-50">
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowEmojiPicker(false)}
              />
              <div className="relative z-50">
                <EmojiPicker
                  onEmojiClick={onEmojiClick}
                  width={300}
                  height={350}
                />
              </div>
            </div>
          )}

          {loadingComments ? (
            <p className="text-xs 2xl:text-sm text-center">Loading...</p>
          ) : (
            <div className="space-y-4">
              {commentTree.map((item) => (
                <CommentItem
                  key={item.comment.id}
                  item={item}
                  user={user}
                  postAuthorId={post.author.id}
                  onReplySubmit={handleReplySubmit}
                  onDelete={handleDeleteComment}
                />
              ))}
            </div>
          )}
        </div>
      )}
      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        targetId={post.id}
        targetType="Post"
      />

      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        onShare={handleShareSubmit}
        loading={isSharing}
      />
    </div>
  );
}
