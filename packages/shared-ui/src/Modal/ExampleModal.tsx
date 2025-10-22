import React from "react";
import {
  Modal,
  ModalHeader,
  ModalContent,
  ModalFooter,
} from "./ModalComponents";
import { Button } from "../Button/Button";
import { Text } from "../Text/Text";
import { Input } from "../Input/Input";
import { Select } from "../Input/Select";

export interface ExampleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; email: string; role: string }) => void;
  title?: string;
  size?:
    | "sm"
    | "md"
    | "lg"
    | "xl"
    | "2xl"
    | "3xl"
    | "4xl"
    | "5xl"
    | "6xl"
    | "7xl";
  animation?: "fade" | "slide" | "scale" | "none";
  position?: "center" | "top" | "bottom";
  isRTL?: boolean;
}

export const ExampleModal: React.FC<ExampleModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title = "Example Modal",
  size = "md",
  animation = "fade",
  position = "center",
  isRTL = false,
}) => {
  const [formData, setFormData] = React.useState({
    name: "",
    email: "",
    role: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({ name: "", email: "", role: "" });
    onClose();
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={size}
      animation={animation}
      position={position}
      isRTL={isRTL}
      ariaLabel={title}
    >
      <ModalHeader>
        <Text variant="h3" color="dark" weight="semibold">
          {title}
        </Text>
      </ModalHeader>

      <form onSubmit={handleSubmit}>
        <ModalContent scrollable>
          <div className="space-y-4">
            <Input
              label="Name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Enter your name"
              required
              isRTL={isRTL}
            />

            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="Enter your email"
              required
              isRTL={isRTL}
            />

            <Select
              label="Role"
              value={formData.role}
              onChange={(e) => handleInputChange("role", e.target.value)}
              options={[
                { value: "", label: "Select a role" },
                { value: "admin", label: "Administrator" },
                { value: "user", label: "User" },
                { value: "guest", label: "Guest" },
              ]}
              required
              isRTL={isRTL}
            />
          </div>
        </ModalContent>

        <ModalFooter>
          <div className="flex space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="flex-1">
              Submit
            </Button>
          </div>
        </ModalFooter>
      </form>
    </Modal>
  );
};
