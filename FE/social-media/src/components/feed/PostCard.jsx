import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns"; //?date-fns
import { Heart, MessageSquare, Trash2, Share2 } from "lucide-react"; //share2
//import Button from "../common/ButtonComponent";
import {
  likePost,
  unlikePost,
  deletePost,
  sharePost,
} from "../../services/postService";
import { getComments, createComment } from "../../services/commentService";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { Link, useNavigate } from "react-router-dom";
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
        // Backend payload: { newComment: commentObj }
        commentCount;
        setCommentCount((prev) => prev + 1);

        //be 'createComment' needs author info?
        if (showComments) {
          const incomingAuthorId =
            payload.newComment.authorId || payload.newComment.from;
          if (incomingAuthorId !== user?.id) {
            //only push, doent fetch
            setComments((prev) => [
              {
                comment: payload.newComment,
                author: { display_name: "User", avatar_url: "" }, // Placeholder if BE doesnt send author
              },
              ...prev,
            ]);
          }
        }
      }
    };

    socket.on("post_update", handleUpdate);

    //leave the room
    return () => {
      socket.off("post_update", handleUpdate);
      socket.emit("leave_post", post.id);
    };
  }, [socket, post.id, user?.id, showComments]);

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
        setComments([{ comment: res.data.comment, author: user }, ...comments]);
        setNewComment("");
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Delete this post?")) {
      await deletePost(post.id);
      if (onDelete) onDelete(post.id);
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

      {/*Shared Post / if isrepost */}
      {post.sharedPost && (
        <div
          className="mb-4 border border-primary-300/50 rounded-xl overflow-hidden cursor-pointer bg-gradient-to-br from-primary-50/30 to-transparent hover:from-primary-50/50 transition-all shadow-sm"
          onClick={() => navigate(`/post/${post.sharedPost.id}`)} //og post link
        >
          {/* Sharedpost media */}
          {post.sharedPost.image && (
            <div className="h-48 w-full overflow-hidden bg-gray-100 border-b border-neutral-300">
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
      {/* Comments Section  */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-gray-200/60 animate-in fade-in slide-in-from-top-2">
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
              {comments.map((item) => (
                <div key={item.comment.id} className="flex gap-3">
                  <Link to={`/profile/${item.author.id || item.author.userId}`}>
                    <img
                      src={
                        item.author.avatar_url ||
                        `https://ui-avatars.com/api/?name=${item.author.display_name}`
                      }
                      className="w-8 h-8 2xl:w-10 2xl:h-10 rounded-full"
                    />
                  </Link>
                  <div className="bg-gradient-to-br from-gray-50 to-primary-50/20 rounded-2xl rounded-tl-none px-4 py-2.5 shadow-sm border border-gray-100/50">
                    <div className="flex justify-between items-baseline gap-2">
                      <Link
                        to={`/profile/${item.author.id || item.author.userId}`}
                      >
                        <span className="font-semibold text-sm text-gray-800">
                          {item.author.display_name}
                        </span>
                      </Link>
                      <span className="text-xs text-gray-500">
                        {safeFormatDate(item.comment.created_at)} ago
                      </span>
                    </div>
                    <p className="text-sm 2xl:text-base text-gray-700 mt-1">
                      {item.comment.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
