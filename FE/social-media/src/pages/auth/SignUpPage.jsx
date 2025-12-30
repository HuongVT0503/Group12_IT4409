// src/pages/SignUpPage.jsx
import { useState } from "react";
import Button from "../../components/common/ButtonComponent.jsx";
import InputField from "../../components/common/InputField.jsx";
import logo from "../../assets/img/logo/logo.png";

import { registerUser } from "../../services/authService.js";

export default function SignUpPage({ onSwitch, onSuccess, onBack }) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    dob: "",
    gender: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  // const [layout, setLayout] = useState({
  //   isShort: false,
  //   isNarrow: false,
  //   isWide: false,
  // });

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // useEffect(() => {
  //   const check = () => {
  //     if (typeof window === "undefined") return;
  //     const h = window.innerHeight;
  //     const w = window.innerWidth;
  //     setLayout({
  //       isShort: h < 680,
  //       isNarrow: w <= 480,
  //       isWide: w >= 1024,
  //     });
  //   };
  //   check();
  //   window.addEventListener("resize", check);
  //   return () => window.removeEventListener("resize", check);
  // }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");

    // if (
    //   !form.firstName ||
    //   !form.lastName ||
    //   !form.email ||
    //   !form.dob ||
    //   !form.gender ||
    //   !form.phone ||
    //   !form.password ||
    //   !form.confirmPassword
    // ) {
    //   setErr("Please fill in all required fields.");
    //   return;
    // }
    if (Object.values(form).some((v) => !v)) return setErr("Fill all fields.");

    if (form.password !== form.confirmPassword) {
      setErr("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      // const res = await fetch("/api/auth/register", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ form
      //     // firstName: form.firstName,
      //     // lastName: form.lastName,
      //     // email: form.email,
      //     // password: form.password,
      //     // phone: form.phone,
      //     // dob: form.dob,
      //     // gender: form.gender,
      //   }),
      // });

      // const data = await res.json();
      // if (!res.ok)
      //   throw new Error(data?.error || data?.message || "Sign up failed.");

      const data = await registerUser({ form });

      if (data.token) {
        localStorage.setItem("token", data.token);
      }
      if (typeof onSuccess === "function") onSuccess(data);
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setLoading(false);
    }
  }

  //const { isShort, isNarrow, isWide } = layout;

  return (
    <div
      className="min-h-dvh w-full flex flex-col items-center p-4 lg:p-12 lg:flex-row lg:justify-center lg:items-center"
      style={{ backgroundColor: "var(--login-bg)" }}
    >
      {/* Mobile Header */}
      <div className="mb-6 flex items-center gap-2 lg:hidden">
        <img src={logo} alt="Logo" className="h-10 w-10 object-contain" />
        <span
          style={{ color: "var(--topbar-logo-text)" }}
          className="font-bold text-2xl"
        >
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
          Create your account
        </h2>
        <p
          className="text-3xl leading-relaxed"
          style={{ color: "var(--login-text-secondary)" }}
        >
          Join your classmates and communities in one secure, private space.
        </p>
      </div>

      <div
        className="w-full max-w-md lg:max-w-[700px] rounded-box shadow-xl p-6 lg:p-10"
        style={{ backgroundColor: "var(--login-card-bg)" }}
      >
        {/* Back Button */}
        <button
          style={{ color: "var(--login-text-primary)" }}
          onClick={onBack || onSwitch}
          className="mb-4 flex items-center justify-center w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-primary/10 text-xl lg:text-4xl pb-1 cursor-pointer"
        >
          ←
        </button>

        <div className="mb-10">
          <h1
            className="text-4xl lg:text-6xl font-bold"
            style={{ color: "var(--login-text-primary)" }}
          >
            Sign Up
          </h1>
          <div
            className="mt-4 text-base lg:text-xl"
            style={{ color: "var(--login-text-secondary)" }}
          >
            Already have an account?
            <button
              onClick={onSwitch}
              className="ml-1 text-blue-600 font-semibold hover:underline"
            >
              Log In
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 lg:gap-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <InputField
              label="First Name"
              name="firstName"
              placeholder="Enter your first name"
              size="lg"
              value={form.firstName}
              onChange={handleChange}
              required
              className="flex-1"
              style={{
                backgroundColor: "var(--login-input-bg)",
                borderColor: "var(--login-input-border)",
                color: "var(--login-input-text)",
              }}
            />
            <InputField
              label="Last Name"
              name="lastName"
              placeholder="Enter your last name"
              size="lg"
              value={form.lastName}
              onChange={handleChange}
              required
              className="flex-1"
              style={{
                backgroundColor: "var(--login-input-bg)",
                borderColor: "var(--login-input-border)",
                color: "var(--login-input-text)",
              }}
            />
          </div>

          <InputField
            label="Email"
            name="email"
            type="email"
            placeholder="Enter your email"
            size="lg"
            value={form.email}
            onChange={handleChange}
            required
            style={{
              backgroundColor: "var(--login-input-bg)",
              borderColor: "var(--login-input-border)",
              color: "var(--login-input-text)",
            }}
          />

          <div className="flex flex-col sm:flex-row gap-4">
            <InputField
              label="Date of Birth"
              name="dob"
              type="date"
              size="lg"
              value={form.dob}
              onChange={handleChange}
              required
              className="flex-1"
              style={{
                backgroundColor: "var(--login-input-bg)",
                borderColor: "var(--login-input-border)",
                color: "var(--login-input-text)",
              }}
            />

            <div className="flex-1 flex flex-col gap-2 mb-3">
              <label
                className="text-sm  font-semibold  "
                style={{ color: "var(--input-label)" }}
              >
                Gender
              </label>
              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                className="w-full rounded-lg border px-4 py-2 h-13  text-base  outline-none focus:border-[var(--input-focus-border)] focus:ring-2 focus:ring-[var(--input-focus-ring)] transition-colors"
                style={{
                  backgroundColor: "var(--login-input-bg)",
                  borderColor: "var(--login-input-border)",
                  color: "var(--login-input-text)",
                }}
              >
                <option value="" disabled>
                  Select
                </option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <InputField
            label="Phone"
            name="phone"
            type="tel"
            placeholder="Enter your phone number"
            size="lg"
            value={form.phone}
            onChange={handleChange}
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
            placeholder="Set your password"
            size="lg"
            value={form.password}
            onChange={handleChange}
            required
            style={{
              backgroundColor: "var(--login-input-bg)",
              borderColor: "var(--login-input-border)",
              color: "var(--login-input-text)",
            }}
          />
          <InputField
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            placeholder="Confirm your password"
            size="lg"
            value={form.confirmPassword}
            onChange={handleChange}
            required
            style={{
              backgroundColor: "var(--login-input-bg)",
              borderColor: "var(--login-input-border)",
              color: "var(--login-input-text)",
            }}
          />

          {err && (
            <div className="bg-red-50 text-red-600 border border-red-200 rounded-lg p-3 text-sm">
              {err}
            </div>
          )}

          <Button type="submit" size="lg" loading={loading} className="mt-2">
            Register
          </Button>
        </form>
      </div>
    </div>
  );
}
