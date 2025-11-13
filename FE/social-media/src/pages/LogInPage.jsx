import React, { useState } from "react";
import Button from "../components/Button.jsx";
import InputField from "../components/InputField.jsx";
import logo from "../assets/img/logo/logo.png";

import { useEffect } from "react";

export default function Login({ onSwitch, onSuccess, onForgot }) {
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [layout, setLayout] = useState({
    isShort: false,
    isNarrow: false,
    isWide: false,
  }); //for tall/short n large/narrow devices

  useEffect(() => {
    const check = () => {
      if (typeof window === "undefined") return;
      const h = window.innerHeight;
      const w = window.innerWidth;
      setLayout({
        isShort: h < 680,
        isNarrow: w <= 480, //threshold
        isWide: w >= 1024, // desktops
      });
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");

    if (!form.identifier || !form.password) {
      setErr("Missing email or password.");
      return;
    }
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, remember }),
      }); ////

      const data = await res.json();
      if (!res.ok)
        throw new Error(data?.error || data?.message || "Login failed.");

      localStorage.setItem("token", data.token);
      if (typeof onSuccess === "function") onSuccess(data);
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setLoading(false);
    }
  }

  const { isShort, isNarrow, isWide } = layout;

  return (
    <div style={getRoot(isShort, isWide)}>
      {!isWide && (
        <div style={topBar}>
          <div style={brandRow}>
            <img src={logo} alt=" SocioICT logo" style={brandLogo} />
            <span style={brandName}>SocioICT</span>
          </div>
        </div>
      )}

      {isWide && (
        <div style={heroWrap}>
          <div style={heroLogoRow}>
            <img src={logo} alt="SocioICT logo" style={heroLogo} />
            <span style={heroBrand}>SocioICT</span>
          </div>
          <h2 style={heroTitle}>Welcome back</h2>
          <p style={heroSubtitle}>
            Log in to reconnect with friends, classmates, and communities in
            your faculty.
          </p>
        </div>
      )}

      <div style={getCard(isShort, isNarrow, isWide)}>
        {/*header*/}
        <div style={getHeaderWrap(isShort, isWide)}>
          <h1 style={getHeaderTitle(isShort, isWide)}>Login</h1>
          {/*<div style={subRow}>
            <span style={subText}>Don’t have an account?</span>
            <button type="button" onClick={onSwitch} style={linkBtn}>Sign Up</button>
          </div>*/}
        </div>

        {/*form */}
        <form
          onSubmit={handleSubmit}
          style={getFormCol(isShort, isNarrow, isWide)}
        >
          <InputField
            label="Email"
            name="identifier"
            type="email"
            value={form.identifier}
            placeholder="Enter your email"
            onChange={handleChange}
            required
            size={isWide ? "xl" : "md"} //
            autoComplete="email"
            inputMode="email"
          />

          <InputField
            label="Password"
            name="password"
            type="password"
            value={form.password}
            placeholder="Enter your password"
            onChange={handleChange}
            required
            style={{ marginTop: 8 }}
            size={isWide ? "xl" : "md"}
            autoComplete="current-password"
          />

          <div style={rowBetween}>
            <label style={rememberRow}>
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                style={checkbox}
              />
              <span style={getSubText(isWide)}>Remember me</span>
            </label>

            <button
              type="button"
              onClick={onForgot}
              style={{ ...getLinkBtn(isWide), padding: 0 }}
              aria-label="Forgot Password"
            >
              Forgot Password ?
            </button>
          </div>

          {err && <div style={errorBox}>{err}</div>}

          <div>
            <Button
              variant="primary"
              size="lg"
              loading={loading}
              className="w-100"
              style={getCta(isShort, isNarrow, isWide)}
              type="submit"
            >
              Log In
            </Button>
          </div>

          {/*divider */}
          <div style={dividerRow}>
            <div style={hr} />
            <span style={getSubText(isWide)}>Or</span>
            <div style={hr} />
          </div>

          {/*social buttons */}
          <Button
            variant="outline"
            size="md"
            as="button"
            type="button"
            className="w-100"
            style={socialBtn(isWide)}
          >
            <span style={socialIconGoogle} aria-hidden />
            <span style={socialText}>Continue with Google</span>
          </Button>

          <Button
            variant="outline"
            size="md"
            as="button"
            type="button"
            className="w-100"
            style={socialBtn(isWide)}
          >
            <span style={socialIconFacebook} aria-hidden />
            <span style={socialText}>Continue with Facebook</span>
          </Button>
         


          {isWide&& (
        <div style={dividerRow}>
            <div style={hrSolid} />
            
        </div>
        <div>
          <Button
              variant="primary"
              size="lg"
              loading={loading}
              className="w-100"
              style={getCta(isShort, isNarrow, isWide)}
              type="button"
              onClick={onSwitch}
            >
              Create A New Account
            </Button>
        </div>
      )}
        </form>

        

        
      </div>

      {/* Bottom signup row*/}
      {!isWide && (
        <div style={getBottomRow(isShort)}>
          <span style={getSubText(false)}>Don’t have an account?</span>
          <button type="button" onClick={onSwitch} style={getLinkBtn(false)}>
            Sign Up
          </button>
        </div>
      )}
      
    </div>
  );
}

