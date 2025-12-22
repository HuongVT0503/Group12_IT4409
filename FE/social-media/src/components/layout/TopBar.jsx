//mobile header //llogo, search, notification, profile

import logo from "../../assets/img/logo/logo.png";
import { Search, Bell, LogOut, User, Settings, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSocket } from "../../context/SocketContext";
import {
  getNotifications,
  markAsRead,
} from "../../services/notificationService";
import { formatDistanceToNow } from "date-fns";
import { getProfile } from "../../services/userService";
import { searchUsers } from "../../services/userService";

import { Avatar, Badge, Button } from "@heroui/react";

//validate date b4 passing it to formatDistanceToNow
const getRelativeTime = (dateInput) => {
  if (!dateInput) return "Just now";
  try {
    const date = new Date(dateInput);
    //valid?
    if (isNaN(date.getTime())) return "Just now";
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    console.error(error);
    return "Just now";
  }
};

export default function TopBar() {
  const { user, logout } = useAuth();

  const [showNoti, setShowNoti] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const [notis, setNotis] = useState([]);
  const [loading, setLoading] = useState(false);
  const [senderNames, setSenderNames] = useState({});

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef(null);

  //refs for click outside detection
  const notiRef = useRef(null);
  const userMenuRef = useRef(null);

  const navigate = useNavigate();
  const socket = useSocket();

  const unreadCount = notis.filter((n) => !n.read).length;

  /////

  //search debounce
  useEffect(() => {
    //wait 500ms after user stops typing b4 calling api
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim().length > 0) {
        setIsSearching(true);
        try {
          const res = await searchUsers(searchQuery);

          setSearchResults(res.data.data || []);
          setShowSearchDropdown(true);
        } catch (error) {
          console.error("Search failed", error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setShowSearchDropdown(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  useEffect(() => {
    function handleClickOutside(event) {
      //click outside to close
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchDropdown(false);
      }
      if (notiRef.current && !notiRef.current.contains(event.target)) {
        setShowNoti(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  //fetch notis
  useEffect(() => {
    if (!user) return;

    const fetchNotis = async () => {
      setLoading(true);
      try {
        const res = await getNotifications();
        //be:  { data: [...] }
        const formatted = res.data.data.map((n) => ({
          ...n,
          data: typeof n.data === "string" ? JSON.parse(n.data) : n.data,
        }));
        setNotis(formatted);
      } catch (err) {
        console.error("Failed to load notifications", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotis();
  }, [user]);

  //realtime noti
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (payload) => {
      //emitNotification
      const newNoti = {
        id: Date.now(), //temp id until refreshed
        type: payload.type,
        read: false,
        created_at: new Date().toISOString(),
        data: payload, // direct payload
      };

      setNotis((prev) => [newNoti, ...prev]);
    };

    socket.on("notification", handleNewNotification);

    return () => {
      socket.off("notification", handleNewNotification);
    };
  }, [socket]);

  //fetch sender names when noti change
  useEffect(() => {
    const fetchMissingSenders = async () => {
      const uniqueIds = [
        ...new Set(notis.map((n) => n.data?.from || n.data?.userId)),
      ].filter((id) => id && !senderNames[id] && id !== user?.id);

      if (uniqueIds.length === 0) return;

      const newNames = {};

      //fetch profiles in parallel
      await Promise.all(
        uniqueIds.map(async (id) => {
          try {
            const res = await getProfile(id);
            //be -> { user: ... }        inside axios response.data
            newNames[id] = res.data.user.display_name;
          } catch (err) {
            console.error(`Failed to fetch user ${id}`, err);
            newNames[id] = "Unknown User";
          }
        })
      );

      setSenderNames((prev) => ({ ...prev, ...newNames }));
    };

    if (notis.length > 0) {
      fetchMissingSenders();
    }
  }, [notis, senderNames, user?.id]);

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setShowSearchDropdown(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleMarkRead = async (notification) => {
    if (notification.read) return;

    setNotis((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
    );

    try {
      await markAsRead(notification.id);
    } catch (error) {
      console.error("Failed to mark as read", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadNotis = notis.filter((n) => !n.read);
    if (unreadNotis.length === 0) return;

    setNotis((prev) => prev.map((n) => ({ ...n, read: true })));

    //send req in parallel ( be doesnt have read-all endpoint)
    try {
      await Promise.all(unreadNotis.map((n) => markAsRead(n.id)));
    } catch (error) {
      console.error("Failed to mark all as read", error);
    }
  };

  //navigate
  const handleNotificationClick = (n) => {
    handleMarkRead(n);
    setShowNoti(false); //close dropdown

    const fromId = n.data?.from || n.data?.userId;
    const postId = n.data?.postId;

    if (n.type === "follow" && fromId) {
      navigate(`/profile/${fromId}`);
    } else if (
      (n.type === "like" ||
        n.type === "comment" ||
        n.type === "new_post" ||
        n.type === "share_post") &&
      postId
    ) {
      navigate(`/post/${postId}`);
    }
  };

  //render noti txt based on type
  const renderNotificationText = (n) => {
    //missing 'data' or different format
    const fromId = n.data?.from || n.data?.userId;
    const senderName = senderNames[fromId] || n.data?.senderName || "Someone";

    switch (n.type) {
      case "like":
        return `${senderName} liked your post.`;
      case "comment":
        return `${senderName} commented on your post.`;
      case "follow":
        return `${senderName} started following you.`;
      case "new_post":
        return `${senderName} posted a new update.`;
      case "share_post":
        return `${senderName} ${n.data?.text || "shared a post"}.`;
      default:
        return n.data?.text || "New notification";
    }
  };

  return (
    <header
      className="fixed top-0 left-0 z-100
     w-full bg-white border-b border-neutral-300 
     flex items-center justify-between
      px-4 h-16 lg:h-20  lg:px-10  shadow-sm"
    >
      {/* Logo Area */}
      <div className="flex items-center gap-3">
        <img
          src={logo}
          alt="SocioICT Logo"
          className="h-6 w-6 lg:h-8 lg:w-8 object-contain"
        />
        <span className="text-2xl lg:text-2xl font-extrabold text-purple-600 hidden sm:block">
          Social Media
        </span>
      </div>

      {/* Center Search*/}
      <div className=" md:flex flex-1 max-w-lg mx-8 relative" ref={searchRef}>
        <div className="relative w-full">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={22}
          />
          <input
            type="text"
            placeholder="Search for friends..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
              if (searchResults.length > 0) setShowSearchDropdown(true);
            }}
            className="w-full bg-gray-200 rounded-full py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all"
          />
          {/* Clear x btn (show when typing) */}
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* SEARCH RESULTS DROPDOWN */}
        {showSearchDropdown && (
          <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
            {isSearching ? (
              <div className="p-4 text-center text-sm text-gray-500">
                Searching...
              </div>
            ) : searchResults.length > 0 ? (
              <div className="max-h-[300px] overflow-y-auto">
                {searchResults.map((user) => (
                  <Link
                    key={user.id}
                    to={`/profile/${user.id}`}
                    onClick={handleClearSearch} //close search on click
                    className="flex items-center gap-3 p-3 hover:bg-gray-100 transition-colors border-b border-gray-50 last:border-none"
                  >
                    <img
                      src={
                        user.avatar_url ||
                        `https://ui-avatars.com/api/?name=${user.display_name}`
                      }
                      alt={user.display_name}
                      className="w-10 h-10 rounded-full object-cover border border-gray-200"
                    />
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        {user.display_name}
                      </p>
                      <p className="text-xs text-gray-500">@{user.username}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-sm text-gray-500">
                No users found for {searchQuery}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right User Actions */}
      <div className="flex items-center gap-3 lg:gap-6">
        {/* Notification Dropdown */}
        <div className="relative" ref={notiRef}>
          <button
            onClick={() => setShowNoti(!showNoti)}
            className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Bell size={24} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            )}
          </button>

          {showNoti && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="p-4 border-b border-gray-200 font-bold text-gray-900">
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {loading && (
                  <div className="p-4 text-center text-sm text-gray-500">
                    Loading...
                  </div>
                )}

                {!loading && notis.length === 0 && (
                  <div className="p-4 text-center text-sm text-gray-500">
                    No notifications yet.
                  </div>
                )}

                {notis.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 ${
                      !n.read ? "bg-blue-50/50" : ""
                    }`}
                  >
                    <p className="text-sm text-gray-800">
                      {renderNotificationText(n)}
                    </p>
                    <span className="text-xs text-gray-400 mt-1 block">
                      {getRelativeTime(n.created_at)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="p-2 text-center border-t border-gray-100">
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-primary font-semibold hover:underline"
                >
                  Mark all as read
                </button>
              </div>
            </div>
          )}
        </div>
        {/* User Menu Dropdown */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-1.5 rounded-full pr-4 transition-colors border border-transparent hover:border-gray-200"
          >
            <img
              src={
                user?.avatar_url ||
                `https://ui-avatars.com/api/?name=${
                  user?.display_name || "User"
                }`
              }
              alt="User"
              className="w-8 h-8 lg:w-10 lg:h-10 rounded-full object-cover border border-gray-200"
            />
            <span className="font-bold text-gray-700 hidden lg:block max-w-[100px] truncate">
              {user?.display_name?.split(" ")[0]}
            </span>
          </button>

          {/* The Dropdown Menu */}
          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 py-2">
              {/* Profile Header in Menu */}
              <div className="px-4 py-3 border-b border-gray-100 mb-2">
                <p className="text-sm font-bold text-gray-900 truncate">
                  {user?.display_name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  @{user?.username || "user"}
                </p>
              </div>

              {/* Menu Links */}
              <Link
                to="/profile"
                onClick={() => setShowUserMenu(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors"
              >
                <User size={18} />
                Profile
              </Link>

              <Link
                to="/settings"
                onClick={() => setShowUserMenu(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors"
              >
                <Settings size={18} />
                Settings
              </Link>

              <div className="h-px bg-gray-100 my-2"></div>
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
              >
                <LogOut size={18} />
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
