import { useOfflineStatus } from "@monorepo/shared-utils";
import React from "react";
import { useTranslation } from "react-i18next";
import { Button, Text } from "@monorepo/shared-ui";

type CompactFooterProps = {
  onCancel: () => void;
  onHold: () => void;
  onOpenHeldReceipts: () => void;
};

const CompactFooter: React.FC<CompactFooterProps> = ({
  onCancel,
  onHold,
  onOpenHeldReceipts,
}) => {
  const { t } = useTranslation();
  const { isOffline } = useOfflineStatus();

  return (
    <div className="fixed bottom-3 right-3 z-30">
      <div className="flex flex-col items-stretch gap-1 bg-white/95 backdrop-blur-md border border-brand-border rounded-lg shadow-lg p-1">
        <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded">
          {isOffline ? (
            <>
              <span className="text-red-500">📶</span>
              <Text variant="small" color="error" className="text-[11px]">
                {t("offline")}
              </Text>
            </>
          ) : (
            <>
              <span className="text-emerald-500">📶</span>
              <Text variant="small" color="success" className="text-[11px]">
                {t("online")}
              </Text>
            </>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded hover:bg-red-50 text-red-600 transition-colors"
          title={`${t("cancel")} (${t("esc")})`}
          leftIcon={<span>❌</span>}
        >
          <span className="hidden sm:inline">{t("cancel")}</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onHold}
          className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded hover:bg-blue-50 text-blue-600 transition-colors"
          title={`${t("hold")} (${t("f4")})`}
          leftIcon={<span>⏰</span>}
        >
          <span className="hidden sm:inline">{t("hold")}</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenHeldReceipts}
          className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded hover:bg-gray-50 text-gray-700 transition-colors"
          title={t("held_receipts")}
          leftIcon={<span>📁</span>}
        >
          <span className="hidden sm:inline">{t("held_receipts")}</span>
        </Button>
      </div>
    </div>
  );
};

export default CompactFooter;
