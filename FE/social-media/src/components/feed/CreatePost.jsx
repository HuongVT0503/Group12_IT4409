import { useState } from 'react';
import Button from '../common/ButtonComponent';
import { createPost } from '../../services/postService';
import { useAuth } from '../../context/AuthContext';

export default function CreatePost({ onPostCreated }) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const user = useAuth();  //JSON.parse(localStorage.getItem('user')) || {};

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setLoading(true);
    try {
      const res = await createPost(content);
      setContent("");
      //api returns {post:{...},author:{...}}
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
        src={user?.avatar_url || `https://ui-avatars.com/api/?name=${user?.display_name}`}
        className="w-10 h-10 rounded-full bg-gray-200 object-cover"
        alt="Me"
      />
      <div className="flex-1 flex flex-col gap-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={`What's on your mind, ${user?.display_name?.split(' ')[0]}?`}
          className="w-full bg-gray-50 rounded-xl py-3 px-4 transition-colors text-sm font-medium outline-none resize-none focus:bg-white focus:ring-1 focus:ring-primary/20"
          rows={2}
        />
        <div className="flex justify-end">
          <Button size="sm" onClick={handleSubmit} loading={loading} disabled={!content.trim()}>
            Post
          </Button>
        </div>
      </div>
    </div>
  );
}