import { useState, useRef } from "react";
import Button from "../common/ButtonComponent";
import { createPost } from "../../services/postService";
import { useAuth } from "../../context/AuthContext";
import { uploadMedia } from "../../services/mediaService";
import { Image, X } from "lucide-react";

export default function CreatePost({ onPostCreated }) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const { user } = useAuth(); //JSON.parse(localStorage.getItem('user')) || {};
  const fileInputRef = useRef(null);

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
    <div className="bg-white rounded-2xl shadow-sm p-4 mb-6 flex gap-3 items-start border border-gray-100">
      <img
        src={
          user?.avatar_url ||
          `https://ui-avatars.com/api/?name=${user?.display_name}`
        }
        className="w-10 h-10 rounded-full bg-gray-200 object-cover"
        alt="Me"
      />
      <div className="flex-1 flex flex-col gap-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={`What's on your mind, ${
            user?.display_name?.split(" ")[0]
          }?`}
          className="w-full bg-gray-50 rounded-xl py-3 px-4 transition-colors text-sm font-medium outline-none resize-none focus:bg-white focus:ring-1 focus:ring-primary/20"
          rows={2}
        />

        {/*img */}
        {previewUrl && (
          <div className="relative w-full mt-2">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full max-h-60 object-cover rounded-xl border border-gray-100"
            />
            <button
              onClick={clearFile}
              className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div className="flex justify-between items-center mt-1">
          {/* File Input */}
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors"
              title="Add Image"
            >
              <Image size={20} />
            </button>
          </div>
        </div>
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={handleSubmit}
            loading={loading}
            disabled={!content.trim() && !selectedFile}
          >
            Post
          </Button>
        </div>
      </div>
    </div>
  );
}
