import { useEffect, useState } from "react";
import {
  getProfile,
  followUser,
  unfollowUser,
  getFollowing,
  getFollowers,
} from "../../services/userService";
import { getOrCreateConversation } from "../../services/chatService";

import { useAuth } from "../../context/AuthContext";
import EditProfileModal from "../../components/profile/EditProfile";
import PostCard from "../../components/feed/PostCard";
import { getUserPosts } from "../../services/postService";
import { useParams, Link, useNavigate } from "react-router-dom";
import Button from "../../components/common/ButtonComponent"; //
import {
  UserPlus,
  UserCheck,
  MoreHorizontal,
  Flag,
  ShieldAlert,
  MessageCircle,
} from "lucide-react";
import CreatePost from "../../components/feed/CreatePost";
import Avatar from "../../components/common/Avatar";
import ReportModal from "../../components/common/ReportModal";
import { useSocketContext } from "../../context/SocketContext";
//import { useTheme } from "../../context/ThemeContext";

export default function ProfilePage() {
  const { id } = useParams(); //id from url
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { user, updateUser } = useAuth();
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState(null);

  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const [isReportOpen, setIsReportOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const { isUserOnline } = useSocketContext();
  //const { theme } = useTheme();

  const [isLgScreen, setIsLgScreen] = useState(
    typeof window !== "undefined" ? window.innerWidth >= 1024 : false
  );

  const [messageLoading, setMessageLoading] = useState(false);

  const handleMessage = async () => {
    if (!profile?.id) return;
    setMessageLoading(true);
    try {
      const res = await getOrCreateConversation(profile.id);
      if (res.data?.success && res.data?.conversation) {
        const conversationData = {
          ...res.data.conversation,
          otherUser: profile, //pass current profile as the other user
        };
        navigate(`/chat/${res.data.conversation.id}`, {
          state: {
            conversation: conversationData,
          },
        });
      }
    } catch (err) {
      console.error("Failed to open chat", err);
      // Optional: alert("Could not open chat");
    } finally {
      setMessageLoading(false);
    }
  };

  const targetId = id || user?.id; //url id or user id

  //fetch user profile
  useEffect(() => {
    if (!targetId) return;
    setLoading(true);
    setError(null);
    setIsBanned(false);

    getProfile(targetId)
      .then((res) => setProfile(res.data.user))
      .catch((err) => {
        console.error("Profile fetch error", err);
        //setProfile({ ...user });

        const errorMessage = err?.error?.message || err?.message;

        if (
          errorMessage === "User not exist" ||
          (err.response && err.response.status === 403)
        ) {
          setError("You do not have permission to view this profile.");
          setIsBanned(true);
        } else {
          setError("Failed to load profile.");
        }
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
            isLiked: item.isLiked || false,
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => setIsLgScreen(window.innerWidth >= 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  //////////////////////////////

  const calculateAge = (dob) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const ageDifMs = Date.now() - birthDate.getTime(); //total duration of life in ms
    const ageDate = new Date(ageDifMs); //convert to years since Unix Epoch (1/1/1970) . for example 1yo=1971yo
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
      stats: {
        //initialize
        likes: 0,
        comments: 0,
        shares: 0,
      },
      sharedPost: null,
    };

    //add to top of list
    setPosts((prev) => [formatted, ...prev]);

    //+1 post count
    setProfile((prev) => ({
      ...prev,
      stats: {
        ...prev.stats,
        posts: (prev.stats?.posts || 0) + 1,
      },
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
      <div
        style={{ color: "var(--profile-text-secondary)" }}
        className="p-8 text-center animate-pulse"
      >
        Loading profile...
      </div>
    );

  if (isBanned) {
    return (
      <div
        style={{ backgroundColor: "var(--profile-bg)" }}
        className="w-full min-h-screen flex items-center justify-center p-4"
      >
        <div
          style={{
            backgroundColor: "var(--profile-card-bg)",
            borderColor: "var(--profile-border)",
          }}
          className="text-center max-w-md p-8 rounded-2xl shadow-sm border"
        >
          <div
            style={{
              backgroundColor: "var(--profile-empty-bg)",
              color: "var(--profile-text-secondary)",
            }}
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <ShieldAlert size={40} />
          </div>
          <h2
            style={{ color: "var(--profile-text-primary)" }}
            className="text-2xl font-bold mb-2"
          >
            Account Suspended
          </h2>
          <p
            style={{ color: "var(--profile-text-secondary)" }}
            className="mb-6"
          >
            This account has been suspended for violating our Community
            Guidelines.
          </p>
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="mx-auto"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (error)
    return (
      <div
        style={{ color: "var(--feed-error-text)" }}
        className="p-8 text-center font-semibold"
      >
        {error}
      </div>
    );

  if (!profile)
    return (
      <div
        style={{ color: "var(--profile-text-secondary)" }}
        className="p-8 text-center"
      >
        User not found
      </div>
    );

  const isOwnProfile = profile.id === user?.id;

  return (
    <div
      style={{ backgroundColor: "var(--profile-bg)" }}
      className="w-full min-h-screen flex justify-center"
    >
      <div className="w-full max-w-3xl flex flex-col items-center px-4 sm:px-6 relative">
        <div
          style={{
            backgroundColor: "var(--profile-card-bg)",
            boxShadow: `0 1px 2px var(--profile-card-shadow)`,
          }}
          className="w-full mb-4 rounded-lg mt-4"
        >
          <div
            className="h-48 lg:h-64 bg-cover bg-center w-full relative overflow-hidden rounded-t-lg"
            style={{
              backgroundImage: `url(${
                profile.cover_url ||
                "https://ui-avatars.com/api/?name=" +
                  profile.display_name +
                  "&background=random&size=800"
              })`,
              backgroundColor: "var(--profile-cover-fallback)",
            }}
          ></div>

          <div className="lg:px-8 px-4">
            <div className="relative flex justify-between items-end lg:-mt-16 -mt-14 mb-4 ">
              <div className="relative">
                <Avatar
                  src={
                    profile.avatar_url ||
                    `https://ui-avatars.com/api/?name=${profile.display_name}`
                  }
                  size={isLgScreen ? 32 : 28}
                  alt="Avatar"
                  className="ring-3 ring-white shadow-md"
                />
                {isUserOnline(profile.id) && (
                  <span
                    title="Online"
                    style={{
                      backgroundColor: "var(--profile-online-indicator)",
                      borderColor: "var(--profile-card-bg)",
                    }}
                    className="absolute bottom-2 right-2 w-5 h-5 border-4 rounded-full"
                  ></span>
                )}
              </div>
              {isOwnProfile ? (
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  style={{
                    backgroundColor: "var(--profile-button-bg)",
                    borderColor: "var(--profile-button-border)",
                    color: "var(--profile-button-text)",
                  }}
                  className="px-4 py-2 hover:[background:var(--profile-button-hover)] border rounded-lg font-bold text-sm transition-colors shadow-sm cursor-pointer"
                >
                  Edit Profile
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleMessage}
                    loading={messageLoading}
                    variant="outline"
                    style={{
                      borderColor: "var(--profile-button-border)",
                      color: "var(--profile-button-text)",
                    }}
                    className="rounded-lg px-4 py-2 text-sm hover:[background:var(--profile-button-hover)] hover:[color:var(--panel-link-color)]"
                  >
                    <MessageCircle size={18} className="mr-2" />
                    Message
                  </Button>

                  <Button
                    onClick={handleFollowToggle}
                    loading={followLoading}
                    variant={isFollowing ? "outline" : "primary"}
                    className={`rounded-lg px-4 py-2 text-sm  ${
                      isFollowing ? "bg-gradient-success " : ""
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

                  {/*Report*/}
                  <div className="relative">
                    <button
                      onClick={() => setShowMenu(!showMenu)}
                      style={{
                        backgroundColor: "var(--profile-button-bg)",
                        borderColor: "var(--profile-button-border)",
                        color: "var(--profile-button-text)",
                      }}
                      className="p-2 border rounded-lg shadow-sm hover:[background:var(--profile-button-hover)]"
                    >
                      <MoreHorizontal size={20} />
                    </button>

                    {showMenu && (
                      <div
                        style={{
                          backgroundColor: "var(--profile-menu-bg)",
                          borderColor: "var(--profile-menu-border)",
                        }}
                        className="absolute right-0 top-full mt-2 w-40 rounded-xl shadow-xl border z-20 overflow-hidden"
                      >
                        <button
                          onClick={() => {
                            setShowMenu(false);
                            setIsReportOpen(true);
                          }}
                          className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          <Flag size={16} /> Report User
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="mx-1">
              <div className="flex flex-col items-start justify-center mb-6">
                <h1
                  style={{ color: "var(--profile-text-primary)" }}
                  className="text-2xl font-bold"
                >
                  {profile.display_name}
                </h1>
                <p
                  style={{ color: "var(--profile-text-secondary)" }}
                  className="font-medium"
                >
                  @{profile.username}
                </p>
              </div>

              <div className="flex flex-col gap-4">
                {profile.bio && (
                  <p
                    style={{ color: "var(--profile-text-secondary)" }}
                    className="leading-relaxed"
                  >
                    {profile.bio}
                  </p>
                )}

                <div className="flex flex-wrap gap-4 text-sm mb-6">
                  {profile.gender && (
                    <span
                      style={{
                        backgroundColor: "var(--profile-badge-bg)",
                        borderColor: "var(--profile-badge-border)",
                        color: "var(--profile-badge-text)",
                      }}
                      className="flex items-center gap-1 px-3 py-1 rounded-full border"
                    >
                      Gender:
                      <span className="font-medium capitalize">
                        {profile.gender}
                      </span>
                    </span>
                  )}

                  {profile.date_of_birth && (
                    <span
                      style={{
                        backgroundColor: "var(--profile-badge-bg)",
                        borderColor: "var(--profile-badge-border)",
                        color: "var(--profile-badge-text)",
                      }}
                      className="flex items-center gap-1 px-3 py-1 rounded-full border"
                    >
                      Age:
                      <span className="font-medium">
                        {calculateAge(profile.date_of_birth)}
                      </span>
                    </span>
                  )}

                  {isOwnProfile && profile.phone && (
                    <span
                      style={{
                        backgroundColor: "var(--profile-badge-bg)",
                        borderColor: "var(--profile-badge-border)",
                        color: "var(--profile-badge-text)",
                      }}
                      className="flex items-center gap-1 px-3 py-1 rounded-full border"
                    >
                      Phone:
                      <span className="font-medium">{profile.phone}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div
            style={{ borderTopColor: "var(--profile-border)" }}
            className="flex gap-10 border-t py-4 lg:px-8 px-4"
          >
            <div className="text-center cursor-pointer hover:opacity-75">
              <span
                style={{ color: "var(--profile-stats-text)" }}
                className="font-bold block text-lg"
              >
                {profile.stats?.posts || 0}
              </span>
              <span
                style={{ color: "var(--profile-text-secondary)" }}
                className="text-sm"
              >
                Posts
              </span>
            </div>
            <Link
              to="/connections"
              state={{ targetId: profile.id, initialTab: "followers" }}
              className="text-center cursor-pointer hover:opacity-75"
            >
              <span
                style={{ color: "var(--profile-stats-text)" }}
                className="font-bold block text-lg"
              >
                {profile.stats?.followers || 0}
              </span>
              <span
                style={{ color: "var(--profile-text-secondary)" }}
                className="text-sm"
              >
                Followers
              </span>
            </Link>
            <Link
              to="/connections"
              state={{ targetId: profile.id, initialTab: "following" }}
              className="text-center cursor-pointer hover:opacity-75"
            >
              <span
                style={{ color: "var(--profile-stats-text)" }}
                className="font-bold block text-lg"
              >
                {profile.stats?.following || 0}
              </span>
              <span
                style={{ color: "var(--profile-text-secondary)" }}
                className="text-sm"
              >
                Following
              </span>
            </Link>
          </div>
        </div>

        <div
          style={{ backgroundColor: "var(--profile-posts-bg)" }}
          className="flex flex-col gap-4 w-full rounded-lg p-2 sm:p-4"
        >
          {isOwnProfile && <CreatePost onPostCreated={handlePostCreated} />}

          {posts.length > 0 ? (
            posts.map((post) => (
              <PostCard key={post.id} post={post} onDelete={handlePostDelete} />
            ))
          ) : (
            <div
              style={{
                backgroundColor: "var(--profile-empty-bg)",
                borderColor: "var(--profile-empty-border)",
                color: "var(--profile-text-muted)",
              }}
              className="text-center py-10 rounded-xl border border-dashed"
            >
              No posts yet.
            </div>
          )}
        </div>
        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          currentUser={profile}
          onUpdateSuccess={handleProfileUpdate}
        />
        <ReportModal
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
          targetId={profile.id}
          targetType="User"
        />
      </div>
    </div>
  );
}
