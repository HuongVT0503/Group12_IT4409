import { useState, useRef } from "react";
import { createPost } from "../../services/postService";
import { useAuth } from "../../context/AuthContext";
import { uploadMedia } from "../../services/mediaService";
import {
  Image,
  X,
  Smile,
  //Video
} from "lucide-react";
import Avatar from "../common/Avatar";
import { Button } from "@heroui/react";
import EmojiPicker from "emoji-picker-react";
import { useTheme } from "../../context/ThemeContext";

export default function CreatePost({ onPostCreated }) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const { user } = useAuth(); //JSON.parse(localStorage.getItem('user')) || {};
  const { theme } = useTheme();
  const fileInputRef = useRef(null);

  const onEmojiClick = (emojiData) => {
    setContent((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!content.trim() && !selectedFile) return;
    setLoading(true);
    try {
      let mediaUrl = null;

      //upload image if selected
      if (selectedFile) {
        const uploaded = await uploadMedia(selectedFile);
        mediaUrl = uploaded.url;
        //get url from be resp
      }

      //create post w content n media URL
      const res = await createPost(content, mediaUrl);

      setContent("");
      clearFile();

      if (onPostCreated) onPostCreated(res.data?.post || res.post);
    } catch (error) {
      console.error("Failed to post", error);
      alert("Failed to post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: "var(--post-card-bg)",
        borderColor: "var(--post-card-border)",
        boxShadow: `0 8px 32px var(--post-card-shadow)`,
      }}
      className="flex gap-4 items-start backdrop-blur-md rounded-2xl p-5 border"
    >
      <Avatar
        src={
          user?.avatar_url ||
          `https://ui-avatars.com/api/?name=${user?.display_name}`
        }
        alt="me"
        size={11}
      />

      <div className="flex-1 flex flex-col gap-2 relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={`What's on your mind, ${
            user?.display_name?.split(" ")[0]
          }?`}
          style={{
            background: "var(--post-input-bg)",
            color: "var(--post-text)",
          }}
          className="w-full rounded-xl py-3 px-4 transition-all text-sm font-medium outline-none resize-none focus:[background:var(--post-input-focus-bg)] focus:ring-2 focus:ring-[var(--post-icon-primary)]/40 focus:shadow-lg placeholder:text-[var(--post-text-secondary)]"
          rows={3}
        />

        {/*img */}
        {previewUrl && (
          <div className="relative w-full mt-2 ">
            {selectedFile?.type?.startsWith("video/") ? (
              <video
                src={previewUrl}
                controls
                className="w-full max-sm:max-h-60 max-h-64 object-cover rounded-xl border border-gray-200/60 shadow-md"
              />
            ) : (
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full max-sm:max-h-60 max-h-64 object-cover rounded-xl border border-gray-200/60 shadow-md"
              />
            )}
            <button
              onClick={clearFile}
              className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        )}

        <div
          style={{ borderTopColor: "var(--post-border)" }}
          className="flex items-center justify-between pt-2 border-t "
        >
          <div className="flex items-center gap-2">
            <label
              htmlFor="images"
              style={{ color: "var(--post-icon-primary)" }}
              className="hover:opacity-80 rounded-full transition-all hover:scale-110 cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="flex gap-2">
                <Image size={25} />
              </div>
            </label>
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              style={{ color: "var(--post-icon-smile)" }}
              className="hover:opacity-80 rounded-full transition-all hover:scale-110 cursor-pointer"
            >
              <Smile size={25} />
            </button>
          </div>
          {showEmojiPicker && (
            <div className="absolute top-full left-0 mt-2 z-[100]">
              <div
                className="fixed inset-0 z-[90]"
                onClick={() => setShowEmojiPicker(false)}
              />
              <div className="relative z-[100]">
                <EmojiPicker
                  onEmojiClick={onEmojiClick}
                  width={300}
                  height={350}
                />
              </div>
            </div>
          )}
          <input
            type="file"
            name="image"
            id="image"
            accept="image/*,video/*"
            hidden
            onChange={handleFileSelect}
            ref={fileInputRef}
          />
          <Button
            size="md"
            onPress={handleSubmit}
            disabled={!content.trim() && !selectedFile}
            loading={loading}
            style={{ background: "var(--post-button-bg)" }}
            className="text-white shadow-md hover:brightness-110 rounded-lg px-5 py-3 font-semibold"
          >
            Post
          </Button>
        </div>
      </div>
    </div>
  );
}
