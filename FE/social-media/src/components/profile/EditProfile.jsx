import { useState, useEffect } from "react";
import { X, Camera } from "lucide-react";
import Button from "../common/ButtonComponent";
import InputField from "../common/InputField";
import { updateProfile } from "../../services/userService";
import { useAuth } from "../../context/AuthContext";

export default function EditProfileModal({ isOpen, onClose, currentUser, onUpdateSuccess }) {
  const { updateUser } = useAuth(); 
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    display_name: "",
    bio: "",
    avatar_url: "",
    cover_url: "",
  });

  //init form w current user data when modal opens
  useEffect(() => {
    if (isOpen && currentUser) {
      setFormData({
        display_name: currentUser.display_name || "",
        bio: currentUser.bio || "",
        avatar_url: currentUser.avatar_url || "",
        cover_url: currentUser.cover_url || "",
      });
    }
  }, [isOpen, currentUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      //call api to update db
      const res = await updateProfile(formData);
      
      //update Global Auth State-> header/sidebar update immediately
      updateUser(res.user);

      //notify parent component -> refresh local view
      if (onUpdateSuccess) onUpdateSuccess(res.user);
      
      onClose();
    } catch (error) {
      console.error("Failed to update profile", error);
      alert("Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Edit Profile</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto">
          <form id="edit-profile-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
            
            {/* Avatar Preview & Input */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative group">
                <img 
                  src={formData.avatar_url || `https://ui-avatars.com/api/?name=${formData.display_name}`} 
                  alt="Avatar Preview" 
                  className="w-24 h-24 rounded-full object-cover border-4 border-gray-100"
                />
                <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <Camera className="text-white" />
                </div>
              </div>
              <div className="w-full">
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Avatar URL</label>
                  <input 
                    type="text"
                    name="avatar_url"
                    value={formData.avatar_url}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                    placeholder="https://example.com/avatar.jpg"
                  />
                  <p className="text-xs text-gray-400 mt-1">Paste a direct image link.</p>
              </div>
            </div>

            <InputField 
              label="Display Name" 
              name="display_name" 
              value={formData.display_name} 
              onChange={handleChange} 
              required
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-base font-medium text-gray-600 ml-1">Bio</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={3}
                maxLength={150}
                className="w-full font-medium rounded-[var(--radius-btn)] border border-gray-300 bg-white px-4 py-3 text-base text-black placeholder:text-gray-400 outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 resize-none"
                placeholder="Tell us about yourself..."
              />
              <div className="text-right text-xs text-gray-400">
                {formData.bio.length}/150
              </div>
            </div>

            <div className="w-full">
                <label className="text-sm font-medium text-gray-700 mb-1 block">Cover Image URL</label>
                <input 
                  type="text"
                  name="cover_url"
                  value={formData.cover_url}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  placeholder="https://example.com/cover.jpg"
                />
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
          <Button variant="ghost" onClick={onClose} type="button">Cancel</Button>
          <Button type="submit" form="edit-profile-form" loading={loading}>Save Changes</Button>
        </div>

      </div>
    </div>
  );
}