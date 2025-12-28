// FE/social-media/src/components/admin/AdminPostPreviewModal.jsx

import { useEffect, useState } from "react";
import { X, Image as ImageIcon } from "lucide-react";
import api from "../../services/api";
import { createPortal } from "react-dom";
import PostCard from "../feed/PostCard";

export default function AdminPostPreviewModal({ isOpen, onClose, postId }) {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && postId) {
      fetchPostDetails();
    } else {
      setPost(null);
    }
  }, [isOpen, postId]);


  const fetchPostDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/posts/${postId}`);
      
      const data = res.data.post || res.data; 

      const actualPost = data.post || data; 
      const actualAuthor = data.author || actualPost.author || {};
      const sharedObj = data.sharedPost || actualPost.sharedPost;

      const formattedPost = {
        id: actualPost.id,
        content: actualPost.content,
        timestamp: actualPost.created_at || actualPost.timestamp, 
        image: actualPost.media && actualPost.media.length > 0 
          ? actualPost.media[0] 
          : (actualPost.image || actualPost.media_url),
        
        author: {
            id: actualAuthor.id || actualAuthor.userId,
            name: actualAuthor.display_name || actualAuthor.username || actualAuthor.name,
            handle: actualAuthor.username || actualAuthor.handle,
            avatar: actualAuthor.avatar_url || actualAuthor.avatar
        },
        stats: data.stats || actualPost.stats || { likes: 0, comments: 0, shares: 0 },
        isLiked: false, // Read-only view
        
        sharedPost: sharedObj ? {
            id: sharedObj.id,
            content: sharedObj.content,
            image: sharedObj.media && sharedObj.media.length > 0 
              ? sharedObj.media[0] 
              : (sharedObj.image || sharedObj.media_url),
            timestamp: sharedObj.created_at,
            author: {
                id: sharedObj.author?.id,
                name: sharedObj.author?.display_name || sharedObj.author?.name,
                avatar: sharedObj.author?.avatar_url || sharedObj.author?.avatar
            }
        } : null
      };

      setPost(formattedPost);
    } catch (err) {
      console.error("Failed to fetch post preview", err);
      setError("Content unavailable. The post may have been deleted.");
    } finally {
      setLoading(false);
    }
  };



  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <ImageIcon size={20} className="text-purple-600" />
            Post Preview (Read-Only)
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-0 overflow-y-auto bg-gray-100/50 flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mb-2"></div>
              Loading content...
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 text-red-500 gap-2">
              <span className="bg-red-100 p-3 rounded-full">
                <X size={32} />
              </span>
              <p>{error}</p>
            </div>
          ) : post ? (
            <div className="p-6">
                <div className="max-w-xl mx-auto"> 
                    <PostCard post={post} readOnly={true} />
                </div>
                <p className="text-center text-xs text-gray-400 mt-6">
                    This is a preview. Interactive features are disabled.
                </p>
            </div>
          ) : null}
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-100 bg-white flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}