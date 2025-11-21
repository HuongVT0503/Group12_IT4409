// src/pages/SignUpPage.jsx
import  { useState } from "react";
import Button from "../components/ButtonComponent.jsx";
import InputField from "../components/InputField.jsx";
import logo from "../assets/img/logo/logo.png";

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
    if (Object.values(form).some(v => !v)) return setErr("Fill all fields.");

    if (form.password !== form.confirmPassword) {
      setErr("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ form
          // firstName: form.firstName,
          // lastName: form.lastName,
          // email: form.email,
          // password: form.password,
          // phone: form.phone,
          // dob: form.dob,
          // gender: form.gender,
        }),
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(data?.error || data?.message || "Sign up failed.");

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
    <div className="min-h-dvh w-full flex flex-col items-center p-4 lg:p-12 lg:flex-row lg:justify-center lg:items-center bg-bg-main">
      
      {/* Mobile Header */}
      <div className="mb-6 flex items-center gap-2 lg:hidden">
        <img src={logo} alt="Logo" className="h-10 w-10 object-contain" />
        <span className="font-bold text-2xl text-primary">SocioICT</span>
      </div>

      {/* Desktop Hero */}
      <div className="hidden lg:flex flex-col justify-center max-w-[500px] mr-20 mt-20">
        <div className="flex items-center gap-3 mb-6">
          <img src={logo} alt="Logo" className="h-16 w-16" />
          <span className="font-bold text-5xl text-primary">SocioICT</span>
        </div>
        <h2 className="text-8xl font-extrabold text-black leading-tight mb-4">Create your account</h2>
        <p className="text-3xl text-gray-600 leading-relaxed">Join your classmates and communities in one secure, private space.</p>
      </div>

      <div className="w-full max-w-md lg:max-w-[700px] bg-bg-card rounded-box shadow-xl p-6 lg:p-10">
        {/* Back Button */}
        <button 
          onClick={onBack || onSwitch}
          className="mb-4 flex items-center justify-center w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-primary-light/30 text-primary hover:bg-primary-light/50 text-xl lg:text-4xl pb-1"
        >
          ←
        </button>

        <div className="mb-10">
          <h1 className="text-4xl lg:text-6xl font-bold text-black">Sign Up</h1>
          <div className="mt-4 text-gray-600 text-base lg:text-xl">
            Already have an account? 
            <button onClick={onSwitch} className="ml-1 text-blue-600 font-semibold hover:underline">Log In</button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 lg:gap-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <InputField label="First Name" name="firstName" placeholder="Enter your first name" size = "lg" value={form.firstName} onChange={handleChange} required className="flex-1" />
            <InputField label="Last Name" name="lastName" placeholder="Enter your last name" size = "lg" value={form.lastName} onChange={handleChange} required className="flex-1" />
          </div>

          <InputField label="Email" name="email" type="email" placeholder="Enter your email" size = "lg" value={form.email} onChange={handleChange} required />

          <div className="flex flex-col sm:flex-row gap-4">
             <InputField label="Date of Birth" name="dob" type="date" size = "lg" value={form.dob} onChange={handleChange} required className="flex-1" />
             
             <div className="flex-1 flex flex-col gap-2 mb-3">
                <label className="text-base lg:text-lg font-medium text-gray-700 ml-1">Gender</label>
                <select 
                  name="gender" 
                  value={form.gender} 
                  onChange={handleChange}
                  className="w-full rounded-[var(--radius-btn)] border border-gray-300 bg-white px-6 py-3 lg:py-4.5 text-lg lg:text-xl outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                >
                  <option value="" disabled>Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
             </div>
          </div>

          <InputField label="Phone" name="phone" type="tel" placeholder="Enter your phone number"  size = "lg" value={form.phone} onChange={handleChange} />
          
          <InputField label="Password" name="password" type="password" placeholder="Set your password" size="lg" value={form.password} onChange={handleChange} required />
          <InputField label="Confirm Password" name="confirmPassword" type="password" placeholder="Confirm your password" size="lg" value={form.confirmPassword} onChange={handleChange} required />

          {err && <div className="bg-red-50 text-red-600 border border-red-200 rounded-lg p-3 text-sm">{err}</div>}

          <Button type="submit" size="lg" loading={loading} className="mt-2">Register</Button>
        </form>
      </div>
    </div>
  );
}



