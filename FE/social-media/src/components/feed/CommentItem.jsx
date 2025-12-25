import { useState } from "react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { CornerDownRight } from "lucide-react";
import { useSocketContext } from "../../context/SocketContext";

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
  const { isUserOnline } = useSocketContext();

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

  const handleReply = () => {
    if (!replyText.trim()) return;
    onReplySubmit(item.comment.id, replyText);
    setReplyText("");
    setIsReplying(false);
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
            {/* CHANGE: Dynamic Online Dot */}
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
          </div>

          {/* Actions Line */}
          <div className="flex items-center gap-4 mt-1 ml-1">
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
        <div className="flex gap-2 items-center mt-2 ml-10">
          <CornerDownRight size={16} className="text-gray-300" />
          <input
            autoFocus
            type="text"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleReply()}
            placeholder={`Reply to ${
              item.author.display_name.split(" ")[0]
            }...`}
            className="flex-1 bg-gray-100 rounded-full py-1.5 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
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
