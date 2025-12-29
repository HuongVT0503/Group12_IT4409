import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import CreatePost from "../../components/feed/CreatePost";

export default function CreatePostPage() {
  const navigate = useNavigate();

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

        <CreatePost
          onPostCreated={() => {
            //success-> back to feed
            navigate("/");
          }}
        />
      </div>
    </div>
  );
}
