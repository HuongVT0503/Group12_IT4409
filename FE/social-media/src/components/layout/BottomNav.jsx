//mobile bottom navbar

import { Home, User, MessageCircle, Users, PlusSquare } from "lucide-react";
import { NavLink } from "react-router-dom";

import { useSocketContext } from "../../context/SocketContext";

export default function BottomNav() {
  const { unreadCount } = useSocketContext();

  const navItems = [
    { icon: Home, label: "Feed", path: "/" },
    { icon: Users, label: "Connect", path: "/connections" },
    { icon: PlusSquare, label: "Post", path: "/create", isSpecial: true }, //Center button
    { icon: MessageCircle, label: "Chat", path: "/chat" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  return (
    <div
      className="lg:hidden fixed bottom-0 left-0 w-full border-t h-16 px-6 flex items-center justify-between z-50 pb-safe"
      style={{
        backgroundColor: "var(--bottom-nav-bg)",
        borderColor: "var(--bottom-nav-border)",
      }}
    >
      {navItems.map((item) => (
        <NavLink key={item.label} to={item.path} className="w-full h-full">
          {({ isActive }) => (
            <div
              className={`flex flex-col items-center justify-center w-full h-full gap-1`}
              style={{
                color: item.isSpecial
                  ? "var(--color-primary-500)"
                  : isActive
                  ? "var(--bottom-nav-text-active)"
                  : "var(--bottom-nav-text-inactive)",
              }}
            >
              {item.isSpecial ? (
                <div
                  className="flex items-center justify-center p-2 rounded-2xl shadow-lg border-[6px] transition-transform hover:scale-105"
                  style={{
                    background: "var(--button-primary-bg)",
                    color: "var(--button-primary-text)",
                    borderColor: "var(--bottom-nav-bg)",
                  }}
                >
                  <item.icon size={28} />
                </div>
              ) : (
                <div className="relative">
                  <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                  {item.label === "Chat" && unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-1 ring-white dark:ring-gray-900">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </NavLink>
      ))}
    </div>
  );
}
