import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PostCard from "../../components/feed/PostCard";
import { getPost } from "../../services/postService";
import { ArrowLeft } from "lucide-react";

export default function PostDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const sharedObj = post?.sharedPost;

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await getPost(id);
        const raw = res.data.post; // {post, author, stats}
        //format similar to FeedPage
        
        const formatted = {
            id: raw.post.id,
            content: raw.post.content,
            timestamp: raw.post.created_at,
            image: raw.post.media?.[0] || null,
            author: {
                id: raw.author.id,
                name: raw.author.display_name || raw.author.username,
                handle: raw.author.username,
                avatar: raw.author.avatar_url,
            },
            stats: {
                likes: raw.stats.likes || 0,
                comments: raw.stats.comments || 0,
                shares: 0
            },
            //map shared post
      sharedPost: sharedObj
        ? {
            id: sharedObj.id,
            content: sharedObj.content,
            image:
              sharedObj.media && sharedObj.media.length > 0
                ? sharedObj.media[0]
                : null,
            timestamp: sharedObj.created_at,
            author: {
              id: sharedObj.author.id,
              name: sharedObj.author.display_name || sharedObj.author.username,
              avatar: sharedObj.author.avatar_url,
            },
          }
        : null,
        };
        setPost(formatted);
      } catch (err) {
        console.error(err);
        setError("Failed to load post.");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchPost();
  }, [id]);

  return (
    <div className="max-w-xl mx-auto pt-6 px-4 pb-20">
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center gap-2 text-gray-500 hover:text-primary mb-4 font-medium transition-colors"
      >
        <ArrowLeft size={20} /> Back
      </button>

      {loading && <div className="text-center py-10">Loading post...</div>}
      
      {error && (
        <div className="text-center py-10 bg-red-50 text-red-600 rounded-xl">
            {error}
        </div>
      )}

      {post && <PostCard post={post} />}
    </div>
  );
}