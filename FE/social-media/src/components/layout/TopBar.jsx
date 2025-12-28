//mobile header //llogo, search, notification, profile

import logo from "../../assets/img/logo/logo.png";
import {
  Search,
  Bell,
  LogOut,
  User,
  Settings,
  X,
  Sun,
  Moon,
} from "lucide-react";
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
import { useTheme } from "../../context/ThemeContext";

//import { Avatar, Badge, Button } from "@heroui/react";

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

  const { theme, toggleTheme } = useTheme();

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
        id: payload.id || Date.now(), //temp id until refreshed
        type: payload.type,
        read: false,
        created_at: payload.created_at || new Date().toISOString(),
        data: payload.data || payload, // direct payload
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
    const highlightId = n.data?.parentCommentId || n.data?.commentId;
    const conversationId = n.data?.conversationId;

    if (n.type === "follow" && fromId) {
      navigate(`/profile/${fromId}`);
    } else if (n.type === "new_message" && conversationId) {
      navigate(`/chat/${conversationId}`);
    } else if (
      (n.type === "like" ||
        n.type === "comment" ||
        n.type === "new_post" ||
        n.type === "share_post" ||
        n.type === "reply" ||
        n.type === "reaction") &&
      postId
    ) {
      navigate(`/post/${postId}`, { state: { highlightId } });
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

      case "reply":
        return `${senderName} replied to your comment.`;

      case "new_message":
        return `${senderName} sent you a message.`;

      case "reaction":
        return `${senderName} reacted to your comment.`;

      default:
        return n.data?.text || "New notification";
    }
  };

  return (
    <header
      style={{
        backgroundColor: "var(--topbar-bg)",
        borderBottomColor: "var(--topbar-border)",
        color: "var(--topbar-text)",
      }}
      className="fixed top-0 left-0 z-100 w-full border-b flex items-center justify-between px-4 h-16 lg:h-20 lg:px-10 shadow-sm transition-colors duration-300"
    >
      {/* Logo Area */}
      <div className="flex items-center gap-3">
        <img
          src={logo}
          alt="SocioICT Logo"
          className="h-6 w-6 lg:h-8 lg:w-8 object-contain"
        />
        <span
          style={{ color: "var(--topbar-logo-text)" }}
          className="text-2xl lg:text-2xl font-extrabold hidden sm:block"
        >
          Social Media
        </span>
      </div>

      {/* Center Search*/}
      <div className=" md:flex flex-1 max-w-lg mx-8 relative" ref={searchRef}>
        <div className="relative w-full">
          <Search
            style={{ color: "var(--topbar-icon)" }}
            className="absolute left-3 top-1/2 -translate-y-1/2"
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
            style={{
              backgroundColor: "var(--topbar-search-bg)",
              color: "var(--topbar-search-text)",
            }}
            className="w-full rounded-full py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all placeholder:text-[var(--topbar-search-placeholder)]"
          />
          {/* Clear x btn (show when typing) */}
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              style={{ color: "var(--topbar-icon)" }}
              className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-80"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* SEARCH RESULTS DROPDOWN */}
        {showSearchDropdown && (
          <div
            style={{
              backgroundColor: "var(--topbar-dropdown-bg)",
              borderColor: "var(--topbar-dropdown-border)",
            }}
            className="absolute top-full left-0 w-full mt-2 rounded-xl shadow-xl border overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200"
          >
            {isSearching ? (
              <div
                style={{ color: "var(--topbar-text-secondary)" }}
                className="p-4 text-center text-sm"
              >
                Searching...
              </div>
            ) : searchResults.length > 0 ? (
              <div className="max-h-[300px] overflow-y-auto">
                {searchResults.map((user) => (
                  <Link
                    key={user.id}
                    to={`/profile/${user.id}`}
                    onClick={handleClearSearch}
                    style={{
                      borderBottomColor: "var(--topbar-dropdown-border)",
                    }}
                    className="flex items-center gap-3 p-3 transition-colors border-b last:border-none hover:[background:var(--topbar-dropdown-hover)]"
                  >
                    <img
                      src={
                        user.avatar_url ||
                        `https://ui-avatars.com/api/?name=${user.display_name}`
                      }
                      alt={user.display_name}
                      style={{ borderColor: "var(--topbar-dropdown-border)" }}
                      className="w-10 h-10 rounded-full object-cover border"
                    />
                    <div>
                      <p
                        style={{ color: "var(--topbar-text)" }}
                        className="text-sm font-bold"
                      >
                        {user.display_name}
                      </p>
                      <p
                        style={{ color: "var(--topbar-text-secondary)" }}
                        className="text-xs"
                      >
                        @{user.username}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div
                style={{ color: "var(--topbar-text-secondary)" }}
                className="p-4 text-center text-sm"
              >
                No users found for {searchQuery}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right User Actions */}
      <div className="flex items-center gap-3 lg:gap-6">
        {/* THEME */}
        <button
          onClick={toggleTheme}
          style={{ color: "var(--topbar-icon)" }}
          className="p-2 rounded-full transition-colors hover:[background:var(--topbar-hover-bg)]"
          title="Toggle Theme"
        >
          {theme === "dark" ? <Sun size={24} /> : <Moon size={24} />}
        </button>
        {/* Notification Dropdown */}
        <div className="relative" ref={notiRef}>
          <button
            onClick={() => setShowNoti(!showNoti)}
            style={{ color: "var(--topbar-icon)" }}
            className="relative p-2 rounded-full transition-colors hover:[background:var(--topbar-hover-bg)]"
          >
            <Bell size={24} />
            {unreadCount > 0 && (
              <span
                style={{ borderColor: "var(--topbar-bg)" }}
                className="absolute top-1.5 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2"
              ></span>
            )}
          </button>

          {showNoti && (
            <div
              style={{
                backgroundColor: "var(--topbar-dropdown-bg)",
                borderColor: "var(--topbar-dropdown-border)",
              }}
              className="absolute right-0 top-full mt-2 w-80 rounded-xl shadow-xl border overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            >
              <div
                style={{
                  borderBottomColor: "var(--topbar-dropdown-border)",
                  color: "var(--topbar-text)",
                }}
                className="p-4 border-b font-bold"
              >
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <span
                    style={{
                      backgroundColor: "var(--topbar-badge-bg)",
                      color: "var(--topbar-badge-text)",
                    }}
                    className="text-xs px-2 py-1 rounded-full ml-2"
                  >
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {loading && (
                  <div
                    style={{ color: "var(--topbar-text-secondary)" }}
                    className="p-4 text-center text-sm"
                  >
                    Loading...
                  </div>
                )}

                {!loading && notis.length === 0 && (
                  <div
                    style={{ color: "var(--topbar-text-secondary)" }}
                    className="p-4 text-center text-sm"
                  >
                    No notifications yet.
                  </div>
                )}

                {notis.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    style={{
                      borderBottomColor: "var(--topbar-dropdown-border)",
                      backgroundColor: !n.read
                        ? "var(--topbar-unread-bg)"
                        : "transparent",
                    }}
                    className="p-3 cursor-pointer border-b hover:[background:var(--topbar-dropdown-hover)]"
                  >
                    <p
                      style={{ color: "var(--topbar-text)" }}
                      className="text-sm"
                    >
                      {renderNotificationText(n)}
                    </p>
                    <span
                      style={{ color: "var(--topbar-text-secondary)" }}
                      className="text-xs mt-1 block"
                    >
                      {getRelativeTime(n.created_at)}
                    </span>
                  </div>
                ))}
              </div>
              {unreadCount > 0 && (
                <div
                  style={{ borderTopColor: "var(--topbar-dropdown-border)" }}
                  className="p-2 text-center border-t"
                >
                  <button
                    onClick={handleMarkAllAsRead}
                    style={{ color: "var(--topbar-badge-text)" }}
                    className="text-xs font-semibold hover:underline"
                  >
                    Mark all as read
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        {/* User Menu Dropdown */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 cursor-pointer p-1.5 rounded-full pr-4 transition-colors border border-transparent hover:[background:var(--topbar-hover-bg)] hover:[border-color:var(--topbar-dropdown-border)]"
          >
            <img
              src={
                user?.avatar_url ||
                `https://ui-avatars.com/api/?name=${
                  user?.display_name || "User"
                }`
              }
              alt="User"
              style={{ borderColor: "var(--topbar-dropdown-border)" }}
              className="w-8 h-8 lg:w-10 lg:h-10 rounded-full object-cover border"
            />
            <span
              style={{ color: "var(--topbar-text)" }}
              className="font-bold hidden lg:block max-w-[100px] truncate"
            >
              {user?.display_name?.split(" ")[0]}
            </span>
          </button>

          {/* The Dropdown Menu */}
          {showUserMenu && (
            <div
              style={{
                backgroundColor: "var(--topbar-dropdown-bg)",
                borderColor: "var(--topbar-dropdown-border)",
              }}
              className="absolute right-0 top-full mt-2 w-56 rounded-xl shadow-xl border overflow-hidden animate-in fade-in zoom-in-95 duration-200 py-2"
            >
              {/* Profile Header in Menu */}
              <div
                style={{ borderBottomColor: "var(--topbar-dropdown-border)" }}
                className="px-4 py-3 border-b mb-2"
              >
                <p
                  style={{ color: "var(--topbar-text)" }}
                  className="text-sm font-bold truncate"
                >
                  {user?.display_name}
                </p>
                <p
                  style={{ color: "var(--topbar-text-secondary)" }}
                  className="text-xs truncate"
                >
                  @{user?.username || "user"}
                </p>
              </div>

              {/* Menu Links */}
              <Link
                to="/profile"
                onClick={() => setShowUserMenu(false)}
                style={{ color: "var(--topbar-text)" }}
                className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:[background:var(--topbar-dropdown-hover)] hover:[color:var(--topbar-badge-text)]"
              >
                <User size={18} />
                Profile
              </Link>

              <Link
                to="/settings"
                onClick={() => setShowUserMenu(false)}
                style={{ color: "var(--topbar-text)" }}
                className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:[background:var(--topbar-dropdown-hover)] hover:[color:var(--topbar-badge-text)]"
              >
                <Settings size={18} />
                Settings
              </Link>

              <div
                style={{ backgroundColor: "var(--topbar-dropdown-border)" }}
                className="h-px my-2"
              ></div>
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
