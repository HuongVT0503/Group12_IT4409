import { useEffect, useState } from "react";
import { getProfile } from "../../services/userService";
import { useAuth } from "../../context/AuthContext";
import EditProfileModal from "../../components/profile/EditProfile";
import PostCard from "../../components/feed/PostCard";
import { getUserPosts } from "../../services/postService";
import { useParams } from "react-router-dom"; 


export default function ProfilePage() {
  const { id } = useParams();//id from url

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);

  const targetId = id || user?.id;//url id or user id

  //fetch user profile
  useEffect(() => {
    if (!targetId) return;
    setLoading(true);


    getProfile(targetId)
      .then((res) => setProfile(res.data.user))
      .catch((err) => {
        console.error("Profile fetch error", err);
        //setProfile({ ...user });
      })
      .finally(() => setLoading(false));
  }, [targetId]);

  //fetch posts
  useEffect(() => {
    if (!profile?.id) return;

    getUserPosts(profile.id)
      .then((res) => {
        //similar to feedpage
        const formatted = res.data.posts.map((item) => ({
          id: item.post.id,
          content: item.post.content,
          timestamp: item.post.created_at,
          image: item.post.media?.[0] || null,
          author: {
            id: item.author.id,
            name: item.author.display_name,
            handle: item.author.username,
            avatar: item.author.avatar_url,
          },
          stats: { 
            likes: item.stats.likes || 0,
            comments: item.stats.comments || 0,
            shares: 0
          },
        }));
        setPosts(formatted);
      })
      .catch(console.error);
  }, [profile]);

  const handleProfileUpdate = (updatedUser) => {
    setProfile((prev) => ({ ...prev, ...updatedUser }));
  };

  if (loading)
    return (
      <div className="p-8 text-center animate-pulse">Loading profile...</div>
    );
  if (!profile) return <div className="p-8 text-center">User not found</div>;

  const isOwnProfile = profile.id === user?.id;

  return (
    <div className="max-w-2xl mx-auto bg-white min-h-screen shadow-sm border-x border-gray-100 pb-10">
      <div
        className="h-48 bg-cover bg-center w-full relative"
        style={{
          backgroundImage: `url(${
            profile.cover_url || "https://via.placeholder.com/800x200"
          })`,
          backgroundColor: "#a0a0a0",
        }}
      ></div>

      <div className="px-6">
        <div className="relative flex justify-between items-end -mt-12 mb-4">
          <img
            src={
              profile.avatar_url ||
              `https://ui-avatars.com/api/?name=${profile.display_name}`
            }
            alt="Avatar"
            className="w-32 h-32 rounded-full border-4 border-white object-cover bg-white shadow-sm"
          />
          {isOwnProfile&&(
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="mb-2 px-6 py-2 bg-white border border-gray-200 hover:bg-gray-50 rounded-full font-bold text-sm transition-colors shadow-sm text-gray-700"
          >
            Edit Profile
          </button>)}
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {profile.display_name}
          </h1>
          <p className="text-gray-500 font-medium">@{profile.username}</p>
        </div>

        {profile.bio && (
          <p className="mb-6 text-gray-700 leading-relaxed">{profile.bio}</p>
        )}

        <div className="flex gap-8 border-y border-gray-100 py-4">
          <div className="text-center cursor-pointer hover:opacity-75">
            <span className="font-bold block text-lg text-black">
              {profile.stats?.posts || 0}
            </span>
            <span className="text-gray-500 text-sm">Posts</span>
          </div>
          <div className="text-center cursor-pointer hover:opacity-75">
            <span className="font-bold block text-lg text-black">
              {profile.stats?.followers || 0}
            </span>
            <span className="text-gray-500 text-sm">Followers</span>
          </div>
          <div className="text-center cursor-pointer hover:opacity-75">
            <span className="font-bold block text-lg text-black">
              {profile.stats?.following || 0}
            </span>
            <span className="text-gray-500 text-sm">Following</span>
          </div>
        </div>

        <div className="flex flex-col gap-4 mt-6">
          {posts.length > 0 ? (
            posts.map((post) => <PostCard key={post.id} post={post} />)
          ) : (
            <div className="text-center text-gray-400 py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              No posts yet.
            </div>
          )}
        </div>
      </div>
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        currentUser={profile}
        onUpdateSuccess={handleProfileUpdate}
      />
    </div>
  );
}
