import React, { useState } from "react";
import Button from "../components/Button.jsx";
import InputField from "../components/InputField.jsx";
import logo from "../assets/img/logo/logo.png";



export default function Login({ onSwitch, onSuccess, onForgot }) {
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [isShort, setIsShort] = useState(false); //for smallheight/short devices


 useEffect(() => {
    const check = () => {
      if (typeof window === "undefined") return;
      setIsShort(window.innerHeight < 680); //tweak threshold
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
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || data?.message || "Login failed.");

      localStorage.setItem("token", data.token);
      if (typeof onSuccess === "function") onSuccess(data);
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setLoading(false);
    }
  }











  return (
    <div style={getRoot(isShort)}>
      <div style={getTopBar(isShort)}>
        <div style={brandRow}>
          <img src={logo} alt=" SocioICT logo" style={brandLogo} />
          <span style={brandName}>SocioICT</span>
        </div>
      </div>
      
      <div style={card}>
        {/*header*/}
        <div style={headerWrap}>
          <h1 className="h1 text-black" style={headerTitle}>Login</h1>
          <div style={subRow}>
            <span className="caption-2 text-gray"  style={{ display: "inline", flex: "0 0 auto" }}>Don’t have an account?</span>
            <button type="button" onClick={onSwitch} style={linkBtn}>Sign Up</button>
          </div>
        </div>

        {/*form */}
        <form onSubmit={handleSubmit} style={formCol}>
          <InputField
            label="Email"
            name="identifier"
            type="email"
            value={form.identifier}
            placeholder="Enter your email"
            onChange={handleChange}
            required
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
          />

          <div style={rowBetween}>
            <label style={rememberRow}>
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                style={checkbox}
              />
              <span className="caption-2 text-gray">Remember me</span>
            </label>

            <button
              type="button"
              onClick={onForgot}
              style={{ ...linkBtn, padding: 0 }}
              aria-label="Forgot Password"
            >
              Forgot Password ?
            </button>
          </div>

          {err && <div style={errorBox}>{err}</div>}

          <div style={{ position: "relative", height: 150 }}>
            <Button
              variant="primary"
              size="lg"
              loading={loading}
              className="w-100"
              style={cta}
              type="submit"
            >
              Log In
            </Button>
          </div>

          {/*divider */}
          <div style={dividerRow}>
            <div style={hr} />
            <span className="caption-2 text-gray">Or</span>
            <div style={hr} />
          </div>

          {/* Social buttons */}
          <Button
            variant="outline"
            size="md"
            as="button"
            type="button"
            className="w-100"
            style={socialBtn}
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
            style={socialBtn}
          >
            <span style={socialIconFacebook} aria-hidden />
            <span style={socialText}>Continue with Facebook</span>
          </Button>
        </form>
      </div>

      {/* Bottom signup row*/}
      <div style={bottomRow}>
        <span className="caption-2 text-gray">Don’t have an account?</span>
        <button type="button" onClick={onSwitch} style={linkBtn}>Sign Up</button>
      </div>
    </div>
  );
}






/*Layout & style tokens */
const root = {
  width: "100%",
  maxWidth: 500,
  minHeight: "100dvh",
  margin: "0 auto",
  padding:"24px 16px 16px",
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  position: "relative",
  overflow: "hidden",
  background:"var(--neutral-300)",
};

const topBar={
  width: "100%",
  maxWidth: 500,
  display: "flex",
  justifyContent: "center",
  alignItems: "flex-start",
};

const brandRow = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
};

const brandLogo = {
  width: 32,
  height: 32,
  objectFit: "contain",
};

const brandName = {
  fontFamily: "Inter, sans-serif",
  fontWeight: 700,
  fontSize: 24,
  lineHeight: "28px",
  color: "var(--primary-purple-500)", 
};

const card = {
  width: "100%",
  maxWidth: 500,
  padding: 24,

  position: "relative",
  boxSizing: "border-box",
  margin: "32px auto 16px",
  background: "#fff",
  borderRadius: 12,
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: 24,
};

const headerWrap = {
  alignSelf: "stretch",
  display: "flex",
  justifyContent: "center",
  flexDirection: "column",
  alignItems: "center",
  gap: 6,
};

const headerTitle = {
  
  margin: 0,
  fontFamily: "Inter, sans-serif",
  fontWeight: 700,
  fontSize: 32,
  lineHeight: "41.6px",
};

const subRow = {
  alignSelf: "stretch",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
};