//   return (
//     <div style={getRoot(isShort, isWide)}>
//       {!isWide && (
//         <div style={topBar}>
//           <div style={brandRow}>
//             <img src={logo} alt="SocioICT logo" style={brandLogo} />
//             <span style={brandName}>SocioICT</span>
//           </div>
//         </div>
//       )}

//       {isWide && (
//         <div style={heroWrap}>
//           <div style={heroLogoRow}>
//             <img src={logo} alt="SocioICT logo" style={heroLogo} />
//             <span style={heroBrand}>SocioICT</span>
//           </div>
//           <h2 style={heroTitle}>Create your account</h2>
//           <p style={heroSubtitle}>
//             Join your classmates and communities in one secure, private space.
//           </p>
//         </div>
//       )}

//       <div style={getCard(isShort, isNarrow, isWide)}>
//         {/* Back */}
//         <div style={getBackRow(isWide)}>
//           <button
//             type="button"
//             style={getBackBtn(isWide)}
//             onClick={() => {
//               if (typeof onBack === "function") onBack();
//               else if (typeof onSwitch === "function") onSwitch();
//               else if (window.history && window.history.back) window.history.back();
//             }}
//             aria-label="Back"
//           >
//             ←
//           </button>

//         </div>

//         <div style={getCardTopRow(isShort, isWide)}>
          
//           <div style={titleBlock}>
//             <h1 style={getHeaderTitle(isShort, isWide)}>Sign up</h1>
//             <div style={subRow}>
//               <span style={getSubText(isWide)}>Already have an account? </span>
//               <button
//                 type="button"
//                 onClick={onSwitch}
//                 style={getLinkInline(isWide)}
//               >
//                 Log In
//               </button>
//             </div>
//           </div>
//         </div>

        
//         <form
//           onSubmit={handleSubmit}
//           style={getFormCol(isShort, isWide)}
//         >
          
//           <div style={getNameRow(isNarrow)}>
//             <InputField
//               label="First Name"
//               name="firstName"
//               value={form.firstName}
//               placeholder="Enter your first name"
//               onChange={handleChange}
//               required
//               size={isWide ? "xl" : "md"}
//               style={nameField}
//             />
//             <InputField
//               label="Last Name"
//               name="lastName"
//               value={form.lastName}
//               placeholder="Enter your last name"
//               onChange={handleChange}
//               required
//               size={isWide ? "xl" : "md"}
//               style={nameField}
//             />
//           </div>

//           <InputField
//             label="Email"
//             name="email"
//             type="email"
//             value={form.email}
//             placeholder="Enter your email"
//             onChange={handleChange}
//             required
//             size={isWide ? "xl" : "md"}
//             autoComplete="email"
//             inputMode="email"
//           />

//           <InputField
//             label="Date of Birth"
//             name="dob"
//             type="date"
//             value={form.dob}
//             //placeholder="18/03/2024"
//             onChange={handleChange}
//             required
//             size={isWide ? "xl" : "md"}
//           />
//           <div style={getNameRow(isNarrow)}>
//             <div style={customInputWrapper}>
//               <label style={customLabel}>Gender</label>
//               <select
//                 name="gender"
//                 value={form.gender}
//                 onChange={handleChange}
//                 required
//                 style={getSelectStyle(isWide)}
//               >
//                 <option value="" disabled>
//                   Select
//                 </option>
//                 <option value="male">Male</option>
//                 <option value="female">Female</option>
//                 <option value="other">Other</option>
//                 <option value="prefer_not_to_say">Prefer not to say</option>
//               </select>
//             </div>
//           </div>

//           <InputField
//             label="Phone Number"
//             name="phone"
//             type="tel"
//             value={form.phone}
//             placeholder="Enter your phone number"
//             onChange={handleChange}
//             size={isWide ? "xl" : "md"}
//             inputMode="tel"
//           />

//           <InputField
//             label="Set Password"
//             name="password"
//             type="password"
//             value={form.password}
//             placeholder="Enter your password"
//             onChange={handleChange}
//             required
//             size={isWide ? "xl" : "md"}
//           />

//           <InputField
//             label="Confirm Password"
//             name="confirmPassword"
//             type="password"
//             value={form.confirmPassword}
//             placeholder="Confirm your password"
//             onChange={handleChange}
//             required
//             size={isWide ? "xl" : "md"}
//           />

//           {err && <div style={errorBox}>{err}</div>}

//           <Button
//             variant="primary"
//             size="lg"
//             loading={loading}
//             className="w-100"
//             style={getCta(isShort, isNarrow, isWide)}
//             type="submit"
//           >
//             Register
//           </Button>
//         </form>
//       </div>
//     </div>
//   );
// }

