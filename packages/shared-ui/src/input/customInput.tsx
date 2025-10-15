import React, { forwardRef, useState } from "react";

export interface CustomInputProps {
  label?: string;
  placeholder?: string;
  type?: "text" | "email" | "password" | "number" | "tel" | "url" | "search";
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  helperText?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "outlined" | "filled";
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  className?: string;
  name?: string;
  id?: string;
  autoComplete?: string;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  readOnly?: boolean;
}

export const CustomInput = forwardRef<HTMLInputElement, CustomInputProps>(
  (
    {
      label,
      placeholder,
      type = "text",
      value = "",
      onChange,
      onBlur,
      onFocus,
      disabled = false,
      required = false,
      error,
      helperText,
      size = "md",
      variant = "default",
      icon,
      iconPosition = "left",
      className = "",
      name,
      id,
      autoComplete,
      maxLength,
      minLength,
      pattern,
      readOnly = false,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleFocus = () => {
      setIsFocused(true);
      onFocus?.();
    };

    const handleBlur = () => {
      setIsFocused(false);
      onBlur?.();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e.target.value);
    };

    const togglePasswordVisibility = () => {
      setShowPassword(!showPassword);
    };

    // Size classes
    const sizeClasses = {
      sm: "px-3 py-2 text-sm",
      md: "px-4 py-3 text-base",
      lg: "px-5 py-4 text-lg",
    };

    // Variant classes
    const variantClasses = {
      default: "border border-gray-300 bg-white",
      outlined: "border-2 border-gray-300 bg-transparent",
      filled: "border-0 bg-gray-100",
    };

    // Focus classes
    const focusClasses = isFocused
      ? "ring-2 ring-blue-500 ring-opacity-50 border-blue-500"
      : "";

    // Error classes
    const errorClasses = error
      ? "border-red-500 focus:ring-red-500 focus:border-red-500"
      : "";

    // Disabled classes
    const disabledClasses = disabled
      ? "bg-gray-100 text-gray-500 cursor-not-allowed"
      : "";

    // Icon classes
    const iconClasses = icon
      ? iconPosition === "left"
        ? "pl-10"
        : "pr-10"
      : "";

    const inputClasses = `
      w-full rounded-lg transition-all duration-200 ease-in-out
      ${sizeClasses[size]}
      ${variantClasses[variant]}
      ${focusClasses}
      ${errorClasses}
      ${disabledClasses}
      ${iconClasses}
      ${className}
    `.trim();

    const containerClasses = `
      relative flex flex-col space-y-1
      ${disabled ? "opacity-60" : ""}
    `.trim();

    return (
      <div className={containerClasses}>
        {/* Label */}
        {label && (
          <label
            htmlFor={id || name}
            className={`
              text-sm font-medium transition-colors duration-200
              ${error ? "text-red-600" : "text-gray-700"}
              ${disabled ? "text-gray-400" : ""}
            `.trim()}
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        {/* Input Container */}
        <div className="relative">
          {/* Left Icon */}
          {icon && iconPosition === "left" && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <div className="text-gray-400">{icon}</div>
            </div>
          )}

          {/* Input Field */}
          <input
            ref={ref}
            type={type === "password" && showPassword ? "text" : type}
            id={id || name}
            name={name}
            value={value}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            readOnly={readOnly}
            autoComplete={autoComplete}
            maxLength={maxLength}
            minLength={minLength}
            pattern={pattern}
            className={inputClasses}
            {...props}
          />

          {/* Right Icon or Password Toggle */}
          {(icon && iconPosition === "right") || type === "password" ? (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              {type === "password" ? (
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200 focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              ) : (
                <div className="text-gray-400">{icon}</div>
              )}
            </div>
          ) : null}
        </div>

        {/* Helper Text or Error Message */}
        {(error || helperText) && (
          <div className="text-sm">
            {error ? (
              <span className="text-red-600 flex items-center">
                <svg
                  className="w-4 h-4 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {error}
              </span>
            ) : (
              <span className="text-gray-500">{helperText}</span>
            )}
          </div>
        )}
      </div>
    );
  }
);

CustomInput.displayName = "CustomInput";
