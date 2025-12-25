import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  getFollowers,
  getFollowing,
  unfollowUser,
  getProfile,
} from "../../services/userService";
import { useSocketContext } from "../../context/SocketContext";

export default function ConnectionsPage() {
  const { user: currentUser } = useAuth();
  const location = useLocation();

  //
  const targetId = location.state?.targetId || currentUser?.id; //default to current user

  const [activeTab, setActiveTab] = useState(
    location.state?.initialTab || "following"
  ); // 'following' or 'followers'
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const { socket,isUserOnline } = useSocketContext();

  const isOwnProfile = targetId === currentUser?.id;


  useEffect(() => {
    if (!targetId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        let res;
        ///
        if (activeTab === "followers") {
          res = await getFollowers(targetId);
        } else {
          res = await getFollowing(targetId);
        }
        // be userController returns { data: [...] }
        setData(res.data.data || []);
      } catch (error) {
        console.error("Failed to fetch connections", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [targetId, activeTab]);

  useEffect(() => { //own profile
    if (!socket || !isOwnProfile || activeTab !== "followers") return;

    const handleFollowUpdate = async (payload) => {
      if (payload.newFollower) {
        setData((prev) => {
          if (prev.some((u) => u.id === payload.newFollower)) return prev;
          return prev; 
        });

        try {
          const res = await getProfile(payload.newFollower);
          const newUser = res.data.user;
          
          setData((prev) => {
            if (prev.some((u) => u.id === newUser.id)) return prev;
            return [newUser, ...prev]; // Add to top
          });
        } catch (error) {
          console.error("Failed to fetch new follower details", error);
        }
      }

      if (payload.removedFollower) {
        setData((prev) => prev.filter((u) => u.id !== payload.removedFollower));
      }
    };

    socket.on("follow_update", handleFollowUpdate);

    return () => {
      socket.off("follow_update", handleFollowUpdate);
    };
  }, [socket, isOwnProfile, activeTab]);

  const handleUnfollow = async (targetId) => {
    if (!confirm("Unfollow this user?")) return;
    try {
      ///
      await unfollowUser(targetId);
      //update ui optimistically
      setData((prev) => prev.filter((u) => u.id !== targetId));
    } catch (error) {
      console.error("Failed to unfollow", error);
    }
  };


  return (
    <div className="bg-white min-h-screen pb-20">
      {/* Header Tabs */}
      <div className="sticky top-16 bg-white z-10 flex border-b border-gray-100">
        <button
          onClick={() => setActiveTab("following")}
          className={`flex-1 py-4 text-center font-semibold transition-colors ${
            activeTab === "following"
              ? "text-primary border-b-2 border-primary"
              : "text-gray-500 hover:bg-gray-50"
          }`}
        >
          Following
        </button>
        <button
          onClick={() => setActiveTab("followers")}
          className={`flex-1 py-4 text-center font-semibold transition-colors ${
            activeTab === "followers"
              ? "text-primary border-b-2 border-primary"
              : "text-gray-500 hover:bg-gray-50"
          }`}
        >
          Followers
        </button>
      </div>

      {/* List Content */}
      <div className="p-4">
        {loading ? (
          <div className="text-center text-gray-400 mt-10">Loading...</div>
        ) : data.length === 0 ? (
          <div className="text-center text-gray-500 mt-10">
            {activeTab === "followers"
              ? "You don't have any followers yet."
              : "You aren't following anyone yet."}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {data.map((person) => (
              <div
                key={person.id}
                className="flex items-center justify-between"
              >
                <Link
                  to={`/profile/${person.id}`}
                  className="flex items-center gap-3 group"
                >
                  <div className="relative">
                    <img
                      src={
                        person.avatar_url ||
                        `https://ui-avatars.com/api/?name=${person.display_name}`
                      }
                      alt={person.display_name}
                      className="w-12 h-12 rounded-full object-cover bg-gray-100 group-hover:opacity-90"
                    />
                    {isUserOnline(person.id) && (
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 group-hover:text-primary transition-colors">
                      {person.display_name}
                    </h4>
                    <p className="text-xs text-gray-500">@{person.username}</p>
                  </div>
                </Link>

                {/* Show Unfollow btn only on 'Following' tab */}
                {activeTab === "following" && isOwnProfile && (
                  <button
                    onClick={() => handleUnfollow(person.id)}
                    className="px-4 py-1.5 text-xs font-bold text-gray-500 border border-gray-200 rounded-full hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
                  >
                    Unfollow
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