/*Layout & style tokens */
const baseroot = {
  width: "100%",
  /*maxWidth: 500,*/
  minHeight: "100dvh",
  margin: "0 auto",
  padding: "24px 16px 16px",
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  position: "relative",

  background: "var(--primary-background)",
};

const getRoot = (isShort, isWide) => {
  if (isWide) {
    return {
      ...baseroot,
      minHeight: "100dvh",
      padding: "72px 24px 24px 72px",
      flexDirection: "row",
      alignItems: "flex-start", //caard on top right , top align
      justifyContent: "flex-start", //hero left card right
      //gap: 0,
      //maxWidth: 1280,
      margin: "0 auto",
    };
  } else {
    return {
      ...baseroot,
      justifyContent: isShort ? "flex-start" : "center", //center on tall,start of short
    };
  }
};

const topBar = {
  width: "100%",

  display: "flex",
  justifyContent: "center",
  alignItems: "flex-start",
  marginBottom: 16,
};

const brandRow = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
};

const brandLogo = {
  width: "clamp(24px, 5vw, 50px)",
  height: "clamp(24px, 5vw, 50px)",
  objectFit: "contain",
};

const brandName = {
  fontFamily: "Inter, sans-serif",
  fontWeight: 700,
  fontSize: "clamp(20px, 4vw, 29px)",
  lineHeight: 1.25,
  color: "var(--primary-purple-500)",
};

const heroWrap = {
  flex: "0 0 clamp(360px, 34vw, 560px)",
  maxWidth: "clamp(360px, 34vw, 560px)",
  display: "flex",
  minHeight: "100dvh",
  flexDirection: "column",
  justifyContent: "center", //center
  alignItems: "flex-start",
  gap: 20,
  marginRight: 30,
};

const heroLogoRow = {
  display: "flex",
  alignItems: "center",
  gap: 12,
};

const heroLogo = {
  width: 60,
  height: 60,
  objectFit: "contain",
};

const heroBrand = {
  fontFamily: "Inter, sans-serif",
  fontWeight: 700,
  fontSize: 48,
  color: "var(--primary-purple-500)",
};

const heroTitle = {
  margin: 0,
  fontFamily: "Inter, sans-serif",
  fontWeight: 800,
  fontSize: 60,
  color: "var(--text-black)",
  lineHeight: 1,
};

const heroSubtitle = {
  margin: 0,
  fontFamily: "Inter, sans-serif",
  fontSize: 22,
  lineHeight: 1.8,
  color: "var(--text-gray)",
};

/////

