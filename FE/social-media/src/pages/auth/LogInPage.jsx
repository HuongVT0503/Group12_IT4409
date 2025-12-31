import { useState, useEffect } from "react";
import Button from "../../components/common/ButtonComponent.jsx";
import InputField from "../../components/common/InputField.jsx";
//import logo from "../../assets/img/logo/logo.png";
import logo from "../../assets/img/logo/logo.png";

//import { useEffect } from "react";

import { loginUser } from "../../services/authService.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useNavigate, useLocation } from "react-router-dom";
//import { set } from "date-fns";

export default function Login({ onSwitch }) {
  //onSuccess?
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";

  //check for passed state on mount
  useEffect(() => {
    if (location.state?.email) {
      setForm((prev) => ({ ...prev, identifier: location.state.email }));
    }
    if (location.state?.message) {
      setSuccessMsg(location.state.message);
      //clear state -> msg clear after refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");
    setSuccessMsg("");

    if (!form.identifier || !form.password) {
      setErr("Missing email or password.");
      return;
    }
    setLoading(true);

    try {
      const data = await loginUser({
        identifier: form.identifier,
        password: form.password,
      });

      login(data.user, data.accessToken, remember);
      if (data.user.role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate(from, { replace: true }); //redirect to intended page
      }
    } catch (e2) {
      const msg = e2?.error?.message || e2?.message;
      if (msg === "Your account has been locked") {
        navigate("/banned");
        return;
      }
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-dvh w-full flex flex-col items-center p-4 lg:p-12 lg:flex-row lg:justify-center lg:items-center"
      style={{ backgroundColor: "var(--login-bg)" }}
    >
      {/* Mobile Header */}
      <div className="mb-6 flex items-center gap-2 lg:hidden">
        <img src={logo} alt="Logo" className="h-10 w-10 object-contain" />
        <span className="font-bold text-2xl text-[var(--topbar-logo-text)]">
          SocioICT
        </span>
      </div>

      {/* Desktop Hero */}
      <div className="hidden lg:flex flex-col justify-center max-w-[500px] mr-20 mt-20">
        <div className="flex items-center gap-3 mb-6">
          <img src={logo} alt="Logo" className="h-16 w-16" />
          <span className="font-bold text-5xl text-[var(--topbar-logo-text)]">
            SocioICT
          </span>
        </div>
        <h2
          className="text-8xl font-extrabold leading-tight mb-4"
          style={{ color: "var(--login-text-primary)" }}
        >
          Welcome back
        </h2>
        <p
          className="text-3xl leading-relaxed"
          style={{ color: "var(--login-text-secondary)" }}
        >
          Log in to reconnect with friends, classmates, and communities in your
          faculty.
        </p>
      </div>

      {/* Login Card */}
      <div
        className="w-full max-w-md lg:max-w-[540px] rounded-box shadow-xl p-6 lg:p-10 lg:mt-10"
        style={{
          backgroundColor: "var(--login-card-bg)",
          color: "var(--login-text-primary)",
        }}
      >
        <h1
          className="text-4xl lg:text-5xl font-bold text-center mb-8"
          style={{ color: "var(--login-text-primary)" }}
        >
          Log In
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {successMsg && (
            <div className="bg-green-50 text-green-700 border border-green-200 rounded-lg p-3 text-sm font-medium text-center animate-in fade-in slide-in-from-top-2">
              {successMsg}
            </div>
          )}

          <InputField
            label="Email"
            name="identifier"
            type="email"
            placeholder="Enter your email"
            value={form.identifier}
            onChange={(e) => setForm({ ...form, identifier: e.target.value })}
            required
            size="lg"
            style={{
              backgroundColor: "var(--login-input-bg)",
              borderColor: "var(--login-input-border)",
              color: "var(--login-input-text)",
            }}
          />
          <InputField
            label="Password"
            name="password"
            type="password"
            placeholder="Enter your password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            size="lg"
            style={{
              backgroundColor: "var(--login-input-bg)",
              borderColor: "var(--login-input-border)",
              color: "var(--login-input-text)",
            }}
          />

          <div className="flex items-center justify-between mt-1">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-5 h-5 lg:w-6 lg:h-6 accent-primary"
              />
              <span
                className="text-base lg:text-lg"
                style={{ color: "var(--login-text-secondary)" }}
              >
                Remember me
              </span>
            </label>
            {/* <button
              type="button"
              onClick={onForgot}
              className="text-base lg:text-lg font-semibold text-blue-600 hover:underline"
            >
              Forgot Password?
            </button> */}
          </div>

          {err && (
            <div className="bg-red-50 text-red-600 border border-red-200 rounded-lg p-3 text-sm">
              {err}
            </div>
          )}

          <Button type="submit" size="lg" loading={loading} className="mt-2">
            Log In
          </Button>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <span
                className="w-full border-t"
                style={{ borderColor: "var(--login-divider)" }}
              />
            </div>
            <div className="relative flex justify-center text-sm">
              <span
                className="px-4"
                style={{
                  backgroundColor: "var(--login-divider-bg)",
                  color: "var(--login-divider-text)",
                }}
              >
                Or
              </span>
            </div>
          </div>

          {/* <div className="flex flex-col gap-3">
            <Button variant="outline" size="md" type="button" className="gap-3">
              <div
                className="h-7 w-7 bg-center bg-no-repeat bg-contain"
                style={{
                  backgroundImage:
                    "url('https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg')",
                }}
              />
              Continue with Google
            </Button>
            <Button variant="outline" size="md" type="button" className="gap-3">
              <div
                className="h-7 w-7 bg-center bg-no-repeat bg-contain"
                style={{
                  backgroundImage:
                    "url('https://upload.wikimedia.org/wikipedia/commons/b/b8/2021_Facebook_icon.svg')",
                }}
              />
              Continue with Facebook
            </Button>
          </div> */}

          {/* Desktop Signup Button */}
          <div
            className="hidden lg:block mt-6 pt-6 border-t"
            style={{ borderColor: "var(--login-divider)" }}
          >
            <Button
              variant="primary"
              size="lg"
              type="button"
              onClick={onSwitch}
            >
              Create A New Account
            </Button>
          </div>
        </form>

        {/* Mobile Bottom Link */}
        <div className="mt-6 text-center lg:hidden">
          <span
            className="text-sm"
            style={{ color: "var(--login-text-secondary)" }}
          >
            Don’t have an account?
          </span>
          <button
            onClick={onSwitch}
            className="text-blue-600 font-semibold text-sm hover:underline ml-1"
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
}
