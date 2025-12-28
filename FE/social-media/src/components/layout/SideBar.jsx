//desktop left sidebar // nav links

import { Home, User, MessageCircle, Users, PlusCircle } from "lucide-react";
import { NavLink, Link } from "react-router-dom";
import {
  Button,
  Listbox,
  ListboxItem,
  Card,
  CardBody,
  //Divider,
} from "@heroui/react";

export default function SideBar() {
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
  ];

  return (
    <div className="flex flex-col items-center h-full py-4 px-3 gap-5 bg-white border-r border-neutral-300">
      {/* Nav Menu */}
      <Card className="border-none backdrop-blur-sm w-full">
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
                  </div>
                }
                className="
                  text-lg font-medium py-3 px-3 rounded-xl mb-1
                  data-[hover=true]:bg-[rgba(99,102,241,0.08)] data-[hover=true]:text-primary data-[hover=true]:scale-[1.02]
                  data-[active=true]:bg-gradient-to-r data-[active=true]:from-primary data-[active=true]:via-white data-[active=true]:to-[rgba(34,211,238,0.12)]
                  data-[active=true]:text-primary data-[active=true]:font-semibold
                  data-[active=true]:shadow-[0_10px_30px_rgba(67,56,202,0.16)]
                  transition-all duration-200
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
        className="
          w-full px-2 h-13  font-bold text-base text-white
          bg-gradient-to-r from-primary-500 to-[#22d3ee]
          shadow-lg shadow-primary/25 rounded-lg ring-1 ring-primary/30
          hover:shadow-xl hover:shadow-primary/35
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
