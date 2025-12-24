import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FileText,
  LogOut,
  Bell,
  ShieldAlert,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { useState, useEffect, useRef } from "react";
import {
  getNotifications,
  markAsRead,
} from "../../services/notificationService";
import { formatDistanceToNow } from "date-fns";

export default function AdminLayout() {
  const { user, logout } = useAuth(); //admin user
  const socket = useSocket();
  const navigate = useNavigate();

  const [notis, setNotis] = useState([]);
  const [showNoti, setShowNoti] = useState(false);
  const notiRef = useRef(null);
  const unreadCount = notis.filter((n) => !n.read).length;

  //fetch noti on load
  useEffect(() => {
    const fetchNotis = async () => {
      try {
        const res = await getNotifications();
        const formatted = res.data.data.map((n) => ({
          ...n,
          data: typeof n.data === "string" ? JSON.parse(n.data) : n.data,
        }));
        setNotis(formatted);
      } catch (err) {
        console.error("Failed to load admin notifications", err);
      }
    };
    fetchNotis();
  }, []);

  //realtime Socket listener
  useEffect(() => {
    if (!socket) return;
    const handleNewNotification = (payload) => {
      const newNoti = {
        id: payload.id || Date.now(),
        type: payload.type,
        read: false,
        created_at: payload.created_at || new Date().toISOString(),
        data: payload.data || payload,
      };
      setNotis((prev) => [newNoti, ...prev]);
    };

    socket.on("notification", handleNewNotification);
    return () => socket.off("notification", handleNewNotification);
  }, [socket]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (notiRef.current && !notiRef.current.contains(event.target)) {
        setShowNoti(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = async (n) => {
    //mark as read LOCALLY
    if (!n.read) {
      try {
        await markAsRead(n.id);
        setNotis((prev) =>
          prev.map((item) =>
            item.id === n.id ? { ...item, read: true } : item
          )
        );
      } catch (e) {
        console.error(e);
      }
    }
    setShowNoti(false);

    if (n.data?.targetType === "User") {
      navigate("/admin/users");
    } else if (n.data?.targetType === "Post") {
      navigate("/admin/posts");
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

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-800 text-white flex flex-col shadow-lg z-20">
        <div className="p-6 text-2xl font-bold tracking-tight text-center border-b border-slate-700 bg-slate-900">
          Admin Panel
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <NavItem
            to="/admin/dashboard"
            icon={<LayoutDashboard size={20} />}
            label="Dashboard"
          />
          <NavItem to="/admin/users" icon={<Users size={20} />} label="Users" />
          <NavItem
            to="/admin/posts"
            icon={<FileText size={20} />}
            label="Posts"
          />
        </nav>
        <button
          onClick={handleLogout}
          className="p-4 flex items-center gap-3 text-red-400 hover:bg-slate-700 transition-colors border-t border-slate-700"
        >
          <LogOut size={20} /> Logout
        </button>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-8 shadow-sm z-10">
          <h2 className="text-xl font-semibold text-gray-800">
            Welcome back, {user?.display_name || "Admin"}
          </h2>

          <div className="flex items-center gap-4">
            {/* Noti Bell */}
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

              {/* Dropdown */}
              {showNoti && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
                  <div className="p-3 border-b border-gray-200 font-bold text-gray-900 bg-gray-50 flex justify-between items-center">
                    <span>Reports</span>
                    {unreadCount > 0 && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {notis.length === 0 ? (
                      <div className="p-4 text-center text-sm text-gray-500">
                        No reports found.
                      </div>
                    ) : (
                      notis.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => handleNotificationClick(n)}
                          className={`p-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${
                            !n.read ? "bg-blue-50/50" : ""
                          }`}
                        >
                          <div className="flex gap-3">
                            <div className="mt-1">
                              <ShieldAlert size={16} className="text-red-500" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-800">
                                <span className="font-bold">
                                  {n.data?.senderName}
                                </span>{" "}
                                {n.data?.text || "reported content"}
                              </p>
                              <p className="text-xs text-red-500 mt-1 italic">
                                Reason: {n.data?.reason}
                              </p>
                              <span className="text-xs text-gray-400 mt-1 block">
                                {n.created_at
                                  ? formatDistanceToNow(
                                      new Date(n.created_at),
                                      { addSuffix: true }
                                    )
                                  : "Just now"}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline transition-colors"
                      >
                        Mark all read
                      </button>
                    )}
                  

                </div>
              )}
            </div>

            <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold border border-purple-200">
              A
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

const NavItem = ({ to, icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
        isActive
          ? "bg-primary text-white"
          : "text-slate-400 hover:bg-slate-700 hover:text-white"
      }`
    }
  >
    {icon} <span>{label}</span>
  </NavLink>
);
