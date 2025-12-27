import { useState, useEffect } from "react";
import PostCard from "../../components/feed/PostCard";
//import Button from "../../components/common/ButtonComponent";
import CreatePost from "../../components/feed/CreatePost.jsx";
import { getFeed } from "../../services/postService";
import { useSocket } from "../../context/SocketContext";
import RightPanel from "../../components/layout/RightPanel.jsx";

export default function FeedPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const socket = useSocket();

  //helper to format raw BE data to fe
  //postRepository.js: { post: {...}, author: {...} }
  //map be data structure to frontend component expectations
  const formatPostData = (data) => {
    const postObj = data.post || data;
    const authorObj = data.author || {};
    const statsObj = data.stats || {};
    const sharedObj = data.sharedPost || null;

    return {
      id: postObj.id,
      content: postObj.content,
      isLiked: data.isLiked || false,
      timestamp: postObj.created_at, //keep ISO string, format will done by PostCard   //.toLocaleString(),
      image:
        postObj.media && postObj.media.length > 0 ? postObj.media[0] : null,
      author: {
        id: authorObj.id,
        name: authorObj.display_name || authorObj.username || "Unknown",
        handle: authorObj.username || "user",
        avatar:
          authorObj.avatar_url ||
          `https://ui-avatars.com/api/?name=${
            authorObj.display_name || "User"
          }`,
      },
      stats: {
        likes: statsObj.likes || 0,
        comments: statsObj.comments || 0,
        shares: statsObj.shares || 0,
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

      comments: [],
    };
  };

  const fetchPosts = async () => {
    try {
      const response = await getFeed();
      //be returns: { posts: [...] }
      //map backend data structure to frontend component expectations
      const formattedPosts = response.data.posts.map(formatPostData);
      setPosts(formattedPosts);
    } catch (err) {
      console.error(err);
      setError("Failed to load feed.");
    } finally {
      setLoading(false);
    }
  };

  //initialize
  useEffect(() => {
    fetchPosts();
  }, []);

  const handlePostCreated = (newPostData) => {
    const formatted = formatPostData(newPostData);
    setPosts((prev) => {
      if (prev.some((p) => p.id === formatted.id)) return prev;
      return [formatted, ...prev];
    });
  };

  const handlePostDelete = (postId) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  // Realtime listener for new posts
  useEffect(() => {
    if (!socket) return;

    //listener for 'new_post' event by be realtimeService.js
    const handleNewPost = (newPostData) => {
      const newPostFormatted = formatPostData(newPostData);

      //prepend
      setPosts((prevPosts) => {
        // Prevent duplicates
        if (prevPosts.some((p) => p.id === newPostFormatted.id))
          return prevPosts;
        return [newPostFormatted, ...prevPosts];
      });
    };

    socket.on("new_post", handleNewPost);
    return () => socket.off("new_post", handleNewPost);
  }, [socket]);

  if (loading) return <div className="text-center pt-10">Loading feed...</div>;
  if (error)
    return <div className="text-center pt-10 text-red-500">{error}</div>;

  return (
    <div className="w-full min-h-screen flex relative bg-gradient-feedpage">
      <div className="w-full flex justify-center">
        <div className="w-full max-w-2xl pt-8 px-4 sm:px-6 bg-primary-300/20 ">
          {/* Create Post Input */}

          <div className="relative">
            <CreatePost onPostCreated={handlePostCreated} />
          </div>
          {/* Feed List */}
          <div className="flex flex-col gap-4 relative z-[1]">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} onDelete={handlePostDelete} />
            ))}

            {posts.length === 0 && (
              <p className="text-center text-gray-500 mt-10">
                No posts yet. Be the first!
              </p>
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
