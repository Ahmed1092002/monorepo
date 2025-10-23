import { useOfflineStatus } from "@monorepo/shared-utils";
import React from "react";
import { useTranslation } from "react-i18next";
import { Button, Text } from "@monorepo/shared-ui";

type FooterToolbarProps = {
  isReturnMode: boolean;
  onCancel: () => void;
  onHold: () => void;
  onSubmit: () => void;
  onOpenHeldReceipts: () => void;
};

const FooterToolbar: React.FC<FooterToolbarProps> = ({
  isReturnMode,
  onCancel,
  onHold,
  onSubmit,
  onOpenHeldReceipts,
}) => {
  const { t } = useTranslation();
  const { isOffline } = useOfflineStatus();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-brand-border shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-20">
      <div className="px-3 py-2">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2">
          {/* Left Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="secondary"
              onClick={onCancel}
              className="shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-1.5 text-base py-2 px-3"
              leftIcon={<span>❌</span>}
            >
              <span>{t("cancel")}</span>
              <span className="text-xs opacity-60 hidden md:inline">
                ({t("esc")})
              </span>
            </Button>
            <Button
              variant="secondary"
              onClick={onHold}
              className="shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-1.5 text-base py-2 px-3"
              leftIcon={<span>⏰</span>}
            >
              <span>{t("hold")}</span>
              <span className="text-xs opacity-60 hidden md:inline">
                ({t("f4")})
              </span>
            </Button>
            <Button
              variant="secondary"
              onClick={onOpenHeldReceipts}
              className="shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-1.5 text-base py-2 px-3"
              leftIcon={<span>📁</span>}
            >
              <span className="hidden sm:inline">{t("held_receipts")}</span>
              <span className="sm:hidden">Held</span>
            </Button>
          </div>

          {/* Right Section - Status & Submit */}
          <div className="flex items-center gap-2">
            {/* Status Indicators */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
              <div className="flex items-center gap-1 text-xs font-medium">
                {isOffline ? (
                  <span className="text-red-500">⚠️</span>
                ) : (
                  <span className="text-emerald-500">✅</span>
                )}
                <Text variant="small" color={isOffline ? "error" : "success"}>
                  {isOffline ? t("eta_not_connected") : t("eta_connected")}
                </Text>
              </div>
              <div className="w-px h-3 bg-gray-300"></div>
              <div className="flex items-center gap-1 text-xs font-medium">
                {isOffline ? (
                  <>
                    <span className="text-red-500">📶</span>
                    <Text variant="small" color="error">
                      {t("offline")}
                    </Text>
                  </>
                ) : (
                  <>
                    <span className="text-emerald-500">📶</span>
                    <Text variant="small" color="success">
                      {t("online")}
                    </Text>
                  </>
                )}
              </div>
              <div className="w-px h-3 bg-gray-300"></div>
            </div>

            {/* Primary CTA - Pay/Submit Button */}
            <Button
              variant="primary"
              onClick={onSubmit}
              className="group relative flex-1 lg:flex-none px-6 py-2.5 bg-gradient-to-r from-blue-500 to-orange-400 text-white rounded-lg font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 overflow-hidden"
              leftIcon={<span>💳</span>}
            >
              <span>{isReturnMode ? t("refund_submit") : t("pay_submit")}</span>
              <span className="text-xs opacity-80 hidden md:inline">
                ({t("f2")})
              </span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FooterToolbar;
