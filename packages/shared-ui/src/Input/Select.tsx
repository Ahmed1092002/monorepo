import React from "react";

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  label?: string;
  error?: string;
  helperText?: string;
  isRTL?: boolean;
  variant?: "default" | "error" | "success";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  options?: Array<{ value: string; label: string; disabled?: boolean }>;
  children?: React.ReactNode;
}

const variantClasses = {
  default: "border-brand-border focus:border-brand-primary",
  error: "border-brand-error focus:border-brand-error",
  success: "border-brand-success focus:border-brand-success",
};

const sizeClasses = {
  sm: "px-3 py-2 text-sm",
  md: "px-4 py-2 text-base",
  lg: "px-4 py-3 text-lg",
};

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  helperText,
  isRTL = false,
  variant = "default",
  size = "md",
  fullWidth = false,
  className = "",
  options,
  children,
  ...props
}) => {
  const selectClasses = [
    "input-field",
    fullWidth ? "w-full" : "",
    variantClasses[variant],
    sizeClasses[size],
    isRTL ? "text-right" : "text-left",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={`space-y-1 ${fullWidth ? "w-full" : ""}`}>
      {label && (
        <label
          className={`block text-sm font-medium text-brand-dark ${isRTL ? "text-right" : "text-left"}`}
        >
          {label}
        </label>
      )}
      <select className={selectClasses} {...props}>
        {options
          ? options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))
          : children}
      </select>
      {error && <p className="text-sm text-brand-error">{error}</p>}
      {helperText && !error && (
        <p className="text-sm text-brand-dark opacity-70">{helperText}</p>
      )}
    </div>
  );
};