const linkBtn = {
  padding: 0,
  display:"inline",
  background: "none",
  border: "none",
  color: "var(--accent-info)",
  fontSize: 12,
  lineHeight: "16px",
  cursor: "pointer",
  textDecoration: "none",
};



const formCol = {

  
  display: "flex",
  flexDirection: "column",
  
  gap: 16,
  color: "border-color",
  
  
};

const rowBetween = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  width: "100%",
  gap:8,
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
  display:"inline-flex",
};

const cta = {
  
  display:"flex",
  alignItems:"center",
  justifyContent:"center",

  width: "100%",
  height: 48,
  
  margin: "6dvh auto",
  borderRadius: 12,
  boxShadow: "0px 4px 8px rgba(0,0,0,0.20)",
};

const dividerRow = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 16,
  margin:"2px 0 12px",
};

const hr = {
  flex: "1 1 0",
  height: 0,
  borderTop: "1px solid #E5E5E5",
};

const socialBtn = {
  height: 48,
  borderRadius: 10,
  outline: "1px solid #EFF0F6",
  boxShadow: "inset 0px -3px 6px rgba(244, 246, 250, 0.60)",
  display: "inline-flex",
  justifyContent: "center",
  alignItems: "center",
  gap: 10,
  background: "#fff",
};

const socialText = {
  fontFamily: "Inter, sans-serif",
  fontWeight: 600,
  fontSize: 14,
  lineHeight: "19.6px",
  color: "var(--text-black, #1A1A1A)",
};

const socialIconGoogle = {
  width: 18,
  height: 18,
  display: "inline-block",
  background:
    "conic-gradient(from 90deg at 70% 70%, #4285F4 0 25%, #34A853 0 50%, #FBBC05 0 75%, #EB4335 0 100%)",
  WebkitMask:
    "url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%270 0 48 48%27><path fill=%22%23000%22 d=%27M44.5 20H24v8.5h11.8C34.9 32.9 30.1 36 24 36c-6.6 0-12.2-4.3-14.2-10.2S9 13.6 15 11.1 28.2 11.8 32 16l6-6C33.1 3.9 26-0.1 18.5 0.0 8.6 0 0.2 7.5 0 17.4c-0.2 9.9 7.6 18.1 17.4 18.3 8.8 0.2 16.3-5.8 18-13.8 0.3-1.9 0.4-3.8 0.1-6z%27/></svg>') center / contain no-repeat",
  mask:
    "url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%270 0 48 48%27><path fill=%22%23000%22 d=%27M44.5 20H24v8.5h11.8C34.9 32.9 30.1 36 24 36c-6.6 0-12.2-4.3-14.2-10.2S9 13.6 15 11.1 28.2 11.8 32 16l6-6C33.1 3.9 26-0.1 18.5 0.0 8.6 0 0.2 7.5 0 17.4c-0.2 9.9 7.6 18.1 17.4 18.3 8.8 0.2 16.3-5.8 18-13.8 0.3-1.9 0.4-3.8 0.1-6z%27/></svg>') center / contain no-repeat",
};

const socialIconFacebook = {
  width: 18,
  height: 18,
  display: "inline-block",
  background:
    "linear-gradient(0deg, #0062E0 0%, #19AFFF 100%)",
  WebkitMask:
    "url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%270 0 24 24%27><path fill=%22%23000%22 d=%27M22 12a10 10 0 1 0-11.6 9.9v-7h-2.2V12h2.2V9.8c0-2.2 1.3-3.5 3.4-3.5.98 0 2 .18 2 .18v2.2h-1.1c-1.1 0-1.5.69-1.5 1.4V12h2.6l-.42 2.9h-2.2v7A10 10 0 0 0 22 12z%27/></svg>') center / contain no-repeat",
  mask:
    "url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%270 0 24 24%27><path fill=%22%23000%22 d=%27M22 12a10 10 0 1 0-11.6 9.9v-7h-2.2V12h2.2V9.8c0-2.2 1.3-3.5 3.4-3.5.98 0 2 .18 2 .18v2.2h-1.1c-1.1 0-1.5.69-1.5 1.4V12h2.6l-.42 2.9h-2.2v7A10 10 0 0 0 22 12z%27/></svg>') center / contain no-repeat",
};

const errorBox = {
  background: "#fdecea",
  color: "#b00020",
  border: "1px solid #f5c6cb",
  borderRadius: 8,
  padding: "8px 10px",
  fontSize: 13,
};

const bottomRow = {
  marginTop: 16,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
};
