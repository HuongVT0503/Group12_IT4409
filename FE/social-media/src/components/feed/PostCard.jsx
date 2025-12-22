import { useState, useEffect, useMemo } from "react";
import { formatDistanceToNow } from "date-fns"; //?date-fns
import { Heart, MessageSquare, Trash2, Share2 } from "lucide-react"; //share2
//import Button from "../common/ButtonComponent";
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
import { useSocket } from "../../context/SocketContext";
import { Link } from "react-router-dom";
import Avatar from "../common/Avatar";

const safeFormatDate = (dateString) => {
  try {
    if (!dateString) return "Just now";
    return formatDistanceToNow(new Date(dateString)) + " ago";
  } catch (e) {
    console.error(e);
    return "";
  }
};

export default function PostCard({ post, onDelete }) {
  const { user } = useAuth();
  //const navigate = useNavigate();
  const socket = useSocket();

  const [isSharing, setIsSharing] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [likeCount, setLikeCount] = useState(post.stats?.likes || 0);
  const [commentCount, setCommentCount] = useState(post.stats?.comments || 0);

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [shareCount, setShareCount] = useState(post.stats?.shares || 0);

  //
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyText, setReplyText] = useState("");

  const commentTree = useMemo(() => {
    const map = {};
    const roots = [];

    //innit
    comments.forEach((c) => {
      map[c.comment.id] = { ...c, replies: [] };
    });
    //link
    comments.forEach((c) => {
      if (c.parentId && map[c.parentId]) {
        map[c.parentId].replies.push(map[c.comment.id]);
      } else {
        roots.push(map[c.comment.id]);
      }
    });

    return roots;
  }, [comments]);

  const submitReply = (parentId) => {
    if (!replyText.trim()) return;
    handleReplySubmit(parentId, replyText);
    setReplyingToId(null);
    setReplyText("");
  };

  //initialize
  useEffect(() => {}, [post]);

  //listen for real-time update
  useEffect(() => {
    if (!socket || !post.id) return;

    //JOIN post ROOM
    socket.emit("join_post", post.id);

    const handleUpdate = (payload) => {
      if (payload.deleted) {
        if (onDelete) onDelete(post.id);
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
        //be payload: { newComment: commentObj }
        //commentCount;
        setCommentCount((prev) => prev + 1);

        //be 'createComment' needs author info?
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
    };

    socket.on("post_update", handleUpdate);

    //leave the room
    return () => {
      socket.off("post_update", handleUpdate);
      socket.emit("leave_post", post.id);
    };
  }, [socket, post.id, user?.id, showComments, onDelete, comments]);

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
      setIsLiked(previousState); //revert
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
        setComments(res.data.data); // BE returns { data: [...] }
      } catch (e) {
        console.error(e);
      }
      setLoadingComments(false);
    }
    setShowComments(!showComments);
  };

  const handlePostComment = async (e) => {
    if (e.key === "Enter" && newComment.trim()) {
      try {
        const res = await createComment(post.id, newComment);
        setComments((prev) => {
          if (prev.some((c) => c.comment.id === res.data.comment.id))
            return prev;

          return [
            ...prev,
            { comment: res.data.comment, author: user, parentId: null },
          ];
        });
        setNewComment("");
        setCommentCount((prev) => prev + 1);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleReplySubmit = async (parentId, content) => {
    try {
      const res = await createComment(post.id, content, parentId);

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

    //
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

  const handleShare = async () => {
    //caption
    const caption = window.prompt("Say something about this post (optional):");
    if (caption === null) return; //user cancel

    setIsSharing(true);
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

  ///
  const isAuthor =
    user?.id === post.author.id || user?.id === post.author.userId;

  return (
    <div className="w-full bg-white/90 backdrop-blur-md rounded-2xl shadow-[0_8px_32px_rgba(31,38,135,0.12)] border border-white/40 p-5 transition-all duration-300 hover:shadow-[0_12px_40px_rgba(31,38,135,0.18)] hover:-translate-y-0.5">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <Link to={`/profile/${post.author.id}`} className="flex gap-3">
          <Avatar
            src={
              post.author.avatar ||
              `https://ui-avatars.com/api/?name=${post.author.name}`
            }
            alt={post.author.name}
            size={11}
          />
          <div className="flex flex-col items-start justify-between">
            <h3 className="font-bold text-gray-900 leading-tight">
              {post.author.name}
            </h3>
            <p className="text-sm text-gray-500">
              @{post.author.handle} • {safeFormatDate(post.timestamp)}
            </p>
          </div>
        </Link>
        {isAuthor && (
          <button
            onClick={handleDelete}
            className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-all"
          >
            <Trash2 size={20} className="2xl:w-6 2xl:h-6" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="mb-3 2xl:mb-5">
        <p className="text-gray-800 text-[15px] 2xl:text-lg leading-relaxed whitespace-pre-line">
          {post.content}
        </p>
      </div>

      {/* Media */}
      {post.image && !post.sharePost && (
        <div className="mb-4 rounded-xl overflow-hidden border border-gray-200/60 shadow-sm">
          <img
            src={post.image}
            alt="Post content"
            className="w-full h-auto object-cover max-h-[500px] 2xl:max-h-[700px]"
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-6 border-t border-gray-200/60 pt-4 mt-3">
        <button
          onClick={toggleLike}
          className={`flex items-center gap-2 text-sm font-semibold transition-all hover:scale-105 ${
            isLiked ? "text-[#ff6b9d]" : "text-gray-600 hover:text-primary-500"
          }`}
        >
          <Heart size={21} className={isLiked ? "fill-current" : ""} />
          <span>{likeCount > 0 ? likeCount : "Like"}</span>
        </button>

        <button
          onClick={handleFetchComments}
          className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-primary-500 transition-all hover:scale-105"
        >
          <MessageSquare size={21} />
          <span>{commentCount > 0 ? commentCount : "Comment"}</span>
        </button>

        <button
          onClick={handleShare}
          disabled={isSharing}
          className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-primary-500 transition-all hover:scale-105 disabled:opacity-50"
        >
          <Share2 size={21} />
          <span>
            {isSharing ? "Sharing..." : shareCount > 0 ? shareCount : "Share"}
          </span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-gray-200/60 animate-in fade-in slide-in-from-top-2">
          {/* Main Comment Input */}
          <div className="flex gap-3 items-center mb-4">
            <img
              src={
                user?.avatar_url ||
                `https://ui-avatars.com/api/?name=${user?.display_name}`
              }
              className="w-9 h-9 rounded-full ring-2 ring-primary-400/20"
            />
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={handlePostComment}
              placeholder="Write a comment..."
              className="w-full bg-gradient-to-r from-gray-50 to-primary-50/30 rounded-full py-2.5 px-5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400/40 transition-all"
            />
          </div>

          {loadingComments ? (
            <p className="text-xs 2xl:text-sm text-center">Loading...</p>
          ) : (
            <div className="space-y-4">
              {/*INLINE RENDERING OF CMT TREE*/}
              {commentTree.map((root) => {
                const rootIsAuthor =
                  user?.id === root.author.id ||
                  user?.id === root.author.userId;
                return (
                  <div key={root.comment.id} className="flex flex-col gap-3">
                    {/*PARENT CMT*/}
                    <div className="flex gap-3">
                      <Link
                        to={`/profile/${root.author.id || root.author.userId}`}
                      >
                        <img
                          src={
                            root.author.avatar_url ||
                            `https://ui-avatars.com/api/?name=${root.author.display_name}`
                          }
                          className="w-8 h-8 2xl:w-10 2xl:h-10 rounded-full"
                        />
                      </Link>
                      <div className="flex-1">
                        <div className="bg-gradient-to-br from-gray-50 to-primary-50/20 rounded-2xl rounded-tl-none px-4 py-2.5 shadow-sm border border-gray-100/50 inline-block min-w-[200px]">
                          <div className="flex justify-between items-baseline gap-2">
                            <Link
                              to={`/profile/${
                                root.author.id || root.author.userId
                              }`}
                            >
                              <span className="font-semibold text-sm text-gray-800">
                                {root.author.display_name}
                              </span>
                            </Link>
                            <span className="text-xs text-gray-500">
                              {safeFormatDate(root.comment.created_at)} ago
                            </span>
                          </div>
                          <p className="text-sm 2xl:text-base text-gray-700 mt-1">
                            {root.comment.content}
                          </p>
                        </div>
                        {/* Parent Actions*/}
                        <div className="flex gap-3 mt-1 ml-2 text-xs font-semibold text-gray-500">
                          <button
                            onClick={() => {
                              setReplyingToId(
                                replyingToId === root.comment.id
                                  ? null
                                  : root.comment.id
                              );
                              setReplyText("");
                            }}
                            className="hover:text-primary-600"
                          >
                            Reply
                          </button>
                          {(rootIsAuthor || isAuthor) && (
                            <button
                              onClick={() =>
                                handleDeleteComment(root.comment.id)
                              }
                              className="hover:text-red-500"
                            >
                              Delete
                            </button>
                          )}
                        </div>

                        {replyingToId === root.comment.id && (
                          <div className="mt-2 flex gap-2 items-center">
                            <input
                              autoFocus
                              type="text"
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              onKeyDown={(e) =>
                                e.key === "Enter" &&
                                submitReply(root.comment.id)
                              }
                              placeholder={`Reply to ${root.author.display_name}...`}
                              className="bg-gray-50 rounded-full px-3 py-1.5 text-sm border border-gray-200 w-full focus:outline-none focus:border-primary-300"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* NESTED REPLIES*/}
                    {root.replies && root.replies.length > 0 && (
                      <div className="pl-12 space-y-3">
                        {root.replies.map((child) => {
                          const childIsAuthor =
                            user?.id === child.author.id ||
                            user?.id === child.author.userId;
                          return (
                            <div key={child.comment.id} className="flex gap-3">
                              <Link
                                to={`/profile/${
                                  child.author.id || child.author.userId
                                }`}
                              >
                                <img
                                  src={
                                    child.author.avatar_url ||
                                    `https://ui-avatars.com/api/?name=${child.author.display_name}`
                                  }
                                  className="w-7 h-7 rounded-full"
                                />
                              </Link>
                              <div className="flex-1">
                                <div className="bg-gray-50 rounded-2xl rounded-tl-none px-3 py-2 border border-gray-100 inline-block min-w-[150px]">
                                  <div className="flex justify-between items-baseline gap-2">
                                    <Link
                                      to={`/profile/${
                                        child.author.id || child.author.userId
                                      }`}
                                    >
                                      <span className="font-semibold text-sm text-gray-800">
                                        {child.author.display_name}
                                      </span>
                                    </Link>
                                    <span className="text-xs text-gray-500">
                                      {safeFormatDate(child.comment.created_at)}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-700 mt-1">
                                    {child.comment.content}
                                  </p>
                                </div>
                                {/* Child Actions*/}
                                <div className="flex gap-3 mt-1 ml-2 text-xs font-semibold text-gray-500">
                                  <button
                                    onClick={() => {
                                      setReplyingToId(
                                        replyingToId === child.comment.id
                                          ? null
                                          : child.comment.id
                                      );
                                      setReplyText("");
                                    }}
                                    className="hover:text-primary-600"
                                  >
                                    Reply
                                  </button>
                                  {(childIsAuthor || isAuthor) && (
                                    <button
                                      onClick={() =>
                                        handleDeleteComment(child.comment.id)
                                      }
                                      className="hover:text-red-500"
                                    >
                                      Delete
                                    </button>
                                  )}
                                </div>
                                {replyingToId === child.comment.id && (
                                  <div className="mt-2 flex gap-2 items-center">
                                    <input
                                      autoFocus
                                      type="text"
                                      value={replyText}
                                      onChange={(e) =>
                                        setReplyText(e.target.value)
                                      }
                                      onKeyDown={(e) =>
                                        e.key === "Enter" &&
                                        submitReply(child.comment.id)
                                      }
                                      placeholder={`Reply to ${child.author.display_name}...`}
                                      className="bg-gray-50 rounded-full px-3 py-1.5 text-sm border border-gray-200 w-full focus:outline-none focus:border-primary-300"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
