import React from "react";
import { LogOut, PauseCircle } from "lucide-react";
import { Modal, ModalHeader, ModalContent, ModalFooter } from "./ModalComponents";
import { Button } from "../Button/Button";
import { Text } from "../Text/Text";

export interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onHoldShift: () => void;
  onLogout: () => void;
  title?: string;
  message?: string;
  holdShiftText?: string;
  holdShiftDescription?: string;
  logoutText?: string;
  logoutDescription?: string;
  cancelText?: string;
  isRTL?: boolean;
}

export const LogoutModal: React.FC<LogoutModalProps> = ({
  isOpen,
  onClose,
  onHoldShift,
  onLogout,
  title = "Logout Options",
  message = "Choose what you would like to do:",
  holdShiftText = "Hold Shift",
  holdShiftDescription = "Temporarily pause your shift and lock the screen",
  logoutText = "Close Shift",
  logoutDescription = "End your shift and logout completely",
  cancelText = "Cancel",
  isRTL = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalHeader>
        <div className="flex items-center gap-4">
          <div className="rounded-xl bg-orange-100 p-3">
            <LogOut className="w-7 h-7 text-orange-600" />
          </div>
          <div>
            <Text variant="h2" color="dark" weight="bold">
              {title}
            </Text>
            <Text variant="small" color="dark" className="mt-1 opacity-70">
              {message}
            </Text>
          </div>
        </div>
      </ModalHeader>

      <ModalContent>
        <div className="space-y-4">
          {/* Hold Shift Option */}
          <button
            onClick={onHoldShift}
            className={`w-full p-4 rounded-xl border border-orange-200 bg-orange-50 hover:bg-orange-100 transition-colors ${
              isRTL ? "text-right" : "text-left"
            } group cursor-pointer`}
          >
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-orange-200 p-3 group-hover:bg-orange-300 transition-colors">
                <PauseCircle className="w-6 h-6 text-orange-700" />
              </div>
              <div className="flex-1">
                <Text variant="h5" color="dark" weight="semibold">
                  {holdShiftText}
                </Text>
                <Text variant="small" color="dark" className="mt-1 opacity-70">
                  {holdShiftDescription}
                </Text>
              </div>
            </div>
          </button>

          {/* Logout Option */}
          <button
            onClick={onLogout}
            className={`w-full p-4 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 transition-colors ${
              isRTL ? "text-right" : "text-left"
            } group cursor-pointer`}
          >
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-red-200 p-3 group-hover:bg-red-300 transition-colors">
                <LogOut className="w-6 h-6 text-red-700" />
              </div>
              <div className="flex-1">
                <Text variant="h5" color="dark" weight="semibold">
                  {logoutText}
                </Text>
                <Text variant="small" color="dark" className="mt-1 opacity-70">
                  {logoutDescription}
                </Text>
              </div>
            </div>
          </button>
        </div>
      </ModalContent>

      <ModalFooter>
        <div className={`flex ${isRTL ? "justify-start" : "justify-end"}`}>
          <Button variant="secondary" onClick={onClose}>
            {cancelText}
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
};
