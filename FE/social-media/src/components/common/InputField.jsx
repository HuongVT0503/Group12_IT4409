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
        <label htmlFor={name} className="text-sm font-semibold text-gray-700">
          {label}
        </label>
      )}

      <div className="relative">
        {/* Icon bên trái */}
        {Icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none flex items-center">
            <Icon size={20} />
          </div>
        )}

        <input
          ref={inputRef}
          id={name}
          name={name}
          type={inputType}
          disabled={disabled}
          className={cn(
            "w-full font-medium rounded-lg border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 outline-none transition-colors",
            "focus:border-primary focus:ring-2 focus:ring-gray-500",
            "disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed",
            error &&
              "border-red-500 focus:border-red-500 focus:ring-red-500/20",
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
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors focus:outline-none"
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
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
            tabIndex={-1}
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Error and helper text */}
      {(error || helperText) && (
        <span
          className={cn(
            "text-xs font-medium",
            error ? "text-red-500" : "text-gray-500"
          )}
        >
          {error || helperText}
        </span>
      )}
    </div>
  );
}
