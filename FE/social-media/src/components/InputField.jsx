import React from "react";

export default function InputField({
  label,
  name,
  type = "text",
  value,
  placeholder,
  onChange,
  required = false,
  disabled = false,
  fullWidth = true,
  size = "md",
  inputStyle,
  labelStyle,
  style,
  autoComplete, //allow passing proper autocomplete hints
  inputMode, //like "email", "numeric"
}) {
  //subtle multiplier
  const sizeMul = size === "xl" ? 1.25 : size === "lg" ? 1.12 : size === "sm" ? 0.93 : 1;
  const wrapStyle = {
    display: "flex",
    flexDirection: "column",
    gap: 6 * sizeMul, //small, responsive spacing
    width: fullWidth ? "100%" : "auto",
    ...style,
  };

  const labelBase = {
    color: "var(--Text---Gray, var(--text-gray))",

    fontSize: `calc(${sizeMul} * clamp(13px, 1.2vw, 18px))`,
    fontFamily: "Inter, sans-serif",
    fontWeight: 500,
    lineHeight: 1.35,
    textAlign: "left",
  };

  const inputBase = {
    height: `calc(${sizeMul} * clamp(44px, 5.2vh, 60px))`,
    borderRadius: `calc(${sizeMul} * clamp(8px, 1vw, 12px))`,
    border: "1px solid var(--neutral-300)",
    padding: `0 calc(${sizeMul} * clamp(12px, 1.4vw, 18px))`,

    fontSize: `calc(${sizeMul} * clamp(16px, 1.1vw, 20px))`,
    fontFamily: "Inter, sans-serif",
    color: "var(--text-black)",
    outline: "none",
    transition: "border-color 0.18s ease, box-shadow 0.18s ease",
    width: "100%", //fill the container, control container width outside
    background: disabled ? "var(--neutral-100)" : "white",
  };

  const handleFocus = (e) => {
    e.target.style.borderColor = "var(--primary-purple-500)";
    e.target.style.boxShadow = "0 0 0 3px rgba(122,62,157,0.12)";
  };
  const handleBlur = (e) => {
    e.target.style.borderColor = "var(--text-gray)";
    e.target.style.boxShadow = "none";
  };

  return (
    <div style={wrapStyle}>
      {label && (
        <label htmlFor={name} style={{ ...labelBase, ...labelStyle }}>
          {label}
        </label>
      )}

      <input
        id={name}
        name={name}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        required={required}
        disabled={disabled}
        autoComplete={autoComplete}
        inputMode={inputMode}
        style={{ ...inputBase, ...inputStyle }}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
    </div>
  );
}
