import React from "react";
import { useTranslation } from "react-i18next";
import { Modal, ModalHeader, ModalContent, ModalFooter } from "@monorepo/shared-ui";
import { Button } from "@monorepo/shared-ui";
import { Text } from "@monorepo/shared-ui";

type CloseShiftModalProps = {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

const CloseShiftModal: React.FC<CloseShiftModalProps> = ({
  open,
  onCancel,
  onConfirm,
}) => {
  const { t } = useTranslation();
  
  return (
    <Modal isOpen={open} onClose={onCancel} size="md">
      <ModalHeader>
        <Text variant="h3" color="dark" weight="semibold">
          {t("close_shift_title")}
        </Text>
      </ModalHeader>
      
      <ModalContent>
        <Text color="dark">
          {t("close_shift_message")}
        </Text>
      </ModalContent>
      
      <ModalFooter>
        <div className="flex space-x-3">
          <Button 
            variant="secondary" 
            onClick={onCancel}
            fullWidth
          >
            {t("cancel")}
          </Button>
          <Button 
            variant="primary" 
            onClick={onConfirm}
            fullWidth
          >
            {t("close_shift")}
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
};

export default CloseShiftModal;
