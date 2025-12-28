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
        <label
          htmlFor={name}
          className="text-sm font-semibold"
          style={{ color: "var(--input-label)" }}
        >
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
            "w-full font-medium rounded-lg border px-4 py-3 text-base placeholder:text-[var(--input-placeholder)] outline-none transition-colors resize-none",
            "focus:border-[var(--input-focus-border)] focus:ring-2",
            "disabled:cursor-not-allowed",
            error
              ? "focus:ring-[var(--input-error-ring)]"
              : "focus:ring-[var(--input-focus-ring)]"
          )}
          {...props}
        />
      </div>

      {/* Counter and helper text */}
      <div className="flex items-center justify-between gap-2">
        <span
          style={{
            color: error ? "var(--input-error-border)" : "var(--input-helper)",
          }}
          className="text-xs font-medium"
        >
          {error || helperText}
        </span>
        {showCounter && maxLength && (
          <span
            className="text-xs font-medium"
            style={{ color: "var(--input-counter)" }}
          >
            {currentLength}/{maxLength}
          </span>
        )}
      </div>
    </div>
  );
}
