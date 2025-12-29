//desktop left sidebar // nav links

import {
  Home,
  User,
  MessageCircle,
  Users,
  PlusCircle,
  Bookmark,
} from "lucide-react";
import { NavLink, Link } from "react-router-dom";
import {
  Button,
  Listbox,
  ListboxItem,
  Card,
  CardBody,
  //Divider,
} from "@heroui/react";
import { useSocketContext } from "../../context/SocketContext";
//import { useTheme } from "../../context/ThemeContext";

export default function SideBar() {
  const { unreadCount } = useSocketContext();
  //const { theme } = useTheme();

  const navItems = [
    { icon: Home, label: "Feed", path: "/", key: "feed" },
    { icon: User, label: "Profile", path: "/profile", key: "profile" },
    { icon: MessageCircle, label: "Message", path: "/chat", key: "chat" },
    {
      icon: Users,
      label: "Connections",
      path: "/connections",
      key: "connections",
    },
    { icon: Bookmark, label: "Saved", path: "/saved", key: "saved" },
  ];

  return (
    <div
      style={{
        backgroundColor: "var(--sidebar-bg)",
        borderRightColor: "var(--sidebar-border)",
      }}
      className="flex flex-col items-center h-full py-4 px-3 gap-5 border-r"
    >
      {/* Nav Menu */}
      <Card
        style={{ backgroundColor: "var(--sidebar-card-bg)" }}
        className="border-none backdrop-blur-sm w-full"
      >
        <CardBody className="p-2">
          <Listbox
            aria-label="Navigation menu"
            variant="flat"
            className="gap-1"
          >
            {navItems.map((item) => (
              <ListboxItem
                key={item.key}
                as={NavLink}
                to={item.path}
                startContent={
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg transition-colors">
                    <item.icon size={24} strokeWidth={2.5} />
                    {item.key === "chat" && unreadCount > 0 && (
                      <span
                        style={{
                          backgroundColor: "var(--sidebar-badge-bg)",
                          color: "var(--sidebar-badge-text)",
                          borderColor: "var(--sidebar-badge-ring)",
                        }}
                        className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ring-2"
                      >
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </div>
                }
                style={{
                  color: "var(--sidebar-text)",
                }}
                className="
                  text-lg font-medium py-3 px-3 rounded-xl mb-1
                  transition-all duration-200
                  hover:[background:var(--sidebar-hover-bg)] hover:[color:var(--sidebar-hover-text)] hover:scale-[1.02]
                  [&.active]:[background:var(--sidebar-active-bg)] [&.active]:[color:var(--sidebar-active-text)] [&.active]:font-semibold
                  [&.active]:shadow-[var(--sidebar-active-shadow)]
                "
              >
                {item.label}
              </ListboxItem>
            ))}
          </Listbox>
        </CardBody>
      </Card>

      {/* <Divider className="my-1" /> */}

      {/* 'New Post' Button */}
      <Button
        as={Link}
        to="/create"
        size="lg"
        style={{
          background: "var(--sidebar-button-bg)",
          color: "var(--sidebar-badge-text)",
          boxShadow: `0 0px 10px var(--sidebar-button-shadow)`,
        }}
        className="
          w-full px-2 h-13 font-bold text-base
          rounded-lg ring-1 ring-[var(--sidebar-button-ring)]
          hover:scale-[1.02] hover:-translate-y-[1px]
          transition-all duration-200
        "
        startContent={<PlusCircle size={22} strokeWidth={2.5} />}
      >
        New Post
      </Button>
    </div>
  );
}
