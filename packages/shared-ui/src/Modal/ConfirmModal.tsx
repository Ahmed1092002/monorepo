import React from "react";
import { Modal, ModalHeader, ModalContent, ModalFooter } from "../Modal/ModalComponents";
import { Button } from "../Button/Button";
import { Text } from "../Text/Text";

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
  icon?: React.ReactNode;
}

const variantClasses = {
  danger: {
    iconColor: "text-brand-error",
    buttonVariant: "danger" as const,
  },
  warning: {
    iconColor: "text-brand-warning", 
    buttonVariant: "warning" as const,
  },
  info: {
    iconColor: "text-brand-info",
    buttonVariant: "primary" as const,
  },
};

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  isLoading = false,
  icon,
}) => {
  const variantStyle = variantClasses[variant];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalHeader>
        <div className="flex items-center space-x-2">
          {icon && <div className={variantStyle.iconColor}>{icon}</div>}
          <Text variant="h3" color="dark" weight="semibold">
            {title}
          </Text>
        </div>
      </ModalHeader>

      <ModalContent>
        <Text color="dark" className="mb-4">
          {message}
        </Text>
      </ModalContent>

      <ModalFooter>
        <div className="flex space-x-3">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1"
          >
            {cancelText}
          </Button>
          <Button
            variant={variantStyle.buttonVariant}
            onClick={onConfirm}
            disabled={isLoading}
            isLoading={isLoading}
            className="flex-1"
          >
            {confirmText}
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
};
