//import React from "react";
import {cn} from "../utils/cn";

export default function InputField({
  label,
  name,
  type = "text",
  //value,
  //placeholder,
  // onChange,
  // required = false,
  // disabled = false,
  fullWidth = true,
  size = "md",
  // inputStyle,
  // labelStyle,
  // style,
  // autoComplete, //allow passing proper autocomplete hints
  // inputMode, //like "email", "numeric"
  className,
  error,
  ...props
}) {
  //subtle multiplier
  // const sizeMul = size === "xl" ? 1.25 : size === "lg" ? 1.12 : size === "sm" ? 0.93 : 1;
  // const wrapStyle = {
  //   display: "flex",
  //   flexDirection: "column",
  //   gap: 6 * sizeMul, //small, responsive spacing
  //   width: fullWidth ? "100%" : "auto",
  //   ...style,
  // };

  // const labelBase = {
  //   color: "var(--Text---Gray, var(--text-gray))",

  //   fontSize: `calc(${sizeMul} * clamp(13px, 1.2vw, 18px))`,
  //   fontFamily: "Inter, sans-serif",
  //   fontWeight: 500,
  //   lineHeight: 1.35,
  //   textAlign: "left",
  // };

  // const inputBase = {
  //   height: `calc(${sizeMul} * clamp(44px, 5.2vh, 60px))`,
  //   borderRadius: `calc(${sizeMul} * clamp(8px, 1vw, 12px))`,
  //   border: "1px solid var(--neutral-300)",
  //   padding: `0 calc(${sizeMul} * clamp(12px, 1.4vw, 18px))`,

  //   fontSize: `calc(${sizeMul} * clamp(16px, 1.1vw, 20px))`,
  //   fontFamily: "Inter, sans-serif",
  //   color: "var(--text-black)",
  //   outline: "none",
  //   transition: "border-color 0.18s ease, box-shadow 0.18s ease",
  //   width: "100%", //fill the container, control container width outside
  //   background: disabled ? "var(--neutral-100)" : "white",
  // };

  // const handleFocus = (e) => {
  //   e.target.style.borderColor = "var(--primary-purple-500)";
  //   e.target.style.boxShadow = "0 0 0 3px rgba(122,62,157,0.12)";
  // };
  // const handleBlur = (e) => {
  //   e.target.style.borderColor = "var(--text-gray)";
  //   e.target.style.boxShadow = "none";
  // };


  // const sizes = {
  //   sm: "h-10 px-3 text-sm",
  //   md: "h-12 px-4 text-base lg:text-lg lg:h-14",
  //   lg: "h-14 px-5 text-xl lg:text-2xl lg:h-16",
  // };
  const sizes = {
      sm: "h-10 px-4 text-sm font-medium",
      md: "h-12 px-6 text-base lg:text-lg lg:h-14",
      lg: "h-14 lg:h-16 px-8 text-lg lg:text-xl w-full",
    };
 

  return (
    <div className={cn("flex flex-col gap-1.5", fullWidth ? "w-full" : "w-auto", className)}>
      {label && (
        <label htmlFor={name} className="text-base lg:text-lg font-medium text-gray-600 ml-1">
          {label}
        </label>
      )}

      <input
        id={name}
        name={name}
        type={type}
        // value={value}
        // placeholder={placeholder}
        // onChange={onChange}
        // required={required}
        // disabled={disabled}
        // autoComplete={autoComplete}
        // inputMode={inputMode}
        // style={{ ...inputBase, ...inputStyle }}
        // onFocus={handleFocus}
        // onBlur={handleBlur}
        className={cn(
          "w-full font-medium rounded-[var(--radius-btn)] border border-gray-300 bg-white  text-base text-black placeholder:text-gray-400 outline-none transition-all",
          "focus:border-primary focus:ring-4 focus:ring-primary/10",
          
          "disabled:bg-gray-100 disabled:cursor-not-allowed",
          // "px-5 py-3 lg:py-5",
          // "text-lg lg:text-2xl",
          // size === 'xl' && "lg:py-6 lg:text-2xl"
          sizes[size]
        )}
        {...props}

      />
      {error && <span className="text-xs text-red-500 ml-1">{error}</span>}
    </div>
  );
}
