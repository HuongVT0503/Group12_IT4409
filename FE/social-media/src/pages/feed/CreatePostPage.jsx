//import React from "react";
import { useNavigate } from "react-router-dom";
//import { useEffect } from "react";
import CreatePost from "../../components/feed/CreatePost";
import RightPanel from "../../components/layout/RightPanel";

export default function CreatePostPage() {
  const navigate = useNavigate();

  const handlePostCreated = () => {
    navigate("/"); 
  };

  return (
    <div
      style={{ backgroundColor: "var(--profile-bg)" }}
      className="w-full h-screen overflow-hidden bg-bg/20 backdrop-blur-sm flex items-center"
    >
      <div className="p-4 max-w-2xl pt-6 mx-auto w-full h-full ">
        <h1
          className="text-2xl font-bold mb-6"
          style={{ color: "var(--create-post-title)" }}
        >
          Create New Post
        </h1>

        <div className="relative z-10">
            <CreatePost onPostCreated={handlePostCreated} />
        </div>

      </div>

      <aside className="hidden xl:block w-[320px] h-[calc(100vh-80px)] overflow-y-auto no-scrollbar sticky top-20 ml-10">
        <RightPanel />
      </aside>
    </div>
  );
}
