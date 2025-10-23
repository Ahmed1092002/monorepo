import React from "react";
import { LogoutModal as SharedLogoutModal } from "@monorepo/shared-ui";
import { useTranslation } from "react-i18next";
import { useLocalization } from "@monorepo/shared-providers";

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onHoldShift: () => void;
  onLogout: () => void;
}

const LogoutModal: React.FC<LogoutModalProps> = ({
  isOpen,
  onClose,
  onHoldShift,
  onLogout,
}) => {
  const { t } = useTranslation();
  const { language } = useLocalization();

  // Check if current language is RTL
  const isRTL = language?.isRTL || false;

  return (
    <SharedLogoutModal
      isOpen={isOpen}
      onClose={onClose}
      onHoldShift={onHoldShift}
      onLogout={onLogout}
      title={t("logout_options_title")}
      message={t("logout_options_message")}
      holdShiftText={t("hold_shift")}
      holdShiftDescription={t("hold_shift_description")}
      logoutText={t("close_shift")}
      logoutDescription={t("logout_description")}
      cancelText={t("cancel")}
      isRTL={isRTL}
    />
  );
};

export default LogoutModal;
