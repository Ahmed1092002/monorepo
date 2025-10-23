import React from "react";
import { DeleteConfirmModal as SharedDeleteConfirmModal } from "@monorepo/shared-ui";
import { useTranslation } from "react-i18next";

type DeleteConfirmModalProps = {
  open: boolean;
  supervisorPassword: string;
  onPasswordChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
};

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  open,
  supervisorPassword: _supervisorPassword,
  onPasswordChange,
  onCancel,
  onConfirm,
}) => {
  const { t } = useTranslation();

  const handleConfirm = (password: string) => {
    onPasswordChange(password);
    onConfirm();
  };

  return (
    <SharedDeleteConfirmModal
      isOpen={open}
      onClose={onCancel}
      onConfirm={handleConfirm}
      title={t("delete_item_title")}
      message={t("delete_item_message")}
      confirmText={t("delete_item_button")}
      cancelText={t("cancel")}
      passwordLabel={t("supervisor_password_required")}
      passwordPlaceholder={t("enter_supervisor_password")}
      demoPassword={t("supervisor")}
      demoPasswordLabel={t("demo_password")}
    />
  );
};

export default DeleteConfirmModal;
