import React from "react";
import {
  Modal,
  ModalHeader,
  ModalContent,
  ModalFooter,
} from "./ModalComponents";
import { Button } from "../Button/Button";
import { Text } from "../Text/Text";
import { LoadingSpinner } from "../LoadingSpinner/LoadingSpinner";

export interface LoadingModalProps {
  isOpen: boolean;
  onClose?: () => void;
  title?: string;
  message?: string;
  showCloseButton?: boolean;
  size?: "sm" | "md" | "lg";
  spinnerSize?: "sm" | "md" | "lg";
  allowClose?: boolean;
}

export const LoadingModal: React.FC<LoadingModalProps> = ({
  isOpen,
  onClose,
  title = "Loading...",
  message = "Please wait while we process your request.",
  showCloseButton = false,
  size = "sm",
  spinnerSize = "md",
  allowClose = false,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose || (() => {})}
      size={size}
      showCloseButton={showCloseButton && allowClose}
      closeOnOverlayClick={allowClose}
      closeOnEscape={allowClose}
    >
      <ModalHeader>
        <Text variant="h3" color="dark" weight="semibold" align="center">
          {title}
        </Text>
      </ModalHeader>

      <ModalContent>
        <div className="flex flex-col items-center space-y-4">
          <LoadingSpinner size={spinnerSize} />
          <Text color="dark" align="center">
            {message}
          </Text>
        </div>
      </ModalContent>

      {allowClose && onClose && (
        <ModalFooter>
          <div className="flex justify-center">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </ModalFooter>
      )}
    </Modal>
  );
};