const baseCard = {
  width: "100%",

  padding: "clamp(18px, 4vw, 24px)",

  position: "relative",

  boxSizing: "border-box",
  margin: "8px auto 12px",
  background: "var(--neutral-100)",
  borderRadius: 14,
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
  //gap: "clamp(16px, 3vw, 24px)",
};

const getCard = (isShort, isNarrow, isWide) => {
  if (isWide) {
    return {
      ...baseCard,
      maxWidth: "min(960px, calc(100vw - 56px - 32px))",
      width: "clamp(640px, 46vw, 960px)",
      margin: 0,
      marginLeft: "auto", //push to right
      position: "sticky",
      top: 24,
      borderRadius: 20,
      flex: "0 0 auto", //dont grow
      alignSelf: "flex-start",

      marginTop: 24, //near top
      marginRight: 24,
      boxShadow: "0 18px 40px rgba(15,15,30,0.12)",
    };
  }
  return {
    ...baseCard,

    maxWidth: "100%",
    marginTop: isShort ? 4 : 8,
    marginBottom: isShort ? 8 : 12,
    boxShadow: isNarrow
      ? "0px 8px 24px rgba(0,0,0,0.04)"
      : "0px 10px 30px rgba(15,15,30,0.08)",
  };
}; ////

const getHeaderWrap = (isShort, isWide) => ({
  alignSelf: "stretch",
  display: "flex",
  justifyContent: "center", //?
  flexDirection: "column",
  alignItems: isWide ? "center" : "center", //:))
  gap: isShort ? 2 : 4,
});

const getHeaderTitle = (isShort, isWide) => ({
  margin: 0,
  fontFamily: "Inter, sans-serif",
  fontWeight: 800,
  fontSize: isWide
    ? 56
    : isShort
    ? "clamp(22px, 5vw, 26px)"
    : "clamp(24px, 3vw, 30px)",
  lineHeight: 1.4,
});

// const subRow = {
//   alignSelf: "stretch",
//   display: "flex",
//   alignItems: "center",
//   justifyContent: "center",
//   gap: 6,
// };

const getSubText = (isWide) => ({
  fontFamily: "Inter, sans-serif",
  fontSize: isWide ? 20 : "clamp(12px, 2.8vw, 14px)",
  lineHeight: 1.6,
  color: "var(--text-gray)",
});

const getLinkBtn = (isWide) => ({
  padding: 0,
  display: "inline",
  background: "none",
  border: "none",
  color: "var(--accent-info)",
  fontSize: isWide ? 19 : "clamp(11px, 2.6vw, 12px)",
  lineHeight: 1.6,
  fontWeight: 600,
  cursor: "pointer",
  textDecoration: "none",
});

const getFormCol = (isShort, isWide) => ({
  display: "flex",
  flexDirection: "column",

  gap: isWide ? 21 : isShort ? 10 : 14,
  marginTop: isWide ? 17 : 0,
  color: "border-color",
});

const rowBetween = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  width: "100%",
  gap: 8,
};

const rememberRow = {
  display: "flex",
  alignItems: "center",
  gap: 5,
};

const checkbox = {
  width: 16,
  height: 16,
  accentColor: "var(--primary-purple-500)",
  marginRight: 4,
  display: "inline-flex",
};

const getCta = (isShort, isNarrow, isWide) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",

  width: "100%",
  height: isWide ? 64 : "clamp(46px, 6.2vh, 54px)",

  margin:
    isShort || isNarrow || isWide
      ? "clamp(18px, 4vh, 24px) auto"
      : "clamp(24px, 6vh, 36px) auto",
  borderRadius: 14,
  boxShadow: "0px 4px 8px rgba(0,0,0,0.20)",
});

const dividerRow = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 16,
  margin: "2px 0 12px",
};


