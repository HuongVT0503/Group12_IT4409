import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { CornerDownRight, Smile, Image as ImageIcon, X, Heart,
  //PlayCircle 
  } from "lucide-react"; // Added PlayCircle
import { useSocketContext } from "../../context/SocketContext";
import EmojiPicker from "emoji-picker-react";
import { uploadMedia } from "../../services/mediaService";
import { likeComment, unlikeComment } from "../../services/commentService";

export default function CommentItem({
  item,
  user,
  onReplySubmit,
  onDelete,
  depth = 0,
  postAuthorId,
}) {
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { isUserOnline } = useSocketContext();
  const [replyFile, setReplyFile] = useState(null);
  const [replyPreview, setReplyPreview] = useState(null);

  const [isLiked, setIsLiked] = useState(item.isLiked || false);
  const [likeCount, setLikeCount] = useState(item.comment.stats?.likes || 0);

  //sync when parent 'item' changes
  useEffect(() => {
    setIsLiked(item.isLiked || false);
    setLikeCount(item.comment.stats?.likes || 0);
  }, [item]);

  const onEmojiClick = (emojiData) => {
    setReplyText((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const isCommentAuthor =
    user?.id === item.author.id || user?.id === item.author.userId;
  const isPostAuthor = user?.id === postAuthorId;
  const canDelete = isCommentAuthor || isPostAuthor;

  const safeDate = (date) => {
    try {
      return formatDistanceToNow(new Date(date)) + " ago";
    } catch {
      return "";
    }
  };

  const isVideoUrl = (url) => {
    if (!url) return false;
    return url.match(/\.(mp4|webm|ogg|mov)$/i) != null;
  };

  const handleLike = async () => {
    const previousState = isLiked;
    const prevCount = likeCount;

    setIsLiked(!previousState);
    setLikeCount(previousState ? prevCount - 1 : prevCount + 1);

    try {
      if (previousState) {
        await unlikeComment(item.comment.id);
      } else {
        await likeComment(item.comment.id);
      }
    } catch (error) {
      console.error("Failed to toggle comment like", error);
      setIsLiked(previousState);
      setLikeCount(prevCount);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim() && !replyFile) return;
    let mediaUrl = null;
    if (replyFile) {
      const uploaded = await uploadMedia(replyFile);
      mediaUrl = uploaded.url;
    }
    onReplySubmit(item.comment.id, replyText, mediaUrl);
    setReplyText("");
    setReplyFile(null);
    setReplyPreview(null);
    setIsReplying(false);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setReplyFile(file);
      setReplyPreview(URL.createObjectURL(file));
    }
  };

  const clearFile = () => {
    setReplyFile(null);
    setReplyPreview(null);
  };

  return (
    <div
      id={`comment-${item.comment.id}`}
      className={`flex flex-col ${
        depth > 0 ? (depth < 4 ? "ml-8 mt-2" : "mt-2 border-l-2 pl-2") : "mt-4"
      }`}
    >
      <div className="flex gap-3">
        {/* Avatar */}
        <Link to={`/profile/${item.author.id || item.author.userId}`}>
          <div className="relative inline-block">
            <img
              src={
                item.author.avatar_url ||
                `https://ui-avatars.com/api/?name=${item.author.display_name}`
              }
              className="w-8 h-8 rounded-full object-cover"
              alt="avatar"
            />
            {isUserOnline(item.author.id || item.author.userId) && (
              <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 border-2 border-white rounded-full"></span>
            )}
          </div>
        </Link>

        {/* Content Box */}
        <div className="flex-1 group">
          <div className="bg-gray-50 rounded-2xl rounded-tl-none px-4 py-2 inline-block max-w-full">
            <div className="flex justify-between items-baseline gap-4">
              <Link
                to={`/profile/${item.author.id || item.author.userId}`}
                className="font-bold text-sm hover:underline"
              >
                {item.author.display_name}
              </Link>
              <span className="text-xs text-gray-400">
                {safeDate(item.comment.created_at)}
              </span>
            </div>
            <p className="text-sm text-gray-800 mt-1 whitespace-pre-wrap">
              {item.comment.content}
            </p>
            
            {/* render media */}
            {item.comment.media && item.comment.media.length > 0 && (
              <div className="mt-2">
                {isVideoUrl(item.comment.media[0]) ? (
                  <video 
                    src={item.comment.media[0]} 
                    controls 
                    className="max-h-60 rounded-lg border border-gray-200"
                  />
                ) : (
                  <img 
                    src={item.comment.media[0]} 
                    alt="comment media" 
                    className="max-h-40 rounded-lg object-cover" 
                  />
                )}
              </div>
            )}
          </div>

          {/* Actions Line */}
          <div className="flex items-center gap-4 mt-1 ml-1">
            <button
              onClick={handleLike}
              className={`text-xs font-semibold transition-colors flex items-center gap-1 ${
                isLiked ? "text-red-500" : "text-gray-500 hover:text-red-500"
              }`}
            >
              <Heart size={12} className={isLiked ? "fill-current" : ""} />
          <span>{likeCount > 0 ? likeCount : "Like"}</span>
              
            </button>

            <button
              onClick={() => setIsReplying(!isReplying)}
              className="text-xs font-semibold text-gray-500 hover:text-primary transition-colors flex items-center gap-1"
            >
              Reply
            </button>

            {canDelete && (
              <button
                onClick={() => onDelete(item.comment.id)}
                className="text-xs font-semibold text-gray-500 hover:text-red-500 transition-colors flex items-center gap-1"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Reply Input */}
      {isReplying && (
        <div className="flex flex-col gap-2 mt-2 ml-10 relative items-start">
          {replyPreview && (
            <div className="relative group">
               {replyFile?.type?.startsWith('video/') ? (
                 <video 
                   src={replyPreview} 
                   className="h-24 w-auto object-cover rounded-md border border-gray-200"
                 />
               ) : (
                 <img 
                   src={replyPreview} 
                   alt="Preview" 
                   className="h-20 w-20 object-cover rounded-md" 
                 />
               )}
              <button
                onClick={clearFile}
                className="absolute -top-2 -right-2 bg-gray-200 rounded-full p-0.5 hover:bg-gray-300 z-10"
              >
                <X size={12} />
              </button>
            </div>
          )}

          <div className="flex gap-2 w-full relative">
            <CornerDownRight size={16} className="text-gray-300" />
            <div className="relative flex-1">
              <input
                autoFocus
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleReply()}
                placeholder={`Reply to ${item.author.display_name.split(" ")[0]}...`}
                className="flex-1 bg-gray-100 rounded-full py-1.5 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 w-full pr-16"
              />
              <label className="absolute right-8 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-primary">
                <input
                  type="file"
                  hidden
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                />
                <ImageIcon size={16} />
              </label>
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-yellow-500"
              >
                <Smile size={16} />
              </button>
            </div>
          </div>

          {showEmojiPicker && (
            <div className="absolute top-10 left-0 z-50">
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowEmojiPicker(false)}
              />
              <div className="relative z-50">
                <EmojiPicker
                  onEmojiClick={onEmojiClick}
                  width={280}
                  height={300}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Render Replies Recursively */}
      {item.replies && item.replies.length > 0 && (
        <div className="border-l-2 border-gray-100 ml-3.5">
          {item.replies.map((reply) => (
            <CommentItem
              key={reply.comment.id}
              item={reply}
              user={user}
              postAuthorId={postAuthorId}
              onReplySubmit={onReplySubmit}
              onDelete={onDelete}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}