import { useState, useEffect } from "react";
import PostCard from "../../components/feed/PostCard";
//import Button from "../../components/common/ButtonComponent";
import CreatePost from "../../components/feed/CeatePost.jsx";
import { getFeed } from "../../services/postService";
import {useSocket} from "../../context/SocketContext";


export default function FeedPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const socket = useSocket();

  //helper to format raw BE data to fe
  //postRepository.js: { post: {...}, author: {...} }
  //map backend data structure to frontend component expectations
  const formatPostData = (data) => {
    const postObj = data.post || data; 
    const authorObj = data.author || {};

    return {
      id: postObj.id,
      content: postObj.content,
      timestamp: postObj.created_at, //keep ISO string, format will done by PostCard   //.toLocaleString(),
      image: postObj.media && postObj.media.length > 0 ? postObj.media[0] : null,
      author: {
        id: authorObj.id,
        name: authorObj.display_name || authorObj.username || "Unknown",
        handle: authorObj.username || "user",
        avatar: authorObj.avatar_url || `https://ui-avatars.com/api/?name=${authorObj.display_name || 'User'}`
      },
      stats: { likes: 0, comments: 0, shares: 0 }, //be doesn't send counts in feed yet, defaulting///////
      comments: []
    };
  };

  const fetchPosts = async () => {
    try {
      const data = await getFeed();
      //be returns: { posts: [...] }
      //map backend data structure to frontend component expectations
      const formattedPosts = data.posts.map ( formatPostData );
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
    setPosts(prev => {
        if (prev.some(p => p.id === formatted.id)) return prev;
        return [formatted, ...prev];
    });
  };

  const handlePostDelete = (postId) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  }

  // Realtime listener for new posts
  useEffect(() => {
    if(!socket) return;

    //listener for 'new_post' event by be realtimeService.js
    const handleNewPost = (newPostData) => {
      const newPostFormatted = formatPostData(newPostData);
      
      //prepend
      setPosts((prevPosts) => {
        // Prevent duplicates
        if (prevPosts.some(p => p.id === newPostFormatted.id)) return prevPosts;
        return [newPostFormatted, ...prevPosts];
      });
    };

    socket.on('new_post', (handleNewPost));
    return () => socket.off('new_post', handleNewPost);
  }, [socket]);



  if (loading) return <div className="text-center pt-10">Loading feed...</div>;
  if (error)
    return <div className="text-center pt-10 text-red-500">{error}</div>;


  //////////////////////////////
  return (
    <div className="w-full min-h-screen bg-[#F3F4F6] pb-20 lg:pb-0">
      
      <div className="max-w-xl mx-auto pt-6 px-4">
        {/* Create Post Input */}

        <CreatePost onPostCreated={handlePostCreated} />


        {/*<div className="bg-white rounded-2xl shadow-sm p-4 mb-6 flex gap-3 items-center">
          <img
            src="https://i.pravatar.cc/150?u=me"
            className="w-10 h-10 rounded-full bg-gray-200"
            alt="Me"
          />
          <button className="flex-1 text-left bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-full py-3 px-5 transition-colors text-sm font-medium">
            Whats on your mind?
          </button>
          <Button size="sm" className="hidden sm:flex">
            Post
          </Button>
        </div>*/}


        {/* Feed List */}
        <div className="flex flex-col gap-2">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} onDelete={handlePostDelete}/>
          ))}

        

          {posts.length === 0 && (
            <p className="text-center text-gray-500 mt-10">No posts yet. Be the first!</p>
          )}

        </div>
      </div>
    </div>
  );
}