const hr = {
  flex: "1 1 0",
  height: 0,
  borderTop: "1px solid var(--neutral-300)",
};
const hrSolid = {
  ...hr,
  //borderTop: "1px solid var(--neutral-500)", 
  borderTopColor: "var(--neutral-500)",
  marginTop:30,
};

const socialBtn = (isWide) => ({
  height: isWide ? 60 : "clamp(44px, 6.2vh, 50px)",
  borderRadius: 10,
  outline: "1px solid var(--neutral-300)",
  boxShadow: "inset 0px -3px 6px var(--text-gray-200)",
  display: "inline-flex",
  justifyContent: "center",
  alignItems: "center",
  gap: 10,
  background: "var(--neutral-100)",
});

const socialText = {
  fontFamily: "Inter, sans-serif",
  fontWeight: 600,
  fontSize: "clamp(15px, 3vw, 20px)",
  lineHeight: 1.5,
  color: "var(--text-black,var(--text-black))",
};

const socialIconGoogle = {
  width: 18,
  height: 18,
  display: "inline-block",
  background:
    "conic-gradient(from 90deg at 70% 70%, #4285F4 0 25%, #34A853 0 50%, #FBBC05 0 75%, #EB4335 0 100%)",
  WebkitMask:
    "url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%270 0 48 48%27><path fill=%22%23000%22 d=%27M44.5 20H24v8.5h11.8C34.9 32.9 30.1 36 24 36c-6.6 0-12.2-4.3-14.2-10.2S9 13.6 15 11.1 28.2 11.8 32 16l6-6C33.1 3.9 26-0.1 18.5 0.0 8.6 0 0.2 7.5 0 17.4c-0.2 9.9 7.6 18.1 17.4 18.3 8.8 0.2 16.3-5.8 18-13.8 0.3-1.9 0.4-3.8 0.1-6z%27/></svg>') center / contain no-repeat",
  mask: "url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%270 0 48 48%27><path fill=%22%23000%22 d=%27M44.5 20H24v8.5h11.8C34.9 32.9 30.1 36 24 36c-6.6 0-12.2-4.3-14.2-10.2S9 13.6 15 11.1 28.2 11.8 32 16l6-6C33.1 3.9 26-0.1 18.5 0.0 8.6 0 0.2 7.5 0 17.4c-0.2 9.9 7.6 18.1 17.4 18.3 8.8 0.2 16.3-5.8 18-13.8 0.3-1.9 0.4-3.8 0.1-6z%27/></svg>') center / contain no-repeat",
};

const socialIconFacebook = {
  width: 18,
  height: 18,
  display: "inline-block",
  background: "linear-gradient(0deg, #0062E0 0%, #19AFFF 100%)",
  WebkitMask:
    "url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%270 0 24 24%27><path fill=%22%23000%22 d=%27M22 12a10 10 0 1 0-11.6 9.9v-7h-2.2V12h2.2V9.8c0-2.2 1.3-3.5 3.4-3.5.98 0 2 .18 2 .18v2.2h-1.1c-1.1 0-1.5.69-1.5 1.4V12h2.6l-.42 2.9h-2.2v7A10 10 0 0 0 22 12z%27/></svg>') center / contain no-repeat",
  mask: "url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%270 0 24 24%27><path fill=%22%23000%22 d=%27M22 12a10 10 0 1 0-11.6 9.9v-7h-2.2V12h2.2V9.8c0-2.2 1.3-3.5 3.4-3.5.98 0 2 .18 2 .18v2.2h-1.1c-1.1 0-1.5.69-1.5 1.4V12h2.6l-.42 2.9h-2.2v7A10 10 0 0 0 22 12z%27/></svg>') center / contain no-repeat",
};

const errorBox = {
  background: "var(--neutral-200)",
  color: "var(--accent-danger)",
  border: "1px solid var(--accent-danger-100)",
  borderRadius: 8,
  padding: "8px 10px",
  fontSize: 13,
};

const getBottomRow = (isShort) => ({
  marginTop: isShort ? 8 : 16,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
});
