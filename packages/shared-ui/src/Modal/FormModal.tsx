import React from "react";
import { Modal, ModalHeader, ModalContent, ModalFooter } from "./ModalComponents";
import { Button } from "../Button/Button";
import { Text } from "../Text/Text";

export interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => void;
  title: string;
  submitText?: string;
  cancelText?: string;
  isLoading?: boolean;
  isValid?: boolean;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl" | "7xl";
  icon?: React.ReactNode;
  // Form props
  formId?: string;
  showSubmitButton?: boolean;
  showCancelButton?: boolean;
  // Theme customization
  theme?: {
    header?: string;
    content?: string;
    footer?: string;
  };
}

export const FormModal: React.FC<FormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  submitText = "Submit",
  cancelText = "Cancel",
  isLoading = false,
  isValid = true,
  children,
  size = "md",
  icon,
  formId,
  showSubmitButton = true,
  showCancelButton = true,
  theme,
}) => {
  const defaultTheme = {
    header: "",
    content: "",
    footer: "",
  };

  const modalTheme = { ...defaultTheme, ...theme };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onSubmit(formData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={size}>
      <ModalHeader className={modalTheme.header}>
        <div className="flex items-center space-x-2">
          {icon && <div className="text-blue-600">{icon}</div>}
          <Text variant="h3" color="dark" weight="semibold">
            {title}
          </Text>
        </div>
      </ModalHeader>

      <form onSubmit={handleSubmit} id={formId}>
        <ModalContent className={modalTheme.content}>
          {children}
        </ModalContent>

        <ModalFooter className={modalTheme.footer}>
          <div className="flex space-x-3">
            {showCancelButton && (
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={isLoading}
                fullWidth
              >
                {cancelText}
              </Button>
            )}
            {showSubmitButton && (
              <Button
                type="submit"
                variant="primary"
                disabled={!isValid || isLoading}
                isLoading={isLoading}
                fullWidth
              >
                {submitText}
              </Button>
            )}
          </div>
        </ModalFooter>
      </form>
    </Modal>
  );
};