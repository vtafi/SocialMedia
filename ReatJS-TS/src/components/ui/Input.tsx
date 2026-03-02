import React, { forwardRef, useState } from "react";
import type { InputHTMLAttributes } from "react";
import "./Input.css";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconClick?: () => void;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      onRightIconClick,
      className = "",
      type = "text",
      ...props
    },
    ref,
  ) => {
    const [isFocused, setIsFocused] = useState(false);

    const containerClasses = [
      "input-container",
      isFocused && "input-container-focused",
      error && "input-container-error",
      props.disabled && "input-container-disabled",
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div className="input-wrapper">
        {label && (
          <label className="input-label">
            {label}
            {props.required && <span className="input-required">*</span>}
          </label>
        )}

        <div className={containerClasses}>
          {leftIcon && (
            <span className="input-icon input-icon-left">{leftIcon}</span>
          )}

          <input
            ref={ref}
            type={type}
            className={`input ${className}`}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          />

          {rightIcon && (
            <span
              className={`input-icon input-icon-right ${onRightIconClick ? "input-icon-clickable" : ""}`}
              onClick={onRightIconClick}
            >
              {rightIcon}
            </span>
          )}
        </div>

        {error && <p className="input-error-text">{error}</p>}
        {helperText && !error && (
          <p className="input-helper-text">{helperText}</p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

export default Input;
