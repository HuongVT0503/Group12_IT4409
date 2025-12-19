import { useEffect, useState } from "react";
import {
  getProfile,
  followUser,
  unfollowUser,
  getFollowing,
  getFollowers,
} from "../../services/userService";
import { useAuth } from "../../context/AuthContext";
import EditProfileModal from "../../components/profile/EditProfile";
import PostCard from "../../components/feed/PostCard";
import { getUserPosts } from "../../services/postService";
import { useParams, Link } from "react-router-dom";
import Button from "../../components/common/ButtonComponent"; //
import { UserPlus, UserCheck } from "lucide-react";
import CreatePost from "../../components/feed/CreatePost";

export default function ProfilePage() {
  const { id } = useParams(); //id from url

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { user, updateUser } = useAuth();
  const [posts, setPosts] = useState([]);

  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const targetId = id || user?.id; //url id or user id

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

  //fetch posts &stats
  useEffect(() => {
    if (!profile?.id) return;

    Promise.all([
      getUserPosts(profile.id),
      getFollowers(profile.id),
      getFollowing(profile.id),
    ])
      .then(([postsRes, followersRes, followingRes]) => {
        //similar to feedpage
        const formattedPosts = postsRes.data.posts.map((item) => {
          const sharedObj = item.sharedPost;
          return {
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
              shares: item.stats.shares || 0,
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
                    name:
                      sharedObj.author.display_name ||
                      sharedObj.author.username,
                    avatar: sharedObj.author.avatar_url,
                  },
                }
              : null,
          };
        });
        setPosts(formattedPosts);

        //update w stats
        setProfile((prev) => ({
          ...prev,
          stats: {
            ...prev?.stats,
            posts: formattedPosts.length, //count from posts array
            followers: followersRes.data.data.length, //count from api
            following: followingRes.data.data.length, //count from api
          },
        }));
      })
      .catch(console.error);
  }, [profile?.id]);

  //check follow status
  useEffect(() => {
    //logged in, profile loaded, AND looking at so else'
    if (user?.id && profile?.id && user.id !== profile.id) {
      //fetch list of everyone I follow
      getFollowing(user.id)
        .then((res) => {
          const myFollowing = res.data.data || [];
          const isFound = myFollowing.some((u) => u.id === profile.id);
          setIsFollowing(isFound);
        })
        .catch((err) => console.error("Failed to check follow status", err));
    }
  }, [user?.id, profile?.id]);

  //////////////////////////////

  const calculateAge = (dob) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const ageDifMs = Date.now() - birthDate.getTime(); //total duration of life in ms
    const ageDate = new Date(ageDifMs);  //convert to years since Unix Epoch (1/1/1970) . for example 1yo=1971yo
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  const handleProfileUpdate = (updatedUser) => {
    setProfile((prev) => ({ ...prev, ...updatedUser }));
    if (user.id === updatedUser.id) updateUser(updatedUser); //
  };



  const handlePostCreated = (newPostData) => {
      // newPostData from CreatePost -> { post: {...}, author: {...} }
      //format to match PostCard expectations
      const formatted = {
          id: newPostData.post.id,
          content: newPostData.post.content,
          timestamp: newPostData.post.created_at,
          image: newPostData.post.media?.[0] || null,
          author: {
              id: newPostData.author.id,
              name: newPostData.author.display_name || newPostData.author.username,
              handle: newPostData.author.username,
              avatar: newPostData.author.avatar_url,
          },
          stats: { //initialize
              likes: 0,
              comments: 0,
              shares: 0,
          },
          sharedPost: null
      };

      //add to top of list
      setPosts(prev => [formatted, ...prev]);
      
      //+1 post count
      setProfile(prev => ({
          ...prev,
          stats: {
              ...prev.stats,
              posts: (prev.stats?.posts || 0) + 1
          }
      }));
  };

  const handlePostDelete = (deletedPostId) => {
    setPosts((prevPosts) => prevPosts.filter((p) => p.id !== deletedPostId));

    setProfile((prev) => ({
      ...prev,
      stats: {
        ...prev.stats,
        posts: Math.max(0, (prev.stats?.posts || 0) - 1),
      },
    }));
  };

  ///
  const handleFollowToggle = async () => {
    if (!profile?.id) return;
    setFollowLoading(true);

    try {
      if (isFollowing) {
        await unfollowUser(profile.id);
        setIsFollowing(false);

        setProfile((prev) => ({
          ...prev,
          stats: {
            ...prev.stats,
            followers: Math.max(0, (prev.stats?.followers || 0) - 1),
          },
        }));
      } else {
        await followUser(profile.id);
        setIsFollowing(true);

        setProfile((prev) => ({
          ...prev,
          stats: { ...prev.stats, followers: (prev.stats?.followers || 0) + 1 },
        }));
      }
    } catch (error) {
      console.error("Follow action failed", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading)
    return (
      <div className="p-8 text-center animate-pulse">Loading profile...</div>
    );
  if (!profile) return <div className="p-8 text-center">User not found</div>;

  const isOwnProfile = profile.id === user?.id;

  return (
    <div className="w-full max-w-5xl mx-auto bg-white min-h-screen shadow-sm border-x border-gray-100 pb-10">
      <div
        className="h-60 lg:h-80 bg-cover bg-center w-full relative"
        style={{
          backgroundImage: `url(${
            profile.cover_url || "https://ui-avatars.com/api/?name="+ profile.display_name + "&background=random&size=800"
          })`,
          backgroundColor: "#a0a0a0",
        }}
      ></div>

      <div className="px-6 lg:px-10">
        <div className="relative flex justify-between items-end -mt-16 mb-6">
          <img
            src={
              profile.avatar_url ||
              `https://ui-avatars.com/api/?name=${profile.display_name}`
            }
            alt="Avatar"
            className="w-32 h-32 2xl:w-40 2xl:h-40 rounded-full border-4 border-white object-cover bg-white shadow-sm"
          />
          {isOwnProfile ? (
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="mb-2 px-6 py-2 bg-white border border-gray-200 hover:bg-gray-50 rounded-full font-bold text-sm transition-colors shadow-sm text-gray-700"
            >
              Edit Profile
            </button>
          ) : (
            <div className="mb-2">
              <Button
                onClick={handleFollowToggle}
                loading={followLoading}
                variant={isFollowing ? "outline" : "primary"}
                className={`rounded-full px-6 h-10 text-sm ${
                  isFollowing
                    ? "border-red-200 text-red-600 hover:bg-red-50"
                    : ""
                }`}
              >
                {isFollowing ? (
                  <>
                    <UserCheck size={18} className="mr-2" />
                    Following
                  </>
                ) : (
                  <>
                    <UserPlus size={18} className="mr-2" />
                    Follow
                  </>
                )}
              </Button>
            </div>
          )}
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

        <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-6">
          {profile.gender && (
            <span className="flex items-center gap-1 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
              Gender:{" "}
              <span className="font-medium text-gray-700 capitalize">
                {profile.gender}
              </span>
            </span>
          )}

          {profile.date_of_birth && (
            <span className="flex items-center gap-1 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
              Age:{" "}
              <span className="font-medium text-gray-700">
                {calculateAge(profile.date_of_birth)}
              </span>
            </span>
          )}

          {/*show phone only in own page */}
          {isOwnProfile && profile.phone && (
            <span className="flex items-center gap-1 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
              Phone:{" "}
              <span className="font-medium text-gray-700">{profile.phone}</span>
            </span>
          )}
        </div>

        <div className="flex gap-8 border-y border-gray-100 py-4">
          <div className="text-center cursor-pointer hover:opacity-75">
            <span className="font-bold block text-lg text-black">
              {profile.stats?.posts || 0}
            </span>
            <span className="text-gray-500 text-sm">Posts</span>
          </div>
          <Link
            to="/connections"
            state={{ targetId: profile.id, initialTab: "followers" }}
            className="text-center cursor-pointer hover:opacity-75"
          >
            <span className="font-bold block text-lg text-black">
              {profile.stats?.followers || 0}
            </span>
            <span className="text-gray-500 text-sm">Followers</span>
          </Link>
          <Link
            to="/connections"
            state={{ targetId: profile.id, initialTab: "following" }}
            className="text-center cursor-pointer hover:opacity-75"
          >
            <span className="font-bold block text-lg text-black">
              {profile.stats?.following || 0}
            </span>
            <span className="text-gray-500 text-sm">Following</span>
          </Link>
        </div>

        <div className="flex flex-col gap-4 mt-6">

          {isOwnProfile && (
             <CreatePost onPostCreated={handlePostCreated} />
          )}

          {posts.length > 0 ? (
            posts.map((post) => (
              <PostCard key={post.id} post={post} onDelete={handlePostDelete} />
            ))
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
