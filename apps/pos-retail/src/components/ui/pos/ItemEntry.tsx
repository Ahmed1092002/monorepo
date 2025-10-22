import React from "react";
import { useTranslation } from "react-i18next";
import { Button, Input, Text } from "@monorepo/shared-ui";

type ItemEntryProps = {
  barcodeInput: string;
  onBarcodeChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onOpenSearch: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
};

const ItemEntry: React.FC<ItemEntryProps> = ({
  barcodeInput,
  onBarcodeChange,
  onSubmit,
  onOpenSearch,
  inputRef: _inputRef,
}) => {
  const { t } = useTranslation();

  return (
    <div className="card p-4">
      <Text variant="h3" color="dark" weight="semibold" className="mb-4">
        {t("item_entry_title")}
      </Text>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Text variant="small" color="dark" weight="medium" className="mb-2">
            {t("barcode_item_code")}
          </Text>
          <div className="flex space-x-2">
            <Input
              type="text"
              value={barcodeInput}
              onChange={(e) => onBarcodeChange(e.target.value)}
              placeholder={t("scan_or_enter_item_code")}
              autoFocus
              fullWidth
            />
            <Button
              type="button"
              variant="secondary"
              onClick={onOpenSearch}
              leftIcon={<span>🔍</span>}
            />
          </div>
        </div>
      </form>
    </div>
  );
};

export default ItemEntry;
