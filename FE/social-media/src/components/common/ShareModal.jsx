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
    <div
      className="fixed inset-0 flex items-center justify-center backdrop-blur-sm p-4 z-50 animate-in fade-in"
      style={{ backgroundColor: "var(--modal-overlay)" }}
    >
      <div
        className="rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]"
        style={{ backgroundColor: "var(--modal-bg)" }}
      >
        <div
          className="p-4 border-b flex justify-between items-center"
          style={{
            borderColor: "var(--modal-border)",
            backgroundColor: "var(--modal-header-bg)",
          }}
        >
          <h3 className="font-bold" style={{ color: "var(--modal-text)" }}>
            Share Post
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full transition-colors hover:bg-[var(--modal-hover-bg)]"
          >
            <X size={20} style={{ color: "var(--modal-text-secondary)" }} />
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
              className="absolute right-2 bottom-2 hover:text-yellow-500 transition-colors"
              style={{ color: "var(--modal-text-secondary)" }}
            >
              <Smile size={20} />
            </button>

            {/* Emoji picker popover */}
            {showPicker && (
              <div className="absolute right-0 bottom-full mb-2 z-50 shadow-xl">
                <div
                  className="fixed inset-0 z-0"
                  onClick={() => setShowPicker(false)}
                />{" "}
                {/* Backdrop */}
                <div className="relative z-10">
                  <EmojiPicker
                    onEmojiClick={handleEmojiClick}
                    width={300}
                    height={350}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={loading}
              className=" rounded-sm px-2 py-2"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className=" rounded-sm px-2 py-2"
            >
              Share Now
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
