import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FileText,
  LogOut,
  Bell,
  ShieldAlert,
  Sun,
  Moon,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { useTheme } from "../../context/ThemeContext";
import { useState, useEffect, useRef } from "react";
import {
  getNotifications,
  markAsRead,
} from "../../services/notificationService";
import { formatDistanceToNow } from "date-fns";

export default function AdminLayout() {
  const { user, logout } = useAuth(); //admin user
  const { theme, toggleTheme } = useTheme();
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
    <div
      className="flex h-screen font-sans"
      style={{ backgroundColor: "var(--admin-bg)" }}
    >
      {/* Sidebar */}
      <aside
        className="w-64 flex flex-col shadow-lg z-20"
        style={{
          backgroundColor: "var(--admin-sidebar-bg)",
          color: "var(--admin-sidebar-text)",
        }}
      >
        <div className="p-6 text-2xl font-bold text-[#a78bfa] tracking-tight text-center">
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
          className="p-4 flex items-center gap-3 hover:bg-slate-700 transition-colors border-t"
          style={{
            borderColor: "var(--admin-sidebar-border)",
            color: "#f87171",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor =
              "var(--admin-sidebar-hover)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "transparent")
          }
        >
          <LogOut size={20} /> Logout
        </button>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header
          className="border-b h-16 flex items-center justify-between px-8 shadow-sm z-10"
          style={{
            backgroundColor: "var(--admin-header-bg)",
            borderColor: "var(--admin-header-border)",
          }}
        >
          <h2
            className="text-xl font-semibold"
            style={{ color: "var(--admin-header-text)" }}
          >
            Welcome back, {user?.display_name || "Admin"}
          </h2>

          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full transition-colors cursor-pointer"
              style={{ color: "var(--admin-text-secondary)" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "var(--admin-bg)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "transparent")
              }
              title={
                theme === "dark"
                  ? "Switch to Light Mode"
                  : "Switch to Dark Mode"
              }
            >
              {theme === "dark" ? <Sun size={24} /> : <Moon size={24} />}
            </button>

            {/* Noti Bell */}
            <div className="relative" ref={notiRef}>
              <button
                onClick={() => setShowNoti(!showNoti)}
                className="relative p-2 rounded-full transition-colors cursor-pointer"
                style={{ color: "var(--admin-text-secondary)" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "var(--admin-bg)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "transparent")
                }
              >
                <Bell size={24} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </button>

              {/* Dropdown */}
              {showNoti && (
                <div
                  className="absolute right-0 top-full mt-2 w-80 rounded-xl shadow-xl border overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50"
                  style={{
                    backgroundColor: "var(--admin-card-bg)",
                    borderColor: "var(--admin-card-border)",
                  }}
                >
                  <div
                    className="p-3 border-b font-bold flex justify-between items-center"
                    style={{
                      backgroundColor: "var(--admin-table-header-bg)",
                      borderColor: "var(--admin-card-border)",
                      color: "var(--admin-text-primary)",
                    }}
                  >
                    <span>Reports</span>
                    {unreadCount > 0 && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {notis.length === 0 ? (
                      <div
                        className="p-4 text-center text-sm"
                        style={{ color: "var(--admin-text-secondary)" }}
                      >
                        No reports found.
                      </div>
                    ) : (
                      notis.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => handleNotificationClick(n)}
                          className={`p-3 border-b cursor-pointer transition-colors`}
                          style={{
                            borderColor: "var(--admin-table-border)",
                            backgroundColor: !n.read
                              ? "rgba(59, 130, 246, 0.1)"
                              : "transparent",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.backgroundColor =
                              "var(--admin-table-row-hover)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.backgroundColor = !n.read
                              ? "rgba(59, 130, 246, 0.1)"
                              : "transparent")
                          }
                        >
                          <div className="flex gap-3">
                            <div className="mt-1">
                              <ShieldAlert size={16} className="text-red-500" />
                            </div>
                            <div>
                              <p
                                className="text-sm"
                                style={{ color: "var(--admin-text-primary)" }}
                              >
                                <span className="font-bold">
                                  {n.data?.senderName}
                                </span>{" "}
                                {n.data?.text || "reported content"}
                              </p>
                              <p className="text-xs text-red-500 mt-1 italic">
                                Reason: {n.data?.reason}
                              </p>
                              <span
                                className="text-xs mt-1 block"
                                style={{ color: "var(--admin-text-secondary)" }}
                              >
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
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline transition-colors w-full p-2 text-center"
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
      `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors`
    }
    style={({ isActive }) => ({
      backgroundColor: isActive
        ? "var(--admin-sidebar-active-bg)"
        : "transparent",
      color: isActive
        ? "var(--admin-sidebar-active-text)"
        : "var(--admin-sidebar-text)",
      opacity: isActive ? 1 : 0.7,
    })}
  >
    {icon} <span>{label}</span>
  </NavLink>
);
