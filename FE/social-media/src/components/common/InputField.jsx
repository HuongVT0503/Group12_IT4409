//import React from "react";
import {cn} from "../../utils/cn";
import {useState} from "react";
//import eyeOffIcon from "../assets/img/icons/eye-off.svg";
// import eyeOpen from "../../assets/img/icons/eye-open.svg";
// import eyeClose from "../../assets/img/icons/eye-close.svg";

import { Eye, EyeOff } from "lucide-react";

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

  //const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === "password";

  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

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

      <div className="relative">

      <input
        id={name}
        name={name}
        type={inputType}
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
      {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            <img src={showPassword ? Eye : EyeOff} alt={showPassword ? "Hide password" : "Show password"} 
            className="w-6 h-6 opacity-60 hover:opacity-100 transition-opacity"/>
            

          </button>
        )}
      {error && <span className="text-xs text-red-500 ml-1">{error}</span>}
    </div>
    </div>
  );
}
