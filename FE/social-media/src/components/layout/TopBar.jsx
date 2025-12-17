//mobile header //llogo, search, notification, profile

import logo from "../../assets/img/logo/logo.png";
import { Search, Bell, LogOut, User, Settings } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSocket } from "../../context/SocketContext";
import { getNotifications, markAsRead } from "../../services/notificationService";
import { formatDistanceToNow } from "date-fns";
import { getProfile } from "../../services/userService";


//
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

  //refs for click outside detection
  const notiRef = useRef(null);
  const userMenuRef = useRef(null);

  const navigate = useNavigate();
  const socket = useSocket();

  const unreadCount = notis.filter((n) => !n.read).length;

  useEffect(() => {
    function handleClickOutside(event) {
      //click outside to close
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
    
      const uniqueIds = [...new Set(notis.map(n => n.data?.from || n.data?.userId))]
        .filter(id => id && !senderNames[id] && id !== user?.id);

      if (uniqueIds.length === 0) return;

      const newNames = {};
      
      //fetch profiles in parallel
      await Promise.all(uniqueIds.map(async (id) => {
        try {
          const res = await getProfile(id); 
          //be -> { user: ... }        inside axios response.data
          newNames[id] = res.data.user.display_name; 
        } catch (err) {
          console.error(`Failed to fetch user ${id}`, err);
          newNames[id] = "Unknown User";
        }
      }));

      setSenderNames(prev => ({ ...prev, ...newNames }));
    };

    if (notis.length > 0) {
      fetchMissingSenders();
    }
  }, [notis, senderNames, user?.id]);


  /////////
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
    const unreadNotis = notis.filter(n => !n.read);
    if (unreadNotis.length === 0) return;

    setNotis(prev => prev.map(n => ({ ...n, read: true })));

    //send req in parallel ( be doesnt have read-all endpoint)
    try {
        await Promise.all(unreadNotis.map(n => markAsRead(n.id)));
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
    const senderName =  senderNames[fromId] ||n.data?.senderName ||  "Someone";

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
        return `${senderName} ${n.data?.text|| "shared a post"}.`;
      default:
        return n.data?.text || "New notification";
    }
  };

  return (
    <header className="fixed top-0 left-0 w-full bg-white h-16 lg:h-20 border-b border-gray-100 z-50 px-4 lg:px-10 flex items-center justify-between shadow-sm">
      {/* Logo Area */}
      <div className="flex items-center gap-3">
        <img
          src={logo}
          alt="SocioICT Logo"
          className="h-8 w-8 lg:h-10 lg:w-10 object-contain"
        />
        <span className="text-2xl lg:text-3xl font-extrabold text-primary hidden sm:block">
          Social Media
        </span>
      </div>

      {/* Center Search - hidden on small mobile */}
      <div className="hidden md:flex flex-1 max-w-md mx-8 relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          size={20}
        />
        <input
          type="text"
          placeholder="Search for friends..."
          className="w-full bg-gray-100 rounded-full py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
        />
        <div className="w-full h-10"></div>
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
              <div className="p-4 border-b border-gray-100 font-bold text-gray-900">
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
                className="text-xs text-primary font-semibold hover:underline">
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
