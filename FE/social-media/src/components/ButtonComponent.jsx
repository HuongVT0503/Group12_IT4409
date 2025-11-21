import { forwardRef } from "react";
import { cn } from "../utils/cn";

// const injectButtonStyles = () => {
//   if (typeof document === "undefined") return;
//   if (document.getElementById("btn-styles")) return; // avoid duplicates

//   const style = document.createElement("style");
//   style.id = "btn-styles";
//   style.textContent = `
//     .btn {
//       position: relative;
//       display: inline-flex;
//       align-items: center;
//       justify-content: center;

//       height: 48px;
//       padding: 0 20px;
//       border-radius: var(--radius);
//       font-size: clamp(15px, 1.15vw, 18px);
//       font-weight: 500;
//       line-height: 1.1;
//       border: 1px solid transparent;
//       cursor: pointer;

//       transition: transform .02s ease, box-shadow .2s ease, opacity .2s ease;

//       -webkit-user-select: none; /* safari */
//       user-select: none;
//     }

//     .btn:active {
//       transform: translateY(1px);
//     }

//     /* sizes */
//     .btn--sm {
//       height: clamp(36px, 4.2vh, 40px);
//       padding: 0 clamp(14px, 1.4vw, 16px);
//     }
//     .btn--md {
//       height: clamp(44px, 5.0vh, 52px);
//       padding: 0 clamp(18px, 1.8vw, 22px);
//     }
//     .btn--lg {
//       height: clamp(52px, 5.6vh, 64px);
//       padding: 0 clamp(22px, 2.2vw, 28px);
//     }

//     /* variants */
//     .btn--primary {
//       background: var(--gradient-primary);
//       color: var(--neutral-100);
//       box-shadow: var(--shadow-md);
//     }

//     .btn--outline {
//       background: var(--neutral-100);
//       color: var(--primary-purple-500);
//       border-color: var(--primary-purple-500);
//     }

//     .btn--ghost {
//       background: transparent;
//       color: var(--primary-purple-500);
//     }

//     /* disabled / loading */
//     .btn[disabled],
//     .btn[aria-busy="true"] {
//       opacity: .65;
//       cursor: not-allowed;
//     }

//     .btn__spinner {
//       display: inline-block;
//       width: 1em;
//       height: 1em;
//       border: 2px solid currentColor;
//       border-right-color: transparent;
//       border-radius: 50%;
//       margin-right: 8px;
//       animation: btn-spin .7s linear infinite;
//     }

//     @keyframes btn-spin {
//       to { transform: rotate(360deg); }
//     }

//     @media (min-width: 1024px) {
//       .btn { font-size: 20px; }
//       .btn--lg { font-size: 22px; }
//     }

//     @media (min-width: 1440px) {
//       .btn { font-size: 22px; }
//       .btn--lg { font-size: 24px; }
//     }
//   `;
//   document.head.appendChild(style);
// };

// const cx = (...cls) => cls.filter(Boolean).join(" ");

const Button = forwardRef(
  (
    {
      as: Comp = "button",
      variant = "primary", // 'primary' | 'outline' | 'ghost'
      size = "md", // 'sm' | 'md' | 'lg'
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
      "relative inline-flex items-center justify-center font-medium transition-all active:translate-y-[1px] disabled:opacity-65 disabled:cursor-not-allowed rounded-[var(--radius-btn)]";

    const variants = {
      primary:
        "bg-gradient-primary text-white shadow-md hover:brightness-110 border border-transparent",
      outline: "bg-white text-primary border border-primary hover:bg-gray-50",
      ghost: "bg-transparent text-primary hover:bg-primary/10",
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
