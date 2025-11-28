//desktop left sidebar // nav links

import { Home, User, MessageCircle, Users, PlusCircle } from "lucide-react";
import { NavLink } from "react-router-dom";
import Button from "../common/ButtonComponent";

export default function SideBar() {
  const navItems = [
    { icon: Home, label: "Feed", path: "/" },
    { icon: User, label: "Profile", path: "/profile" },
    { icon: MessageCircle, label: "Message", path: "/chat" },
    { icon: Users, label: "Connections", path: "/connections" },
  ];

  return (
    <div className="flex flex-col h-full py-2">
      {/* Nav Menu */}
      <nav className="flex flex-col gap-2">
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 group ${
                isActive
                  ? "bg-primary/10 text-primary font-bold shadow-sm"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              }`
            }
          >
            {/* Icon */}
            <item.icon size={26} strokeWidth={2.5} />
            {/* Label */}
            <span className="text-lg">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* 'New Post' Button */}
      <div className="mt-8 px-2">
        <Button size="lg" className="w-full shadow-lg shadow-primary/30 py-4 text-lg">
          <PlusCircle className="mr-2" size={24} /> New Post
        </Button>
      </div>
    </div>
  );
}