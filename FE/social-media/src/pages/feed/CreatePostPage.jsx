import { useNavigate } from "react-router-dom";
import CreatePost from "../../components/feed/CreatePost";

export default function CreatePostPage() {
  const navigate = useNavigate();

  return (
    <div className="p-4 max-w-xl mx-auto pt-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Create New Post</h1>
      
      
      <CreatePost 
        onPostCreated={() => {
          //success-> back to feed
          navigate("/"); 
        }} 
      />
    </div>
  );
}