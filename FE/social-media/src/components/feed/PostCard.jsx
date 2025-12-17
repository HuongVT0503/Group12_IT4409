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
  //??INITIAL LIKE STATE NOT AVAILABLE IN BE
  const [showComments, setShowComments] = useState(false);
  const [likeCount, setLikeCount] = useState(post.stats?.likes || 0);
  const [commentCount, setCommentCount] = useState(post.stats?.comments || 0);

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);

  //initialize
  useEffect(() => {
    //default to 0 bc be getFeed'' doent return like count or islike status
  }, [post]);

  //listen for real-time update
  useEffect(() => {
    if (!socket) return;

    //modify backend to emit to a global feed OR the frontend needs to join specific post rooms
    //listen globally?
    const handleUpdate = (payload) => {
      //need to emit `socket.emit('join_post', post.id)`

      if (payload.deleted) {
        if (onDelete) onDelete(post.id);
        return;
      }

      if (payload.likedBy) {
        // +1 if its not me
        if (payload.likedBy !== user?.id) {
          setLikeCount((prev) => prev + 1);
        }
      }

      if (payload.unlikedBy) {
        if (payload.unlikedBy !== user?.id) {
          setLikeCount((prev) => Math.max(0, prev - 1));
        }
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

    // JOIN the room for this specific post if using rooms
    //socket.emit('join_post', post.id); //NEED THIS LISTENER IN SERVER.JS IN BE

    return () => {
      socket.off("post_update", handleUpdate);
      socket.emit("leave_post", post.id); //cleanup room
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
    <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex gap-3">
          <Link to={`/profile/${post.author.id}`}>
            <img
              src={
                post.author.avatar ||
                `https://ui-avatars.com/api/?name=${post.author.name}`
              }
              alt={post.author.name}
              className="w-10 h-10 rounded-full object-cover border border-gray-200"
            />
          </Link>
          <div>
            <Link to={`/profile/${post.author.id}`}>
              <h3 className="font-bold text-gray-900 leading-tight">
                {post.author.name}
              </h3>
            </Link>
            <p className="text-sm text-gray-500">
              @{post.author.handle} • {safeFormatDate(post.timestamp)}
            </p>
          </div>
        </div>
        {isAuthor && (
          <button
            onClick={handleDelete}
            className="text-gray-400 hover:text-red-600"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="mb-3">
        <p className="text-gray-800 text-[15px] leading-relaxed whitespace-pre-line">
          {post.content}
        </p>
      </div>

      {/* Media */}
      {post.image && !post.sharePost && (
        <div className="mb-4 rounded-xl overflow-hidden border border-gray-100">
          <img
            src={post.image}
            alt="Post content"
            className="w-full h-auto object-cover max-h-[500px]"
          />
        </div>
      )}

      {/*Shared Post / if isrepost */}
      {post.sharedPost && (
        <div
          className="mb-4 border border-gray-200 rounded-xl overflow-hidden cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => navigate(`/post/${post.sharedPost.id}`)} //og post link
        >
          {/* Sharedpost media */}
          {post.sharedPost.image && (
            <div className="h-48 w-full overflow-hidden bg-gray-100">
              <img
                src={post.sharedPost.image}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Sharedpost in4 */}
          <div className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <img
                src={post.sharedPost.author.avatar}
                className="w-6 h-6 rounded-full"
              />
              <span className="font-bold text-sm">
                {post.sharedPost.author.name}
              </span>
              <span className="text-xs text-gray-500">
                • {safeFormatDate(post.sharedPost.timestamp)}
              </span>
            </div>
            <p className="text-sm text-gray-800 line-clamp-3">
              {post.sharedPost.content}
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 border-t border-gray-100 pt-3 mt-2">
        <button
          onClick={toggleLike}
          className={`flex items-center gap-2 text-sm font-medium transition-colors ${
            isLiked ? "text-red-500" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Heart size={20} className={isLiked ? "fill-current" : ""} />
          <span>{likeCount > 0 ? likeCount : "Like"}</span>
        </button>

        <button
          onClick={handleFetchComments}
          className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          <MessageSquare size={20} />
          <span>{commentCount > 0 ? commentCount : "Comment"}</span>
        </button>

        <button
          onClick={handleShare}
          disabled={isSharing}
          className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700 disabled:opacity-50"
        >
          <Share2 size={20} />
          <span>{isSharing ? "Sharing..." : "Share"}</span>
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
              className="w-8 h-8 rounded-full"
            />
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={handlePostComment}
              placeholder="Write a comment..."
              className="w-full bg-gray-100 rounded-full py-2 px-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>

          {loadingComments ? (
            <p className="text-xs text-center">Loading...</p>
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
                      className="w-8 h-8 rounded-full"
                    />
                  </Link>
                  <div className="bg-gray-50 rounded-2xl rounded-tl-none px-4 py-2">
                    <div className="flex justify-between items-baseline gap-2">
                      <Link
                        to={`/profile/${item.author.id || item.author.userId}`}
                      >
                        <span className="font-semibold text-sm">
                          {item.author.display_name}
                        </span>
                      </Link>
                      <span className="text-xs text-gray-400">
                        {safeFormatDate(item.comment.created_at)} ago
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">
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
