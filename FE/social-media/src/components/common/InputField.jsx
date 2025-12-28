//import React from "react";
import { cn } from "../../utils/cn";
import { useState } from "react";
import { Eye, EyeOff, X } from "lucide-react";

export default function InputField({
  label,
  name,
  type = "text",
  fullWidth = true,
  size = "md",
  className,
  error,
  helperText,
  icon: Icon,
  clearable = false,
  disabled = false,
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  const inputRef = useState(null)[1];

  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  const sizes = {
    sm: "h-10 px-3 text-sm",
    md: "h-11 px-4 text-base",
    lg: "h-13 px-5 text-base",
  };

  const handleClear = () => {
    if (props.onChange) {
      props.onChange({ target: { name, value: "" } });
    }
  };

  const showClearButton = clearable && props.value && props.value.length > 0;

  return (
    <div
      className={cn("flex flex-col gap-2", fullWidth && "w-full", className)}
    >
      {label && (
        <label
          htmlFor={name}
          className="text-sm font-semibold"
          style={{ color: "var(--input-label)" }}
        >
          {label}
        </label>
      )}

      <div className="relative">
        {/* Icon bên trái */}
        {Icon && (
          <div
            className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none flex items-center"
            style={{ color: "var(--input-icon)" }}
          >
            <Icon size={20} />
          </div>
        )}

        <input
          ref={inputRef}
          id={name}
          name={name}
          type={inputType}
          disabled={disabled}
          style={{
            backgroundColor: disabled
              ? "var(--input-disabled-bg)"
              : "var(--input-bg)",
            borderColor: error
              ? "var(--input-error-border)"
              : "var(--input-border)",
            color: disabled
              ? "var(--input-disabled-text)"
              : "var(--input-text)",
          }}
          className={cn(
            "w-full font-medium rounded-lg border outline-none transition-colors placeholder:text-[var(--input-placeholder)]",
            "focus:border-[var(--input-focus-border)] focus:ring-2",
            "disabled:cursor-not-allowed",
            error && "focus:ring-[var(--input-error-ring)]",
            !error && "focus:ring-[var(--input-focus-ring)]",
            sizes[size],
            Icon && "pl-11",
            (isPassword || showClearButton) && "pr-11"
          )}
          {...props}
        />

        {/* Password toggle button */}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{ color: "var(--input-icon)" }}
            className="absolute right-4 top-1/2 -translate-y-1/2 hover:[color:var(--input-icon-hover)] transition-colors focus:outline-none"
            tabIndex={-1}
          >
            {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
          </button>
        )}

        {/* Clear button */}
        {showClearButton && !isPassword && (
          <button
            type="button"
            onClick={handleClear}
            style={{ color: "var(--input-icon)" }}
            className="absolute right-4 top-1/2 -translate-y-1/2 hover:[color:var(--input-icon-hover)] transition-colors focus:outline-none"
            tabIndex={-1}
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Error and helper text */}
      {(error || helperText) && (
        <span
          style={{
            color: error ? "var(--input-error-border)" : "var(--input-helper)",
          }}
          className="text-xs font-medium"
        >
          {error || helperText}
        </span>
      )}
    </div>
  );
}
