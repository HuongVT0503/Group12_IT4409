//mobile bottom navbar

import { Home, User, MessageCircle, Users, PlusSquare } from "lucide-react";
import { NavLink } from "react-router-dom";

export default function BottomNav() {
  const navItems = [
    { icon: Home, label: "Feed", path: "/" },
    { icon: Users, label: "Connect", path: "/connections" },
    { icon: PlusSquare, label: "Post", path: "/create", isSpecial: true }, //Center button
    { icon: MessageCircle, label: "Chat", path: "/chat" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 h-16 px-6 flex items-center justify-between z-50 pb-safe">
      {navItems.map((item) => (
        <NavLink key={item.label} to={item.path} className="w-full h-full">
          {({ isActive }) => (
            <div
              className={`flex flex-col items-center justify-center w-full h-full gap-1 ${
                item.isSpecial
                  ? "text-primary"
                  : isActive
                  ? "text-primary"
                  : "text-gray-400"
              }`}
            >
              {item.isSpecial ? (
                <div className="bg-primary text-white p-2.5 rounded-xl shadow-lg shadow-primary/40 -mt-6 mb-1">
                  <item.icon size={24} />
                </div>
              ) : (
                <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              )}
            </div>
          )}
        </NavLink>
      ))}
    </div>
  );
}
