import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import {
  CornerDownRight,
  Smile,
  Image as ImageIcon,
  X,
  Heart,
  //Check
  //PlayCircle
} from "lucide-react"; // Added PlayCircle
import { useSocketContext } from "../../context/SocketContext";
import EmojiPicker from "emoji-picker-react";
import { uploadMedia } from "../../services/mediaService";
import { likeComment, unlikeComment, updateComment } from "../../services/commentService";
import Avatar from "../common/Avatar";
import { getMediaUrl } from "../../utils/mediaUrl";

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
  const [showEditEmojiPicker, setShowEditEmojiPicker] = useState(false);
  const { isUserOnline } = useSocketContext();
  const [replyFile, setReplyFile] = useState(null);
  const [replyPreview, setReplyPreview] = useState(null);

  const [isLiked, setIsLiked] = useState(item.isLiked || false);
  const [likeCount, setLikeCount] = useState(item.comment.stats?.likes || 0);

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(item.comment.content);

  //sync when parent 'item' changes
  useEffect(() => {
    setIsLiked(item.isLiked || false);
    setLikeCount(item.comment.stats?.likes || 0);
  }, [item]);

  const onEmojiClick = (emojiData) => {
    setReplyText((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const onEditEmojiClick = (emojiData) => {
    setEditContent((prev) => prev + emojiData.emoji);
    setShowEditEmojiPicker(false);
  };
  const handleEditSubmit = async () => {
    if (!editContent.trim()) return;
    try {
      await updateComment(item.comment.id, editContent);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to edit comment", error);
    }
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
        depth > 0
          ? depth < 4
            ? "ml-3 md:ml-8 mt-4"
            : "mt-2 border-l-2 pl-2"
          : "mt-4"
      }`}
      style={{ borderColor: "var(--comment-reply-border)" }}
    >
      <div className="flex gap-3">
        {/* Avatar */}
        <Link to={`/profile/${item.author.id || item.author.userId}`}>
          <div className="relative inline-block">
            <Avatar
              src={
                getMediaUrl(item.author.avatar_url) || item.author.avatar_url ||
                `https://ui-avatars.com/api/?name=${item.author.display_name}`
              }
              size={8}
              alt="avatar"
            />
            {isUserOnline(item.author.id || item.author.userId) && (
              <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 border-2 border-white rounded-full"></span>
            )}
          </div>
        </Link>

        {/* Content Box */}
        <div className="flex-1 group min-w-0">
          <div
            className="rounded-2xl rounded-tl-none px-3 pt-1 pb-2 inline-block max-w-full"
            style={{ backgroundColor: "var(--comment-bg)" }}
          >
            <div className="flex justify-between items-baseline gap-2">
              <Link
                to={`/profile/${item.author.id || item.author.userId}`}
                className="font-bold text-sm hover:underline"
                style={{ color: "var(--comment-author)" }}
              >
                {item.author.display_name}
              </Link>
              <span
                className="text-xs"
                style={{ color: "var(--comment-text-secondary)" }}
              >
                • {safeDate(item.comment.created_at)}
              </span>
            </div>
            {isEditing ? (
              <div className="mt-1 flex flex-col gap-2">
                 <textarea
                   value={editContent}
                   onChange={(e) => setEditContent(e.target.value)}
                   className="w-full text-sm p-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                   rows={2}
                 />

                 <div className="relative">
        <button 
          onClick={() => setShowEditEmojiPicker(!showEditEmojiPicker)}
          className="text-gray-500 hover:text-yellow-600"
          title="Add emoji"
        >
          <Smile size={18} />
        </button>

        {showEditEmojiPicker && (
          <div className="absolute top-8 left-0 z-50">
             <div 
               className="fixed inset-0 z-40" 
               onClick={() => setShowEditEmojiPicker(false)}
             />
             <div className="relative z-50">
               <EmojiPicker 
                 onEmojiClick={onEditEmojiClick}
                 width={280}
                 height={300}
               />
             </div>
          </div>
        )}
      </div>

                 <div className="flex gap-2 justify-end">
                    <button onClick={() => {setIsEditing(false); setEditContent(item.comment.content);setShowEditEmojiPicker(false);}} className="text-xs text-red-500 font-medium">Cancel</button>
                    <button onClick={handleEditSubmit} className="text-xs text-green-600 font-medium">Save</button>
                 </div>
              </div>
            ) : (
              <p
                className="text-sm mt-1 whitespace-pre-wrap break-words"
                style={{ color: "var(--comment-text)" }}
              >
                {item.comment.content}
              </p>
            )}
            
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
              className={`text-xs font-semibold transition-colors flex items-center gap-1 hover:text-[var(--comment-like-active)] cursor-pointer`}
              style={{
                color: isLiked
                  ? "var(--comment-like-active)"
                  : "var(--comment-action-text)",
              }}
            >
              <Heart size={12} className={isLiked ? "fill-current" : ""} />
              <span>{likeCount > 0 ? likeCount : "Like"}</span>
            </button>

            <button
              onClick={() => setIsReplying(!isReplying)}
              className="text-xs font-semibold transition-colors flex items-center gap-1 hover:text-[var(--comment-action-hover)] cursor-pointer"
              style={{ color: "var(--comment-action-text)" }}
            >
              Reply
            </button>
            
            {isCommentAuthor && (
               <button
                onClick={() => setIsEditing(!isEditing)}
                className="text-xs font-semibold text-gray-500 hover:text-blue-500 transition-colors flex items-center gap-1"
              >
                Edit
              </button>
            )}

            {canDelete && (
              <button
                onClick={() => onDelete(item.comment.id)}
                className="text-xs font-semibold transition-colors flex items-center gap-1 hover:text-[var(--comment-like-active)]"
                style={{ color: "var(--comment-action-text)" }}
              >
                Delete
              </button>
            )}

            {item.comment.updated_at && item.comment.updated_at !== item.comment.created_at && (
                  <span className="text-[10px] text-gray-400 ml-2">(edited)</span>
                )}
          </div>
        </div>
      </div>

      {/* Reply Input */}
      {isReplying && (
        <div className={`flex flex-col gap-2 mt-2 ml-10 relative items-start ${
      showEmojiPicker ? "z-[100]" : "z-1"
    }`}>
          {replyPreview && (
            <div className="relative group">
              {replyFile?.type?.startsWith("video/") ? (
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
                className="absolute -top-2 -right-2 rounded-full p-0.5 z-10 hover:opacity-80"
                style={{
                  backgroundColor: "var(--comment-input-bg)",
                  color: "var(--comment-text)",
                }}
              >
                <X size={12} />
              </button>
            </div>
          )}

          <div className="flex gap-2 w-full relative">
            <CornerDownRight
              size={16}
              style={{ color: "var(--comment-text-secondary)" }}
            />
            <div className="relative flex-1">
              <input
                autoFocus
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleReply()}
                placeholder={`Reply to ${
                  item.author.display_name.split(" ")[0]
                }...`}
                className="w-full rounded-full py-1.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--post-icon-primary)]/40 transition-all pr-20 placeholder:text-[var(--post-text-secondary)]"
                style={{
                  backgroundColor: "var(--post-input-bg)",
                  color: "var(--post-text)",
                }}
              />
              <label
                className="absolute right-8 top-1/2 -translate-y-1/2 cursor-pointer hover:text-[var(--comment-action-hover)]"
                style={{ color: "var(--post-icon-primary)" }}
              >
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
                className="absolute right-2 top-1/2 -translate-y-1/2 hover:text-[var(--post-icon-smile)]"
                style={{ color: "var(--post-icon-smile)" }}
              >
                <Smile size={16} />
              </button>
            </div>
          </div>

          {showEmojiPicker && (
            <div className="absolute bottom-full right-0 mb-2 z-[100]">
              <div
                className="fixed inset-0 z-[90]"
                onClick={() => setShowEmojiPicker(false)}
              />
              <div className="relative z-[100]">
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
        <div
          className="border-l-2 ml-3.5"
          style={{ borderColor: "var(--comment-reply-border)" }}
        >
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
