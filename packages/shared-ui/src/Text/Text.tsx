import React from "react";

export interface TextProps {
  children: React.ReactNode;
  variant?:
    | "h1"
    | "h2"
    | "h3"
    | "h4"
    | "h5"
    | "h6"
    | "body"
    | "caption"
    | "small";
  color?:
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "error"
    | "dark"
    | "light";
  weight?: "light" | "normal" | "medium" | "semibold" | "bold" | "extrabold";
  align?: "left" | "center" | "right";
  className?: string;
  // Theme customization
  theme?: {
    h1?: string;
    h2?: string;
    h3?: string;
    h4?: string;
    h5?: string;
    h6?: string;
    body?: string;
    caption?: string;
    small?: string;
    primary?: string;
    secondary?: string;
    success?: string;
    warning?: string;
    error?: string;
    dark?: string;
    light?: string;
  };
}

const defaultTheme = {
  h1: "text-4xl font-bold",
  h2: "text-3xl font-bold",
  h3: "text-2xl font-semibold",
  h4: "text-xl font-semibold",
  h5: "text-lg font-medium",
  h6: "text-base font-medium",
  body: "text-base",
  caption: "text-sm",
  small: "text-xs",
  primary: "text-blue-600",
  secondary: "text-gray-600",
  success: "text-green-600",
  warning: "text-yellow-600",
  error: "text-red-600",
  dark: "text-gray-900",
  light: "text-gray-500",
};

const weightClasses = {
  light: "font-light",
  normal: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
  extrabold: "font-extrabold",
};

const alignClasses = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

export const Text: React.FC<TextProps> = ({
  children,
  variant = "body",
  color = "dark",
  weight,
  align = "left",
  className = "",
  theme = defaultTheme,
}) => {
  const textClasses = [
    theme[variant],
    theme[color],
    weight ? weightClasses[weight] : "",
    alignClasses[align],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const Component = variant.startsWith("h")
    ? (variant as keyof React.JSX.IntrinsicElements)
    : "p";

  return React.createElement(Component, { className: textClasses }, children);
};
