import { useState } from "react";
import { X, Smile } from "lucide-react";
import Button from "./ButtonComponent";
import TextAreaField from "./TextAreaField";
import EmojiPicker from "emoji-picker-react";
import { createPortal } from "react-dom";

export default function ShareModal({ isOpen, onClose, onShare, loading }) {
  const [caption, setCaption] = useState("");
  const [showPicker, setShowPicker] = useState(false);

  if (!isOpen) return null;

  const handleEmojiClick = (emojiData) => {
    setCaption((prev) => prev + emojiData.emoji);
    setShowPicker(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onShare(caption);
    setCaption("");
  };

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 z-50 animate-in fade-in">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-900">Share Post</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-visible">
          <div className="relative mb-6">
            <TextAreaField
              label="Caption (Optional)"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Say something about this..."
              rows={3}
            />
            {/* Emoji Trigger */}
            <button
              type="button"
              onClick={() => setShowPicker(!showPicker)}
              className="absolute right-2 bottom-2 text-gray-400 hover:text-yellow-500 transition-colors"
            >
              <Smile size={20} />
            </button>
            
            {/* Emoji picker popover */}
            {showPicker && (
              <div className="absolute right-0 bottom-full mb-2 z-50 shadow-xl">
                 <div className="fixed inset-0 z-0" onClick={() => setShowPicker(false)}/> {/* Backdrop */}
                 <div className="relative z-10">
                    <EmojiPicker onEmojiClick={handleEmojiClick} width={300} height={350} />
                 </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={loading}>
              Share Now
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}