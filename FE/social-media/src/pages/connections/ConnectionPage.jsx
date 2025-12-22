import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  getFollowers,
  getFollowing,
  unfollowUser,
} from "../../services/userService";
import Avatar from "../../components/common/Avatar";

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

  const isOwnProfile = targetId === currentUser?.id;

  return (
    <div className="bg-white min-h-screen w-full ">
      {/* Header Tabs */}
      <div className="sticky top-20 bg-white z-10 flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab("following")}
          className={`flex-1 py-4 text-center font-semibold transition-colors ${
            activeTab === "following"
              ? "text-primary border-b-3 border-primary-400"
              : "text-gray-500 hover:bg-primary-300/20 cursor-pointer "
          }`}
        >
          Following
        </button>
        <button
          onClick={() => setActiveTab("followers")}
          className={`flex-1 py-4 text-center font-semibold transition-colors ${
            activeTab === "followers"
              ? "text-primary border-b-3 border-primary-400"
              : "text-gray-500 hover:bg-primary-300/20 cursor-pointer "
          }`}
        >
          Followers
        </button>
      </div>

      {/* List Content */}
      <div className="p-4 sticky top-35 overflow-y-auto">
        {loading ? (
          <div className="text-center text-gray-400 mt-10">Loading...</div>
        ) : data.length === 0 ? (
          <div className="text-center text-gray-500 mt-10">
            {activeTab === "followers"
              ? "You don't have any followers yet."
              : "You aren't following anyone yet."}
          </div>
        ) : (
          <div className="flex flex-col gap-4  lg:mx-10">
            {data.map((person) => (
              <div
                key={person.id}
                className="flex items-center justify-between hover:bg-primary-300/20 p-2 rounded-full transition-colors"
              >
                <Link
                  to={`/profile/${person.id}`}
                  className="flex items-center gap-3 group "
                >
                  <Avatar
                    src={
                      person.avatar_url ||
                      `https://ui-avatars.com/api/?name=${person.display_name}`
                    }
                    size={12}
                    className="group-hover:opacity-90"
                  />
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
                    className="px-4 py-3 text-xs font-bold text-gray-500 border border-gray-200 rounded-full hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all cursor-pointer"
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
