import React from "react";

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: "default" | "filled" | "outlined";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  isRTL?: boolean;
  // Theme customization
  theme?: {
    input?: string;
    label?: string;
    error?: string;
    helper?: string;
    focus?: string;
    disabled?: string;
  };
}

const defaultTheme = {
  input: "border-gray-300 focus:border-blue-500 focus:ring-blue-500",
  label: "text-gray-700",
  error: "text-red-600",
  helper: "text-gray-500",
  focus: "focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50",
  disabled: "bg-gray-100 text-gray-500 cursor-not-allowed",
};

const sizeClasses = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-3 py-2 text-base",
  lg: "px-4 py-3 text-lg",
};

const variantClasses = {
  default: "bg-white border rounded-md",
  filled: "bg-gray-50 border border-gray-300 rounded-md",
  outlined: "bg-transparent border-2 border-gray-300 rounded-md",
};

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  variant = "default",
  size = "md",
  fullWidth = false,
  className = "",
  disabled,
  theme = defaultTheme,
  ...props
}) => {
  const inputClasses = [
    variantClasses[variant],
    sizeClasses[size],
    theme.input,
    theme.focus,
    disabled ? theme.disabled : "",
    error ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "",
    fullWidth ? "w-full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={fullWidth ? "w-full" : ""}>
      {label && (
        <label className={`block text-sm font-medium ${theme.label} mb-1`}>
          {label}
        </label>
      )}

      <div className="flex items-center gap-2 ">
        {leftIcon && (
          <div className="flex items-center">
            <span className="text-gray-400">{leftIcon}</span>
          </div>
        )}

        <input className={inputClasses} disabled={disabled} {...props} />

        {rightIcon && (
          <div className="flex items-center">
            <span className="text-gray-400">{rightIcon}</span>
          </div>
        )}
      </div>

      {error && <p className={`mt-1 text-sm ${theme.error}`}>{error}</p>}

      {helperText && !error && (
        <p className={`mt-1 text-sm ${theme.helper}`}>{helperText}</p>
      )}
    </div>
  );
};
