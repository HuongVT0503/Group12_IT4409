import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import {
  User,
  Link as Save,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Lock,
} from "lucide-react";
//import { set } from "date-fns";
import { useNavigate } from "react-router-dom";
import { changePassword } from "../../services/authService";
import InputField from "../../components/common/InputField";
import TextAreaField from "../../components/common/TextAreaField";

export default function SettingsPage() {
  const { user, logout, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMessage, setPwdMessage] = useState({ type: "", text: "" });
  const [pwdData, setPwdData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

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

      const cleanPayload = Object.fromEntries(
        Object.entries({
          display_name: formData.display_name,
          bio: formData.bio,
          phone: formData.phone,
          gender: formData.gender,
          date_of_birth: formData.date_of_birth,
        }).filter(([, value]) => value !== "")
      );

      const res = await api.put("/users/me", cleanPayload);

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

  const handlePwdChange = (e) => {
    setPwdData({ ...pwdData, [e.target.name]: e.target.value });
  };

  const handlePwdSubmit = async (e) => {
    e.preventDefault();
    setPwdMessage({ type: "", text: "" });

    if (pwdData.newPassword !== pwdData.confirmPassword) {
      setPwdMessage({ type: "error", text: "New passwords do not match." });
      return;
    }

    if (pwdData.newPassword.length < 6) {
      setPwdMessage({
        type: "error",
        text: "Password must be at least 6 characters.",
      });
      return;
    }

    setPwdLoading(true);
    try {
      await changePassword(pwdData.oldPassword, pwdData.newPassword);
      setPwdMessage({
        type: "success",
        text: "Password changed successfully!",
      });
      setPwdData({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to change password.";
      setPwdMessage({ type: "error", text: msg });
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 mb-6 font-medium transition-colors cursor-pointer"
        style={{ color: "var(--settings-text-secondary)" }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.color = "var(--color-primary-500)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.color = "var(--settings-text-secondary)")
        }
      >
        <ArrowLeft size={20} /> Back
      </button>
      <h1
        className="text-2xl font-bold mb-6"
        style={{ color: "var(--settings-text-primary)" }}
      >
        Account Settings
      </h1>

      {message.text && (
        <div
          className={`p-4 rounded-lg mb-6 flex items-center gap-2 ${
            message.type === "success"
              ? "dark:bg-green-50 light:bg-green-500 text-green-700"
              : "dark:bg-red-50 light:bg-red-500 text-red-700"
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

      <div
        className="rounded-xl shadow-sm border overflow-hidden"
        style={{
          backgroundColor: "var(--settings-card-bg)",
          borderColor: "var(--settings-card-border)",
        }}
      >
        <div
          className="p-6 border-b"
          style={{
            backgroundColor: "var(--settings-section-header)",
            borderColor: "var(--settings-card-border)",
          }}
        >
          <h2
            className="text-lg font-semibold"
            style={{ color: "var(--settings-text-primary)" }}
          >
            Profile Information
          </h2>
          <p
            className="text-sm mt-1"
            style={{ color: "var(--settings-text-secondary)" }}
          >
            Update your public profile details.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Display Name */}
          <InputField
            label="Display Name"
            name="display_name"
            value={formData.display_name}
            onChange={handleChange}
            icon={User}
            placeholder="Your Name"
            style={{
              backgroundColor: "var(--settings-input-bg)",
              borderColor: "var(--settings-input-border)",
              color: "var(--settings-input-text)",
            }}
          />

          {/* Bio */}
          <TextAreaField
            label="Bio"
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            rows={3}
            placeholder="Tell us a little about yourself..."
            style={{
              backgroundColor: "var(--settings-input-bg)",
              borderColor: "var(--settings-input-border)",
              color: "var(--settings-input-text)",
            }}
          />

          {/* Phone Input */}
          <InputField
            label="Phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            style={{
              backgroundColor: "var(--settings-input-bg)",
              borderColor: "var(--settings-input-border)",
              color: "var(--settings-input-text)",
            }}
          />

          {/* Gender Select */}
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: "var(--settings-text-primary)" }}
            >
              Gender
            </label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="block w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              style={{
                backgroundColor: "var(--settings-input-bg)",
                borderColor: "var(--settings-input-border)",
                color: "var(--settings-input-text)",
              }}
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Date of Birth Input */}
          <InputField
            label="Date of Birth"
            name="date_of_birth"
            type="date"
            value={formData.date_of_birth}
            onChange={handleChange}
            style={{
              backgroundColor: "var(--settings-input-bg)",
              borderColor: "var(--settings-input-border)",
              color: "var(--settings-input-text)",
            }}
          />

          <div className="pt-4 flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={logout}
              className="px-4 py-2 rounded-lg transition-colors text-sm font-medium"
              style={{
                color: "var(--settings-button-logout-text)",
                backgroundColor: "transparent",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor =
                  "var(--settings-button-logout-hover)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "transparent")
              }
            >
              Log Out
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 rounded-lg transition-colors font-medium disabled:opacity-50"
              style={{
                backgroundColor: "var(--settings-button-save-bg)",
                color: "var(--settings-button-save-text)",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor =
                  "var(--settings-button-save-hover)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor =
                  "var(--settings-button-save-bg)")
              }
            >
              <Save size={18} />
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
      <div
        className="rounded-xl shadow-sm border overflow-hidden mt-6"
        style={{
          backgroundColor: "var(--settings-card-bg)",
          borderColor: "var(--settings-card-border)",
        }}
      >
        <div
          className="p-6 border-b"
          style={{
            backgroundColor: "var(--settings-section-header)",
            borderColor: "var(--settings-card-border)",
          }}
        >
          <h2
            className="text-lg font-semibold"
            style={{ color: "var(--settings-text-primary)" }}
          >
            Security
          </h2>
          <p
            className="text-sm mt-1"
            style={{ color: "var(--settings-text-secondary)" }}
          >
            Manage your password and account security.
          </p>
        </div>

        {pwdMessage.text && (
          <div
            className={`mx-6 mt-6 p-4 rounded-lg flex items-center gap-2 ${
              pwdMessage.type === "success"
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {pwdMessage.type === "success" ? (
              <CheckCircle size={20} />
            ) : (
              <AlertCircle size={20} />
            )}
            {pwdMessage.text}
          </div>
        )}

        <form onSubmit={handlePwdSubmit} className="p-6 space-y-6">
          {/* Current Password */}
          <InputField
            label="Current Password"
            name="oldPassword"
            type="password"
            value={pwdData.oldPassword}
            onChange={handlePwdChange}
            required
            icon={Lock}
            placeholder="Enter current password"
            style={{
              backgroundColor: "var(--settings-input-bg)",
              borderColor: "var(--settings-input-border)",
              color: "var(--settings-input-text)",
            }}
          />

          {/* New Password */}
          <InputField
            label="New Password"
            name="newPassword"
            type="password"
            value={pwdData.newPassword}
            onChange={handlePwdChange}
            required
            icon={Lock}
            placeholder="Enter new password"
            style={{
              backgroundColor: "var(--settings-input-bg)",
              borderColor: "var(--settings-input-border)",
              color: "var(--settings-input-text)",
            }}
          />

          {/* Confirm Password */}
          <InputField
            label="Confirm New Password"
            name="confirmPassword"
            type="password"
            value={pwdData.confirmPassword}
            onChange={handlePwdChange}
            required
            icon={Lock}
            placeholder="Confirm new password"
            style={{
              backgroundColor: "var(--settings-input-bg)",
              borderColor: "var(--settings-input-border)",
              color: "var(--settings-input-text)",
            }}
          />

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={pwdLoading}
              className="flex items-center gap-2 px-6 py-2 rounded-lg transition-colors font-medium disabled:opacity-50"
              style={{
                backgroundColor: "var(--settings-button-update-bg)",
                color: "#ffffff",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor =
                  "var(--settings-button-update-hover)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor =
                  "var(--settings-button-update-bg)")
              }
            >
              {pwdLoading ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
