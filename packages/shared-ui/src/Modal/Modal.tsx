import React from "react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  size?:
    | "xs"
    | "sm"
    | "md"
    | "lg"
    | "xl"
    | "2xl"
    | "3xl"
    | "4xl"
    | "5xl"
    | "6xl"
    | "7xl"
    | "full";
  className?: string;
  overlayClassName?: string;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  preventScroll?: boolean;
  animation?: "fade" | "slide" | "scale" | "none";
  position?: "center" | "top" | "bottom";
  zIndex?: number;
  closeButtonPosition?:
    | "top-right"
    | "top-left"
    | "bottom-right"
    | "bottom-left";
  customCloseButton?: React.ReactNode;
  onAfterOpen?: () => void;
  onAfterClose?: () => void;
  isRTL?: boolean;
  role?: string;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
  // Theme customization
  theme?: {
    overlay?: string;
    modal?: string;
    closeButton?: string;
    closeButtonHover?: string;
  };
  // Custom close icon
  closeIcon?: React.ReactNode;
}

const sizeClasses = {
  xs: "max-w-xs",
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
  "6xl": "max-w-6xl",
  "7xl": "max-w-7xl",
  full: "max-w-full mx-0 my-0 h-full",
};

const positionClasses = {
  center: "items-center justify-center",
  top: "items-start justify-center pt-16",
  bottom: "items-end justify-center pb-16",
};

const animationClasses = {
  fade: "animate-fade-in",
  slide: "animate-slide-in",
  scale: "animate-scale-in",
  none: "",
};

const closeButtonPositions = {
  "top-right": "top-4 right-4",
  "top-left": "top-4 left-4",
  "bottom-right": "bottom-4 right-4",
  "bottom-left": "bottom-4 left-4",
};

// Default theme
const defaultTheme = {
  overlay: "bg-black bg-opacity-50 backdrop-blur-sm",
  modal: "bg-white rounded-lg shadow-xl",
  closeButton: "text-gray-500 hover:text-gray-700",
  closeButtonHover: "hover:bg-gray-100",
};

// Default close icon (simple X)
const DefaultCloseIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  size = "md",
  className = "",
  overlayClassName = "",
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  preventScroll = true,
  animation = "fade",
  position = "center",
  zIndex = 50,
  closeButtonPosition = "top-right",
  customCloseButton,
  onAfterOpen,
  onAfterClose,
  isRTL = false,
  role = "dialog",
  ariaLabel,
  ariaLabelledBy,
  ariaDescribedBy,
  theme = defaultTheme,
  closeIcon,
}) => {
  const [isVisible, setIsVisible] = React.useState(false);

  // Handle scroll prevention
  React.useEffect(() => {
    if (isOpen && preventScroll) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "unset";
      };
    }
  }, [isOpen, preventScroll]);

  // Handle escape key
  React.useEffect(() => {
    if (!closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose, closeOnEscape]);

  // Handle visibility and callbacks
  React.useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      onAfterOpen?.();
    } else {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onAfterClose?.();
      }, 150); // Small delay for animation
      return () => clearTimeout(timer);
    }
  }, [isOpen, onAfterOpen, onAfterClose]);

  if (!isVisible) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  const modalStyle = {
    zIndex,
  };

  const modalClasses = [
    theme.modal,
    "w-full mx-4",
    sizeClasses[size],
    animation !== "none" && animationClasses[animation],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const overlayClasses = [
    "fixed inset-0 flex",
    positionClasses[position],
    theme.overlay,
    overlayClassName,
  ]
    .filter(Boolean)
    .join(" ");

  const closeButtonClasses = [
    "absolute transition-colors cursor-pointer z-10",
    theme.closeButton,
    closeButtonPositions[closeButtonPosition],
  ].join(" ");

  return (
    <div
      className={overlayClasses}
      onClick={handleOverlayClick}
      style={modalStyle}
    >
      <div
        className={modalClasses}
        role={role}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        aria-modal="true"
      >
        {showCloseButton && (
          <div className={closeButtonClasses}>
            {customCloseButton || (
              <button
                onClick={onClose}
                aria-label="Close modal"
                className={`p-1 rounded-full transition-colors ${theme.closeButtonHover}`}
              >
                {closeIcon || <DefaultCloseIcon />}
              </button>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
};
