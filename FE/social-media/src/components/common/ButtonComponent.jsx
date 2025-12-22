import { forwardRef } from "react";
import { cn } from "../../utils/cn";

// const injectButtonStyles = () => {
//   if (typeof document === "undefined") return;
//   if (document.getElementById("btn-styles")) return; // avoid duplicates

const Button = forwardRef(
  (
    {
      as: Comp = "button",
      variant = "primary", // 'primary' | 'outline' | 'ghost'
      size = "", // 'sm' | 'md' | 'lg'
      loading = false,
      //disabled,
      className,
      children,
      ...props
    },
    ref
  ) => {
    // useEffect(() => {
    //   injectButtonStyles();
    // }, []);

    const base =
      "relative inline-flex items-center justify-center font-medium transition-all active:translate-y-[1px] disabled:opacity-65 disabled:cursor-not-allowed rounded-[var(--radius-btn)] cursor-pointer";

    const variants = {
      primary:
        "bg-gradient-primary text-white shadow-sm hover:brightness-110 border border-neutral-300",
      outline:
        "bg-white text-primary border border-neutral-300 hover:bg-gray-50",
      ghost: "bg-neutral-300 text-primary hover:bg-neutral-400",
    };

    const sizes = {
      sm: "h-10 px-4 text-sm font-medium",
      md: "h-12 px-6 text-base lg:text-lg lg:h-14",
      lg: "h-14 lg:h-16 px-8 text-xl lg:text-2xl w-full",
    };

    // const classes = cx(
    //   "btn",
    //   `btn--${variant}`,
    //   size && `btn--${size}`,
    //   className
    // );

    //const isDisabled = disabled || loading;

    return (
      <Comp
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        disabled={loading || props.disabled}
        aria-busy={loading}
        {...props}
      >
        {loading && (
          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
        )}
        {children}
      </Comp>
    );
  }
);

Button.displayName = "Button";
export default Button;
