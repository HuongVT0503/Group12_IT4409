import { useState } from "react";
import PostCard from "../../components/feed/PostCard";
import Button from "../../components/common/ButtonComponent";

//MOCKDATA
const MOCK_POSTS = [
  {
    id: 1,
    author: {
      name: "Nguyen Van A",
      handle: "nguyenvana16",
      avatar: "https://i.pravatar.cc/150?u=hung", //placeholder avatar
    },
    timestamp: "36 mins ago",
    content:
      "Mèo là động vật có vú, nhỏ nhắn và chuyên ăn thịt, sống chung với loài người, được nuôi để săn vật gây hại hoặc làm thú nuôi cùng với chó. Mèo đã sống gần gũi với loài người ít nhất 9.500 năm, và hiện nay chúng là con vật cưng phổ biến nhất trên thế giới.",
    image:
      "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=2043&auto=format&fit=crop", // Cat looking at camera
    stats: { likes: 0, comments: 0, shares: 0 },
    comments: [],
  },
  {
    id: 2,
    author: {
      name: "Nguyen Van B",
      handle: "nguyenvanb16",
      avatar: "https://i.pravatar.cc/150?u=huong",
    },
    timestamp: "36 mins ago",
    content:
      "Mèo là động vật có vú, nhỏ nhắn và chuyên ăn thịt, sống chung với loài người, được nuôi để săn vật gây hại hoặc làm thú nuôi cùng với chó. Mèo đã sống gần gũi với loài người ít nhất 9.500 năm, và hiện nay chúng là con vật cưng phổ biến nhất trên thế giới.",
    image:
      "https://images.unsplash.com/photo-1543852786-1cf6624b9987?q=80&w=1887&auto=format&fit=crop", //cat w glasses/costume placeholder
    stats: { likes: 3, comments: 6, shares: 0 },
    comments: [
      {
        id: 101,
        author: {
          name: "Sơn Tùng MTP",
          avatar: "https://i.pravatar.cc/150?u=son",
        },
        text: "Mèo đẹp quá em ơi:)))",
        timestamp: "36 mins ago",
        replies: [
          {
            id: 201,
            author: {
              name: "Jack J97",
              avatar: "https://i.pravatar.cc/150?u=jack",
            },
            text: "Ok cậu nha:)))",
            timestamp: "39 mins ago",
          },
        ],
      },
      {
        id: 102,
        author: { name: "Anh Duy", avatar: "https://i.pravatar.cc/150?u=duy" },
        text: "Mèo đẹp quá em ơi:)))",
        timestamp: "35 mins ago",
      },
    ],
  },
];

export default function FeedPage() {
  const [posts] = useState(MOCK_POSTS);

  return (
    <div className="w-full min-h-screen bg-[#F3F4F6] pb-20 lg:pb-0">
      {/*       
      *layout logic (Sidebar/RightPanel) is in MainLayout.jsx
        This div is ONLYthe CENTER column
      
       */}
      <div className="max-w-xl mx-auto pt-6 px-4">
        {/* Create Post Input (Visual Placeholder) */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-6 flex gap-3 items-center">
          <img
            src="https://i.pravatar.cc/150?u=me"
            className="w-10 h-10 rounded-full bg-gray-200"
            alt="Me"
          />
          <button className="flex-1 text-left bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-full py-3 px-5 transition-colors text-sm font-medium">
            Whats on your mind?
          </button>
          <Button size="sm" className="hidden sm:flex">
            Post
          </Button>
        </div>

        {/* Feed List */}
        <div className="flex flex-col gap-2">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </div>
  );
}
