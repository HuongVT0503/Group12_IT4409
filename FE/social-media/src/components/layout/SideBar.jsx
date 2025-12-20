//desktop left sidebar // nav links

import { Home, User, MessageCircle, Users, PlusCircle } from "lucide-react";
import { NavLink, Link } from "react-router-dom";
import Button from "../common/ButtonComponent";

export default function SideBar() {
  const navItems = [
    { icon: Home, label: "Feed", path: "/" },
    { icon: User, label: "Profile", path: "/profile" },
    { icon: MessageCircle, label: "Message", path: "/chat" },
    { icon: Users, label: "Connections", path: "/connections" },
  ];

  return (
    <div className="flex flex-col h-full py-2 2xl:py-6">
      {/* Nav Menu */}
      <nav className="flex flex-col gap-2 2xl:gap-4">
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-4 px-4 py-3.5 2xl:py-5 2xl:px-6 rounded-xl transition-all duration-200 group ${
                isActive
                  ? "bg-primary/10 text-primary font-bold shadow-sm"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              }`
            }
          >
            {/* Icon */}
            <item.icon size={26} className="2xl:w-8 2xl:h-8" strokeWidth={2.5} />
            {/* Label */}
            <span className="text-lg 2xl:text-xl">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* new post btn */}
      <div className="mt-8 2xl:mt-12 px-2">
        <Link to="/create" className="block w-full">
          <Button
            size="lg"
            className="w-full shadow-lg shadow-primary/30 py-4 2xl:py-6 text-lg 2xl:text-xl"
          >
            <PlusCircle className="mr-2 2xl:w-7 2xl:h-7" size={24} /> New Post
          </Button>
        </Link>
      </div>
    </div>
  );
}