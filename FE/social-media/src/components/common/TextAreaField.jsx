import { cn } from "../../utils/cn";

export default function TextAreaField({
  label,
  name,
  fullWidth = true,
  rows = 4,
  maxLength,
  className,
  error,
  helperText,
  showCounter = false,
  disabled = false,
  ...props
}) {
  const currentLength = props.value?.length || 0;

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
        <textarea
          id={name}
          name={name}
          rows={rows}
          maxLength={maxLength}
          disabled={disabled}
          className={cn(
            "w-full font-medium rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 outline-none transition-colors resize-none",
            "focus:border-primary focus:ring-2 focus:ring-gray-500",
            "disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500/20"
          )}
          {...props}
        />
      </div>

      {/* Counter and helper text */}
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            "text-xs font-medium",
            error ? "text-red-500" : "text-gray-500"
          )}
        >
          {error || helperText}
        </span>
        {showCounter && maxLength && (
          <span className="text-xs font-medium text-gray-400">
            {currentLength}/{maxLength}
          </span>
        )}
      </div>
    </div>
  );
}
