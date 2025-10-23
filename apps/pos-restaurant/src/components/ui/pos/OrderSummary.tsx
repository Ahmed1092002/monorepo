import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button, Input, Text } from "@monorepo/shared-ui";

type Summary = {
  subtotal: number;
  totalDiscount: number;
  taxTotal: number;
  netPayable: number;
};

type OrderSummaryProps = {
  summary: Summary;
  discountValue: number;
  onDiscountChange: (value: number) => void;
  isReturnMode: boolean;
  referenceReceiptUuid?: string;
  onSubmit: () => void;
  onCancel: () => void;
  onHold: () => void;
  onOpenHeldReceipts: () => void;
  isOffline: boolean;
};

const OrderSummary: React.FC<OrderSummaryProps> = ({
  summary,
  discountValue,
  onDiscountChange,
  isReturnMode,
  referenceReceiptUuid,
  onSubmit,
  onCancel,
  onHold,
  onOpenHeldReceipts,
  isOffline,
}) => {
  const { t } = useTranslation();

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle shortcuts if no input/textarea is focused
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      switch (e.key) {
        case "Escape":
          e.preventDefault();
          onCancel();
          break;
        case "F2":
          e.preventDefault();
          onSubmit();
          break;
        case "F4":
          e.preventDefault();
          onHold();
          break;
        case "F5":
          e.preventDefault();
          onOpenHeldReceipts();
          break;
        default:
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onCancel, onSubmit, onHold, onOpenHeldReceipts]);

  return (
    <div className="card shadow-md overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500/5 to-orange-400/5 px-3 py-2 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-blue-500">🧮</span>
          <Text variant="small" color="dark" weight="semibold">
            {t("receipt_summary_title")}
          </Text>
        </div>
      </div>

      {/* Return Mode Banner */}
      {isReturnMode && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-2">
          <div className="flex items-center space-x-2">
            <span>🔄</span>
            <Text variant="small" color="light" weight="medium">
              {t("return_mode_refund_processing")}
            </Text>
          </div>
          {referenceReceiptUuid && (
            <Text variant="small" color="light" className="mt-1 opacity-90">
              {t("reference")}: {referenceReceiptUuid}
            </Text>
          )}
        </div>
      )}

      {/* Discount Section - Top Panel */}
      <div className="px-3 py-2 bg-white border-b border-gray-200">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-blue-500">🏷️</span>
          <Text variant="small" color="dark" weight="semibold">
            {t("receipt_discount_title")}
          </Text>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={discountValue === 0 ? "" : discountValue}
            onChange={(e) => onDiscountChange(parseFloat(e.target.value) || 0)}
            placeholder="0.00"
            aria-label={t("receipt_discount_title")}
            className="flex-1 transition-all duration-200 text-base h-9"
          />
          <Text
            variant="small"
            color="dark"
            weight="semibold"
            className="bg-gray-100 px-2.5 py-1.5 rounded-md border border-gray-200 whitespace-nowrap"
          >
            {t("egp")}
          </Text>
        </div>
      </div>

      {/* Summary Section - Bottom Panel */}
      <div className="px-3 py-2 bg-white">
        <div className="space-y-1.5 text-sm mb-2">
          <div className="flex justify-between items-center">
            <Text variant="small" color="secondary" weight="medium">
              {t("subtotal")}:
            </Text>
            <Text variant="small" color="dark" weight="semibold">
              {summary.subtotal.toFixed(2)} {t("egp")}
            </Text>
          </div>
          <div className="flex justify-between items-center">
            <Text
              variant="small"
              color="secondary"
              weight="medium"
              className="flex items-center gap-1"
            >
              <span>📉</span>
              {t("total_discount")}:
            </Text>
            <Text variant="small" color="success" weight="semibold">
              -{summary.totalDiscount.toFixed(2)} {t("egp")}
            </Text>
          </div>
          <div className="flex justify-between items-center">
            <Text variant="small" color="secondary" weight="medium">
              {t("tax_total")}:
            </Text>
            <Text variant="small" color="dark" weight="semibold">
              {summary.taxTotal.toFixed(2)} {t("egp")}
            </Text>
          </div>
        </div>

        {/* Separator line */}
        <div className="border-t border-dashed border-gray-200 my-2"></div>

        {/* Net Payable - Visual Anchor */}
        <div className="relative mt-2">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-orange-400/10 rounded-lg blur-md"></div>
          <div className="relative border-2 border-blue-500/20 bg-gradient-to-r from-blue-500/5 to-orange-400/5 rounded-lg p-3 shadow-md">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-orange-400 rounded-md shadow-md">
                  <span className="text-white">💰</span>
                </div>
                <Text variant="small" color="secondary" weight="medium">
                  {isReturnMode ? t("refund_amount") : t("net_payable")}
                </Text>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-orange-400 bg-clip-text text-transparent leading-none mb-1">
                  {summary.netPayable.toFixed(2)}
                </div>
                <Text variant="small" color="primary" weight="medium">
                  {t("egp")}
                </Text>
              </div>
            </div>
          </div>
        </div>

        {/* Actions row: left secondary, right primary */}
        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 rounded-full border border-gray-200">
              {isOffline ? (
                <>
                  <span className="text-red-500">📶</span>
                  <Text
                    variant="small"
                    color="error"
                    className="text-xs font-medium"
                  >
                    {t("offline")}
                  </Text>
                </>
              ) : (
                <>
                  <span className="text-emerald-500">📶</span>
                  <Text
                    variant="small"
                    color="success"
                    className="text-xs font-medium"
                  >
                    {t("online")}
                  </Text>
                </>
              )}
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={onCancel}
              className="px-3.5 py-1.5 text-sm font-semibold rounded-full"
              title={`${t("cancel")} (ESC)`}
            >
              <span className="hidden md:inline">{t("cancel")}</span>{" "}
              <span className="hidden lg:inline text-xs opacity-75">(ESC)</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={onHold}
              className="px-3.5 py-1.5 text-sm font-semibold rounded-full"
              title={`${t("hold")} (F4)`}
            >
              {t("hold")}{" "}
              <span className="hidden lg:inline text-xs opacity-75">(F4)</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={onOpenHeldReceipts}
              className="px-3.5 py-1.5 text-sm font-semibold rounded-full"
              title={`${t("held_receipts")} (F5)`}
            >
              {t("held_receipts")}{" "}
              <span className="hidden lg:inline text-xs opacity-75">(F5)</span>
            </Button>
          </div>
          <Button
            variant="primary"
            onClick={onSubmit}
            className="inline-flex items-center gap-2 px-5 py-2 bg-blue-500 hover:bg-gradient-to-r hover:from-blue-500 hover:to-orange-400 text-white rounded-full font-bold text-base shadow-md hover:shadow-lg transition-all"
            title={`${isReturnMode ? t("refund_submit") : t("pay_submit")} (F2)`}
            leftIcon={<span>💳</span>}
          >
            <span>{isReturnMode ? t("refund_submit") : t("pay_submit")}</span>
            <span className="hidden lg:inline text-xs opacity-75">(F2)</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;
