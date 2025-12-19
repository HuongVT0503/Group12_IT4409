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
import { Link, useNavigate } from "react-router-dom";
import CommentItem from "./CommentItem";

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
  const navigate = useNavigate();
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

  //initialize
  useEffect(() => {}, [post]);

  //listen for real-time update
  useEffect(() => {
    if (!socket || !post.id) return;

    //JOIN post ROOM
    socket.emit("join_post", post.id);

    const handleUpdate = (payload) => {
      //post deleted
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
        const isCommentPresent = comments.some(c => c.comment.id === payload.deletedCommentId);
        if (comments.length > 0 && !isCommentPresent) {
            return;
        }

        
        const idsToRemove = new Set([
          payload.deletedCommentId,
          ...getDescendantIds(payload.deletedCommentId, comments) 
        ]);

        setCommentCount((prev) => Math.max(0, prev - idsToRemove.size));
        if (showComments) {
          setComments((prev) => prev.filter((c) => !idsToRemove.has(c.comment.id)));
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
    <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-4 2xl:p-6 mb-4 2xl:mb-6 transition-all hover:shadow-md">
      {/* Header */}
      <div className="flex justify-between items-start mb-3 2xl:mb-5">
        <div className="flex gap-3 2xl:gap-4">
          <Link to={`/profile/${post.author.id}`}>
            <img
              src={
                post.author.avatar ||
                `https://ui-avatars.com/api/?name=${post.author.name}`
              }
              alt={post.author.name}
              className="w-10 h-10 2xl:w-14 2xl:h-14 rounded-full object-cover border border-gray-200"
            />
          </Link>
          <div>
            <Link to={`/profile/${post.author.id}`}>
              <h3 className="font-bold text-gray-900 leading-tight 2xl:text-lg">
                {post.author.name}
              </h3>
            </Link>
            <p className="text-sm 2xl:text-base text-gray-500">
              @{post.author.handle} • {safeFormatDate(post.timestamp)}
            </p>
          </div>
        </div>
        {isAuthor && (
          <button
            onClick={handleDelete}
            className="text-gray-400 hover:text-red-600"
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
        <div className="mb-4 rounded-xl overflow-hidden border border-gray-100">
          <img
            src={post.image}
            alt="Post content"
            className="w-full h-auto object-cover max-h-[500px] 2xl:max-h-[700px]"
          />
        </div>
      )}

      {/*Shared Post / if isrepost */}
      {post.sharedPost && (
        <div
          className="mb-4 2xl:mb-6 border border-gray-200 rounded-xl overflow-hidden cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => navigate(`/post/${post.sharedPost.id}`)} //og post link
        >
          {/* Sharedpost media */}
          {post.sharedPost.image && (
            <div className="h-48 w-full overflow-hidden bg-gray-100">
              <img
                src={post.sharedPost.image}
                alt="Shared post content"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Sharedpost in4 */}
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

      {/* Actions */}
      <div className="flex items-center gap-4 border-t border-gray-100 pt-3 mt-2">
        <button
          onClick={toggleLike}
          className={`flex items-center gap-6 text-sm 2xl:text-base font-medium transition-colors ${
            isLiked ? "text-red-500" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Heart
            size={20}
            className={`2xl:w-6 2xl:h-6 ${isLiked ? "fill-current" : ""}`}
          />
          <span>{likeCount > 0 ? likeCount : "Like"}</span>
        </button>

        <button
          onClick={handleFetchComments}
          className="flex items-center gap-2 text-sm 2xl:text-base font-medium text-gray-500 hover:text-gray-700"
        >
          <MessageSquare size={20} className="2xl:w-6 2xl:h-6" />
          <span>{commentCount > 0 ? commentCount : "Comment"}</span>
        </button>

        <button
          onClick={handleShare}
          disabled={isSharing}
          className="flex items-center gap-2 text-sm 2xl:text-base font-medium text-gray-500 hover:text-gray-700 disabled:opacity-50"
        >
          <Share2 size={20} className="2xl:w-6 2xl:h-6" />
          <span>
            {isSharing ? "Sharing..." : shareCount > 0 ? shareCount : "Share"}
          </span>
        </button>
      </div>
      {/* Comments Section  */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-gray-100 animate-in fade-in slide-in-from-top-2">
          <div className="flex gap-2 items-center mb-4">
            <img
              src={
                user?.avatar_url ||
                `https://ui-avatars.com/api/?name=${user?.display_name}`
              }
              className="w-8 h-8 2xl:w-10 2xl:h-10 rounded-full"
            />
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={handlePostComment}
              placeholder="Write a comment..."
              className="w-full bg-gray-100 rounded-full py-2 px-4 text-sm 2xl:text-base focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>

          {loadingComments ? (
            <p className="text-xs 2xl:text-sm text-center">Loading...</p>
          ) : (
            <div className="space-y-4">
              {commentTree.map((node) => (
                <CommentItem
                  key={node.comment.id}
                  item={node}
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
    </div>
  );
}
