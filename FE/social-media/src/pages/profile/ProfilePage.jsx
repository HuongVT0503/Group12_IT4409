import { useEffect, useState } from "react";
import { getProfile } from "../../services/userService";
//import MainLayout from "../../components/layout/MainLayout";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  //get current user ID from local storage
  const storedUser = JSON.parse(localStorage.getItem('user'));
  const userId = storedUser?.id || storedUser?.userId;

  useEffect(() => {
    if (!userId) return;
    
    getProfile(userId)
      .then((data) => {
        setUser(data.user);
      })
      .catch((err) => console.error("Profile fetch error", err))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <div className="p-8 text-center">Loading profile...</div>;
  if (!user) return <div className="p-8 text-center">User not found</div>;

  return (
    <div className="max-w-2xl mx-auto bg-white min-h-screen shadow-sm border-x border-gray-100">
      {/* Cover Image Placeholder/ default pfp */}
      <div className="h-48 bg-gradient-to-r from-purple-400 to-blue-400 w-full relative"></div>
      
      <div className="px-6 pb-6">
        <div className="relative flex justify-between items-end -mt-12 mb-4">
          <img 
            src={user.avatar_url || "https://i.pravatar.cc/150?u=me"} 
            alt="Avatar" 
            className="w-32 h-32 rounded-full border-4 border-white object-cover bg-gray-200"
          />
          <button className="mb-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full font-semibold text-sm transition-colors">
            Edit Profile
          </button>
        </div>

        <h1 className="text-2xl font-bold text-gray-900">{user.display_name}</h1>
        <p className="text-gray-500">@{user.username}</p>
        
        {user.bio && <p className="mt-4 text-gray-700">{user.bio}</p>}

        <div className="flex gap-6 mt-4 border-t border-gray-100 pt-4">
          <div className="text-center">
            <span className="font-bold block text-lg">0</span>
            <span className="text-gray-500 text-sm">Followers</span>
          </div>
          <div className="text-center">
            <span className="font-bold block text-lg">0</span>
            <span className="text-gray-500 text-sm">Following</span>
          </div>
        </div>
      </div>
    </div>
  );
}