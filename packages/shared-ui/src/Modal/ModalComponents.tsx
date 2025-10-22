import React from "react";
import { Modal } from "./Modal";

export interface ModalHeaderProps {
  children: React.ReactNode;
  className?: string;
  showBorder?: boolean;
  padding?: "sm" | "md" | "lg";
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({
  children,
  className = "",
  showBorder = true,
  padding = "md",
}) => {
  const paddingClasses = {
    sm: "p-3",
    md: "p-6",
    lg: "p-8",
  };

  const borderClasses = showBorder ? "border-b border-gray-200" : "";

  return (
    <div className={`${paddingClasses[padding]} ${borderClasses} ${className}`}>
      {children}
    </div>
  );
};

export interface ModalContentProps {
  children: React.ReactNode;
  className?: string;
  scrollable?: boolean;
  maxHeight?: string;
  padding?: "sm" | "md" | "lg";
}

export const ModalContent: React.FC<ModalContentProps> = ({
  children,
  className = "",
  scrollable = false,
  maxHeight = "max-h-[70vh]",
  padding = "md",
}) => {
  const paddingClasses = {
    sm: "p-3",
    md: "p-6",
    lg: "p-8",
  };

  const scrollableClasses = scrollable ? `overflow-y-auto ${maxHeight}` : "";

  return (
    <div
      className={`${paddingClasses[padding]} ${scrollableClasses} ${className}`}
    >
      {children}
    </div>
  );
};

export interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
  showBorder?: boolean;
  padding?: "sm" | "md" | "lg";
}

export const ModalFooter: React.FC<ModalFooterProps> = ({
  children,
  className = "",
  showBorder = true,
  padding = "md",
}) => {
  const paddingClasses = {
    sm: "p-3",
    md: "p-6",
    lg: "p-8",
  };

  const borderClasses = showBorder ? "border-t border-gray-200" : "";

  return (
    <div className={`${paddingClasses[padding]} ${borderClasses} ${className}`}>
      {children}
    </div>
  );
};

// Re-export Modal for convenience
export { Modal };