// /* ===== Layout & style tokens ===== */

// const baseroot = {
//   width: "100%",
//   minHeight: "100dvh",
//   margin: "0 auto",
//   padding: "24px 16px 16px",
//   boxSizing: "border-box",
//   display: "flex",
//   flexDirection: "column",
//   alignItems: "center",
//   position: "relative",
//   background: "var(--primary-background)",
// };

// const getRoot = (isShort, isWide) => {
//   if (isWide) {
//     return {
//       ...baseroot,
//       minHeight: "100dvh",
//       padding: "72px 24px 24px 72px",
//       flexDirection: "row",
//       alignItems: "center",
//       justifyContent: "space-between",
//       margin: "0 auto",
//     };
//   }
//   return {
//     ...baseroot,
//     justifyContent: isShort ? "flex-start" : "center",
//   };
// };

// const topBar = {
//   width: "100%",
//   display: "flex",
//   justifyContent: "center",
//   alignItems: "flex-start",
//   marginBottom: 16,
// };

// const brandRow = {
//   display: "inline-flex",
//   alignItems: "center",
//   gap: 8,
// };

// const brandLogo = {
//   width: "clamp(24px, 5vw, 50px)",
//   height: "clamp(24px, 5vw, 50px)",
//   objectFit: "contain",
// };

// const brandName = {
//   fontFamily: "Inter, sans-serif",
//   fontWeight: 700,
//   fontSize: "clamp(20px, 4vw, 29px)",
//   lineHeight: 1.25,
//   color: "var(--primary-purple-500)",
// };

// const heroWrap = {
//   flex: "0 0 clamp(360px, 34vw, 560px)",
//   maxWidth: "clamp(360px, 34vw, 560px)",
//   display: "flex",
//   //minHeight: "100dvh",
//   flexDirection: "column",
//   justifyContent: "center",
//   alignItems: "flex-start",
//   gap: 20,
//   marginRight: 30,
// };

// const heroLogoRow = {
//   display: "flex",
//   alignItems: "center",
//   gap: 12,
// };

// const heroLogo = {
//   width: 60,
//   height: 60,
//   objectFit: "contain",
// };

// const heroBrand = {
//   fontFamily: "Inter, sans-serif",
//   fontWeight: 700,
//   fontSize: 48,
//   color: "var(--primary-purple-500)",
// };

// const heroTitle = {
//   margin: 0,
//   fontFamily: "Inter, sans-serif",
//   fontWeight: 800,
//   fontSize: 60,
//   color: "var(--text-black)",
//   lineHeight: 1,
// };

// const heroSubtitle = {
//   margin: 0,
//   fontFamily: "Inter, sans-serif",
//   fontSize: 22,
//   lineHeight: 1.8,
//   color: "var(--text-gray)",
// };

// const baseCard = {
//   width: "100%",
//   padding: "clamp(18px, 4vw, 24px)",
//   position: "relative",
//   boxSizing: "border-box",
//   margin: "8px auto 12px",
//   background: "var(--neutral-100)",
//   borderRadius: 14,
//   display: "flex",
//   flexDirection: "column",
//   alignItems: "stretch",
// };

// const getCard = (isShort, isNarrow, isWide) => {
//   if (isWide) {
//     return {
//       ...baseCard,
//       maxWidth: "min(960px, calc(100vw - 56px - 32px))",
//       width: "clamp(640px, 46vw, 960px)",
//       margin: 0,
//       marginLeft: "auto",
//       //position: "sticky",
//       //top: 24,
//       borderRadius: 20,
//       flex: "0 0 auto",
//       alignSelf: "flex-start",
//       marginTop: 24,
//       marginRight: 24,
//       boxShadow: "0 18px 40px rgba(15,15,30,0.12)",
//       //overflowY: "auto",  //scroll inside card


//        //maxHeight: "calc(100dvh - 80px)", // keep inside viewport
//     };
//   }
//   return {
//     ...baseCard,
//     maxWidth: "100%",
//     marginTop: isShort ? 4 : 8,
//     marginBottom: isShort ? 8 : 12,
//     boxShadow: isNarrow
//       ? "0px 8px 24px rgba(0,0,0,0.04)"
//       : "0px 10px 30px rgba(15,15,30,0.08)",
//   };
// };


