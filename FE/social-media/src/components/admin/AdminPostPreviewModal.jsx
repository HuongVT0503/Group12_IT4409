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
        image:
          actualPost.media && actualPost.media.length > 0
            ? actualPost.media[0]
            : actualPost.image || actualPost.media_url,

        author: {
          id: actualAuthor.id || actualAuthor.userId,
          name:
            actualAuthor.display_name ||
            actualAuthor.username ||
            actualAuthor.name,
          handle: actualAuthor.username || actualAuthor.handle,
          avatar: actualAuthor.avatar_url || actualAuthor.avatar,
        },
        stats: data.stats ||
          actualPost.stats || { likes: 0, comments: 0, shares: 0 },
        isLiked: false, // ReadOnly view

        sharedPost: sharedObj
          ? {
              id: sharedObj.id,
              content: sharedObj.content,
              image:
                sharedObj.media && sharedObj.media.length > 0
                  ? sharedObj.media[0]
                  : sharedObj.image || sharedObj.media_url,
              timestamp: sharedObj.created_at,
              author: {
                id: sharedObj.author?.id,
                name: sharedObj.author?.display_name || sharedObj.author?.name,
                avatar:
                  sharedObj.author?.avatar_url || sharedObj.author?.avatar,
              },
            }
          : null,
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div
        className="rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
        style={{
          backgroundColor: "var(--admin-card-bg)",
          borderColor: "var(--admin-card-border)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 border-b"
          style={{
            backgroundColor: "var(--admin-table-header-bg)",
            borderColor: "var(--admin-card-border)",
          }}
        >
          <h3
            className="font-bold flex items-center gap-2"
            style={{ color: "var(--admin-text-primary)" }}
          >
            <ImageIcon size={20} className="text-purple-600" />
            Post Preview (Read-Only)
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full transition-colors"
            style={{ color: "var(--admin-text-secondary)" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor =
                "var(--admin-table-row-hover)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            <X size={24} />
          </button>
        </div>

        {/* Content Body */}
        <div
          className="p-0 overflow-y-auto flex-1"
          style={{ backgroundColor: "var(--admin-bg)" }}
        >
          {loading ? (
            <div
              className="flex flex-col items-center justify-center h-64"
              style={{ color: "var(--admin-text-secondary)" }}
            >
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
              <p
                className="text-center text-xs mt-6"
                style={{ color: "var(--admin-text-secondary)" }}
              >
                This is a preview. Interactive features are disabled.
              </p>
            </div>
          ) : null}
        </div>

        {/* Actions */}
        <div
          className="p-4 border-t flex justify-end gap-3"
          style={{
            backgroundColor: "var(--admin-card-bg)",
            borderColor: "var(--admin-card-border)",
          }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 font-semibold rounded-lg transition-colors"
            style={{
              backgroundColor: "var(--admin-table-header-bg)",
              color: "var(--admin-text-primary)",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor =
                "var(--admin-table-row-hover)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor =
                "var(--admin-table-header-bg)")
            }
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
