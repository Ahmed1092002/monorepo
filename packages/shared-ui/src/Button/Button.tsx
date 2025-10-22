import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "success" | "warning";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  // Theme customization
  theme?: {
    primary?: string;
    secondary?: string;
    danger?: string;
    ghost?: string;
    success?: string;
    warning?: string;
    disabled?: string;
  };
}

const defaultTheme = {
  primary: "bg-blue-600 hover:bg-blue-700 text-white border-blue-600",
  secondary: "bg-gray-200 hover:bg-gray-300 text-gray-900 border-gray-200",
  danger: "bg-red-600 hover:bg-red-700 text-white border-red-600",
  ghost: "bg-transparent hover:bg-gray-100 text-gray-700 border-gray-300",
  success: "bg-green-600 hover:bg-green-700 text-white border-green-600",
  warning: "bg-yellow-600 hover:bg-yellow-700 text-white border-yellow-600",
  disabled: "bg-gray-300 text-gray-500 border-gray-300 cursor-not-allowed",
};

const sizeClasses = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-base",
  lg: "px-6 py-3 text-lg",
};

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  loadingText,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  className = "",
  theme = defaultTheme,
  ...props
}) => {
  const isDisabled = disabled || isLoading;
  
  const baseClasses = [
    "inline-flex items-center justify-center",
    "font-medium rounded-md",
    "border transition-colors",
    "focus:outline-none focus:ring-2 focus:ring-offset-2",
    "disabled:cursor-not-allowed",
    sizeClasses[size],
    fullWidth ? "w-full" : "",
  ].join(" ");

  const variantClasses = isDisabled ? theme.disabled : theme[variant];
  
  const focusClasses = {
    primary: "focus:ring-blue-500",
    secondary: "focus:ring-gray-500",
    danger: "focus:ring-red-500",
    ghost: "focus:ring-gray-500",
    success: "focus:ring-green-500",
    warning: "focus:ring-yellow-500",
  };

  const buttonClasses = [
    baseClasses,
    variantClasses,
    focusClasses[variant],
    className,
  ].filter(Boolean).join(" ");

  return (
    <button
      className={buttonClasses}
      disabled={isDisabled}
      {...props}
    >
      {isLoading ? (
        <>
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          {loadingText || "Loading..."}
        </>
      ) : (
        <>
          {leftIcon && <span className="mr-2">{leftIcon}</span>}
      {children}
          {rightIcon && <span className="ml-2">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};