// const getBackRow = (isWide) => ({
//   width: "100%",
//   display: "flex",
//   alignItems: "center",
//   justifyContent: "flex-start",
//   marginBottom: isWide ? 24 : 12,      
// });

// const getCardTopRow = (isShort, isWide) => ({
//   display: "flex",
//   flexDirection: "column",
//   alignItems: "flex-start",
//   gap: isWide ? 8 : 4,
//   marginBottom: isWide ? 24 : isShort ? 12 : 16,
// });


// const getBackBtn =(isWide) =>( {
//   width: isWide ? 35 : "clamp(25px, 5vw, 35px)" ,
//   height: isWide ? 30 : "clamp(20px, 5vw, 30px)",
//   borderRadius: 999,
//   border: "1px solid var(--neutral-300)",
//   background: "var(--primary-purple-400)",
//   color: "var(--neutral-100)",
//   display: "flex",
//   alignItems: "center",
//   justifyContent: "center",
//   cursor: "pointer",
//   fontSize: isWide ? 45 : "clamp(17px, 3.2vw, 22px)",
// });

// const titleBlock = {
//   flex: 1,
//   display: "flex",
//   flexDirection: "column",
//   gap: 4,
// };

// const getHeaderTitle = (isShort, isWide) => ({
//   margin: 0,
//   fontFamily: "Inter, sans-serif",
//   fontWeight: 700,
//   fontSize: isWide
//     ? 44
//     : isShort
//     ? "clamp(22px, 5vw, 26px)"
//     : "clamp(24px, 4vw, 28px)",
//   lineHeight: 1.3,
// });

// const subRow = {
//   display: "flex",
//   flexWrap: "wrap",
//   alignItems: "center",
//   gap: 4,
// };

// const getSubText =(isWide) => ( {
//   fontFamily: "Inter, sans-serif",
//   fontSize: isWide ? 25 : "clamp(17px, 3.2vw, 22px)",
//   lineHeight: 1.6,
//   color: "var(--text-gray)",
// });

// const getLinkInline =(isWide) => (   {
//   padding: 0,
//   background: "none",
//   border: "none",
//   color: "var(--accent-info)",
//   fontSize: isWide ? 25 : "clamp(17px, 3.2vw, 22px)",
//   fontWeight: 600,
//   cursor: "pointer",
// });

// const getFormCol = (isShort, isWide) => ({
//   display: "flex",
//   flexDirection: "column",
//   gap: isWide ? 18 : isShort ? 10 : 14,
//   marginTop: isWide ? 8 : 0,
// });

// const getNameRow = (isNarrow) => ({
//   display: "flex",
//   flexDirection: isNarrow ? "column" : "row",
//   gap: 8,
//   width: "100%",
// });

// const nameField = {
//   flex: 1,
// };

// const customInputWrapper = {
//   flex: 1,
//   display: "flex",
//   flexDirection: "column",
//   gap: 6, // Gap between label and input
// };

// const customLabel = {
//   fontSize: 14,
//   fontWeight: 600,
//   color: "var(--text-black)",
//   fontFamily: "Inter, sans-serif",
//   marginLeft: 2,
// };


// const getSelectStyle = (isWide) => ({
//   width: "100%",
//   padding: isWide ? "14px 16px" : "12px 14px",
//   borderRadius: 10,
//   border: "1px solid var(--neutral-300)",
//   background: "var(--primary-background)",
//   color: "var(--text-black)",
//   fontSize: isWide ? 16 : 14,
//   fontFamily: "Inter, sans-serif",
//   cursor: "pointer",
//   outline: "none",
//   appearance: "none", //removes default arrow, you might want to add a background-image arrow here if strictly needed
// });

// const getCta = (isShort, isNarrow, isWide) => ({
//   display: "flex",
//   alignItems: "center",
//   justifyContent: "center",
//   width: "100%",
//   height: isWide ? 56 : "clamp(46px, 6.2vh, 54px)",
//   margin:
//     isShort || isNarrow || isWide
//       ? "clamp(18px, 4vh, 24px) auto 4px"
//       : "clamp(24px, 6vh, 36px) auto 4px",
//   borderRadius: 14,
//   boxShadow: "0px 4px 8px rgba(0,0,0,0.20)",
// });

// const errorBox = {
//   background: "var(--neutral-200)",
//   color: "var(--accent-danger)",
//   border: "1px solid var(--accent-danger-100)",
//   borderRadius: 8,
//   padding: "8px 10px",
//   fontSize: 13,
//   marginTop: 4,
// };
