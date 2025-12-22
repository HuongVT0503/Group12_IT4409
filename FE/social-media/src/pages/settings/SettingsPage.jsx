import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import {
  User,
  Link as Save,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
} from "lucide-react";
//import { set } from "date-fns";
import { useNavigate } from "react-router-dom";

export default function SettingsPage() {
  const { user, logout, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    display_name: "",
    bio: "",
    phone: "",
    gender: "",
    date_of_birth: "",
  });

  const formatDateForInput = (isoDate) => {
    if (!isoDate) return "";
    return isoDate.split("T")[0];
  }; //format date for input YYYY-MM-DD

  //load current user data FROM SERVER into form
  useEffect(() => {
    const fetchFreshUserData = async () => {
      if (!user?.id) return;
      try {
        //fetch user profile from be
        const res = await api.get(`/users/${user.id}`);
        const freshUser = res.data.user;

        setFormData({
          display_name: freshUser.display_name || "",
          bio: freshUser.bio || "",
          phone: freshUser.phone || "",
          gender: freshUser.gender || "",
          date_of_birth: formatDateForInput(freshUser.date_of_birth) || "",
        });
        updateUser(freshUser); //sync to global context/ localstorage
      } catch (error) {
        console.error("Failed to fetch fresh user data", error);
        //fallback to context
        setFormData((prev) => ({
          ...prev,
          display_name: user.display_name || "",
          bio: user.bio || "",
          phone: user.phone || "",
          gender: user.gender || "",
          date_of_birth: formatDateForInput(user.date_of_birth) || "",
        }));
      }
    };
    fetchFreshUserData();
  }, [user?.id]); //rerun if id changes

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      // be expects: display_name, bio
      // formData.display_name -> display_name
      //userRepo.updateProfile-> { display_name, bio, cover_url, avatar_url }

      const payload = {
        display_name: formData.display_name,
        bio: formData.bio,
        phone: formData.phone,
        gender: formData.gender,
        date_of_birth: formData.date_of_birth,
      };

      const res = await api.put("/users/me", payload);

      if (res.data && res.data.user) {
        updateUser(res.data.user);
      } //update global user context -> sideba/ header ipdate immediately

      setMessage({ type: "success", text: "Profile updated successfully!" });

      // window.location.reload(); //refresh page to update global user context
    } catch (error) {
      console.error(error);
      setMessage({
        type: "error",
        text: "Failed to update profile. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-500 hover:text-primary mb-6 font-medium transition-colors cursor-pointer"
      >
        <ArrowLeft size={20} /> Back
      </button>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Account Settings
      </h1>

      {message.text && (
        <div
          className={`p-4 rounded-lg mb-6 flex items-center gap-2 ${
            message.type === "success"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle size={20} />
          ) : (
            <AlertCircle size={20} />
          )}
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">
            Profile Information
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Update your public profile details.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Display Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                name="display_name"
                value={formData.display_name}
                onChange={handleChange}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="Your Name"
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bio
            </label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows={3}
              className="block w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              placeholder="Tell us a little about yourself..."
            />
          </div>

          {/* Phone Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="block w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500"
            />
          </div>

          {/* Gender Select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gender
            </label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="block w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500"
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Date of Birth Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date of Birth
            </label>
            <input
              type="date"
              name="date_of_birth"
              value={formData.date_of_birth}
              onChange={handleChange}
              className="block w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={logout}
              className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
            >
              Log Out
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
            >
              <Save size={18} />
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
