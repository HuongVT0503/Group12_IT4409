import { useState, useEffect, useRef } from "react";
import { X, Camera, Image as ImageIcon } from "lucide-react";
import Button from "../common/ButtonComponent";
import InputField from "../common/InputField";
import TextAreaField from "../common/TextAreaField";
import { updateProfile } from "../../services/userService";
import { useAuth } from "../../context/AuthContext";
import { uploadMedia } from "../../services/mediaService";
import Avatar from "../common/Avatar";

export default function EditProfileModal({
  isOpen,
  onClose,
  currentUser,
  onUpdateSuccess,
}) {
  const { updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);

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

      //access data.user from wrapped resp
      const updatedUserData = res.data.user;

      // update Global Auth State -> header/sidebar update immediately
      updateUser(updatedUserData);

      //notify parent component -> refresh local view
      if (onUpdateSuccess) onUpdateSuccess(updatedUserData);

      onClose();
    } catch (error) {
      console.error("Failed to update profile", error);
      alert("Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const uploaded = await uploadMedia(file);
      //update form data w new url from be
      setFormData((prev) => ({ ...prev, [field]: uploaded.url }));
    } catch (error) {
      console.error(`Failed to upload ${field}`, error);
      alert("Image upload failed.");
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-200 flex items-center p-4 justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl  shadow-xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-300">
          <h2 className="text-xl font-bold text-gray-900">Edit Profile</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto">
          <form
            id="edit-profile-form"
            onSubmit={handleSubmit}
            className="flex flex-col gap-5"
          >
            {/* Avatar */}
            <div className="flex flex-col items-center gap-4">
              <div
                className="relative group cursor-pointer"
                onClick={() => !uploading && avatarInputRef.current?.click()}
                title="Upload new avatar"
              >
                <Avatar
                  src={
                    formData.avatar_url ||
                    `https://ui-avatars.com/api/?name=${formData.display_name}`
                  }
                  size={25}
                />
                <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="text-white" />
                </div>
                <input
                  type="file"
                  ref={avatarInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, "avatar_url")}
                />
              </div>

              <p className="text-xs text-gray-400 mt-1">
                Click on avatar to change.
              </p>
            </div>

            <InputField
              label="Display Name"
              name="display_name"
              value={formData.display_name}
              onChange={handleChange}
              required
            />

            <TextAreaField
              label="Bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows={4}
              maxLength={150}
              showCounter={true}
              placeholder="Tell us about yourself..."
            />

            <div className="w-full">
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-semibold text-gray-700">
                  Edit Cover Photo
                </label>
                <div
                  className={`relative w-full h-40 bg-gray-50 rounded-xl overflow-hidden cursor-pointer border-2 border-dashed border-gray-200 hover:border-primary/50 transition-all group ${
                    uploading ? "opacity-50 pointer-events-none" : ""
                  }`}
                  onClick={() => coverInputRef.current?.click()}
                  title="Click to upload new cover"
                >
                  {formData.cover_url ? (
                    <>
                      <img
                        src={formData.cover_url}
                        alt="Cover Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="text-white drop-shadow-md" />
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                      <ImageIcon size={24} />
                      <span className="text-xs font-medium">
                        Click to upload cover photo
                      </span>
                    </div>
                  )}

                  <input
                    type="file"
                    ref={coverInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, "cover_url")}
                  />
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
          <Button
            variant="ghost"
            onClick={onClose}
            type="button"
            className="rounded-lg py-2"
            size="sm"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="edit-profile-form"
            className="rounded-lg py-2"
            size="sm"
            loading={loading || uploading}
            disabled={uploading}
          >
            {uploading ? "Uploading..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
