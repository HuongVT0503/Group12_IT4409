import { useState, useEffect } from "react";
import PostCard from "../../components/feed/PostCard";
import { getSavedPosts } from "../../services/postService";
import RightPanel from "../../components/layout/RightPanel.jsx";
import { Bookmark } from "lucide-react";

export default function SavedPostsPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const formatPostData = (data) => {
    const postObj = data.post || data;
    const authorObj = data.author || {};
    const statsObj = data.stats || {};
    const sharedObj = data.sharedPost || null;

    return {
      id: postObj.id,
      content: postObj.content,
      isLiked: data.isLiked || false,
      isSaved: true, 
      timestamp: postObj.created_at,
      image: postObj.media && postObj.media.length > 0 ? postObj.media[0] : null,
      author: {
        id: authorObj.id,
        name: authorObj.display_name || authorObj.username || "Unknown",
        handle: authorObj.username || "user",
        avatar: authorObj.avatar_url,
      },
      stats: {
        likes: statsObj.likes || 0,
        comments: statsObj.comments || 0,
        shares: statsObj.shares || 0,
      },
      sharedPost: sharedObj
        ? {
            id: sharedObj.id,
            content: sharedObj.content,
            image: sharedObj.media?.[0] || null,
            timestamp: sharedObj.created_at,
            author: {
              id: sharedObj.author.id,
              name: sharedObj.author.display_name,
              avatar: sharedObj.author.avatar_url,
            },
          }
        : null,
    };
  };

  const fetchSavedPosts = async () => {
    try {
      const response = await getSavedPosts();
      const formattedPosts = response.data.posts.map(formatPostData);
      setPosts(formattedPosts);
    } catch (err) {
      console.error(err);
      setError("Failed to load saved posts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedPosts();
  }, []);

  const handlePostDelete = (postId) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  if (loading)
    return (
      <div style={{ color: "var(--feed-loading-text)" }} className="text-center pt-10">
        Loading saved posts...
      </div>
    );

  return (
    <div style={{ background: "var(--feed-bg)" }} className="w-full min-h-screen flex relative">
      <div className="w-full flex justify-center">
        <div className="w-full max-w-2xl pt-8 px-4 sm:px-6">
          
          <div className="mb-6 flex items-center gap-2">
             <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                <Bookmark size={24} />
             </div>
             <h1 style={{ color: "var(--feed-text)" }} className="text-2xl font-bold">
                Saved Posts
             </h1>
          </div>

          {error && <div className="text-red-500 text-center">{error}</div>}

          <div className="flex flex-col gap-4 pb-10">
            {posts.length > 0 ? (
              posts.map((post) => (
                <PostCard key={post.id} post={post} onDelete={handlePostDelete} />
              ))
            ) : (
              <div style={{ color: "var(--feed-empty-text)" }} className="text-center mt-10 py-10 bg-white/50 rounded-xl border border-gray-200/50">
                <p>{"You haven't saved any posts yet."}</p>
              </div>
            )}
          </div>
        </div>
        
        <aside className="hidden xl:block w-[320px] h-[calc(100vh-80px)] overflow-y-auto no-scrollbar sticky top-20 ml-10">
          <RightPanel />
        </aside>
      </div>
    </div>
  );
}