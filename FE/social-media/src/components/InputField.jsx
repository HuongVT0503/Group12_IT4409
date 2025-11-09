import React from "react";

export default function InputField({
  label,
  name,
  type = "text",
  value,
  placeholder,
  onChange,
  required = false,
  style,
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, ...style }}>
      {label && (
        <label
          htmlFor={name}
          style={{
            color: "var(--Text---Gray, #5A5A5A)",
            fontSize: 14,
            fontFamily: "Inter, sans-serif",
            fontWeight: 400,
            lineHeight: "16px",
            textAlign: "left",
          }}
        >
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
        style={{
          height: 40,
          borderRadius: 8,
          border: "1px solid #D1D1D1",
          padding: "0 12px",
          fontSize: 14,
          fontFamily: "Inter, sans-serif",
          color: "#222",
          outline: "none",
          transition: "border-color 0.2s ease",
        }}
        onFocus={(e) => (e.target.style.borderColor = "#7A3E9D")}
        onBlur={(e) => (e.target.style.borderColor = "#D1D1D1")}
      />
    </div>
  );
}
