import React, { forwardRef } from "react";
import "./buttons.css";

const cx = (...cls) => cls.filter(Boolean).join(" ");

const Button = forwardRef(
  (
    {
      as: Comp = "button",
      variant = "primary",         // 'primary' | 'outline' | 'ghost'
      size = "md",                // 'sm' | 'md' | 'lg'
      loading = false,
      disabled,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const classes = cx(
      "btn",
      `btn--${variant}`,
      size && `btn--${size}`,
      className
    );

    const isDisabled = disabled || loading;

    return (
      <Comp
        ref={ref}
        className={classes}
        disabled={Comp === "button" ? isDisabled : undefined}
        aria-busy={loading ? "true" : "false"}
        {...props}
      >
        {loading && <span className="btn__spinner" aria-hidden="true" />}
        {children}
      </Comp>
    );
  }
);

Button.displayName = "Button";
export default Button;
