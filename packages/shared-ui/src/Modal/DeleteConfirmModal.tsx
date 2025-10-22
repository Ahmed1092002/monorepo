import React, { useState } from "react";
import { Trash2 } from "lucide-react";
import { Modal, ModalHeader, ModalContent, ModalFooter } from "./ModalComponents";
import { Button } from "../Button/Button";
import { Text } from "../Text/Text";
import { Input } from "../Input/Input";

export interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password: string) => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  passwordLabel?: string;
  passwordPlaceholder?: string;
  demoPassword?: string;
  demoPasswordLabel?: string;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete Item",
  message = "Are you sure you want to delete this item? This action cannot be undone.",
  confirmText = "Delete",
  cancelText = "Cancel",
  isLoading = false,
  passwordLabel = "Supervisor Password Required",
  passwordPlaceholder = "Enter supervisor password",
  demoPassword = "supervisor",
  demoPasswordLabel = "Demo Password",
}) => {
  const [password, setPassword] = useState("");

  const handleConfirm = () => {
    onConfirm(password);
    setPassword(""); // Reset password after confirmation
  };

  const handleClose = () => {
    setPassword(""); // Reset password when closing
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && password.trim()) {
      handleConfirm();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <ModalHeader>
        <div className="flex items-center space-x-2">
          <Trash2 className="w-5 h-5 text-brand-error" />
          <Text variant="h3" color="dark" weight="semibold">
            {title}
          </Text>
        </div>
      </ModalHeader>

      <ModalContent>
        <Text color="dark" className="mb-4">
          {message}
        </Text>
        
        {demoPassword && (
          <div className="mb-4 p-3 bg-brand-muted rounded-lg">
            <Text variant="small" color="dark" className="mb-1">
              {demoPasswordLabel}:
            </Text>
            <code className="font-mono bg-brand-muted px-2 py-1 rounded text-sm">
              {demoPassword}
            </code>
          </div>
        )}

        <Input
          type="password"
          label={passwordLabel}
          placeholder={passwordPlaceholder}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          variant={password.trim() ? "default" : "default"}
        />
      </ModalContent>

      <ModalFooter>
        <div className="flex space-x-3">
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={isLoading}
            className="flex-1"
          >
            {cancelText}
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirm}
            disabled={!password.trim() || isLoading}
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
