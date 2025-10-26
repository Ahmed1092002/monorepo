import React, { useEffect, useMemo, useRef } from "react";
import { useGetQRCodeQuery } from "@monorepo/shared-api";
import { QRCodeSVG } from "qrcode.react";
import QRCode from "qrcode";
import { useTranslation } from "react-i18next";
import {
  Modal,
  ModalHeader,
  ModalContent,
  ModalFooter,
} from "@monorepo/shared-ui";
import { Button } from "@monorepo/shared-ui";
import { Text } from "@monorepo/shared-ui";
type PrintableItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

type PrintReceiptData = {
  receiptCode: string;
  dateTimeIssued: string;
  paymentMethodLabel: string;
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  netPayable: number;
  items: PrintableItem[];
  receiptId?: number; // Add receipt ID for QR code
};

type PrintReceiptModalProps = {
  open: boolean;
  data: PrintReceiptData | null;
  onClose: () => void;
};

const PrintReceiptModal: React.FC<PrintReceiptModalProps> = ({
  open,
  data,
  onClose,
}) => {
  const { t } = useTranslation();
  const printAreaRef = useRef<HTMLDivElement>(null);

  const canPrint = useMemo(() => Boolean(open && data), [open, data]);

  // Get QR code URL if receipt ID is available
  const { data: qrCodeUrl, isLoading: qrCodeLoading } = useGetQRCodeQuery(
    data?.receiptId || 0,
    {
      skip: !data?.receiptId || !open,
    }
  );
  const formatAmount = (n: number) => `${Number(n || 0).toFixed(2)} EGP`;

  const generatePrintHtml = async (d: PrintReceiptData) => {
    const itemsHtml = d.items
      .map(
        (it) => `
        <div class="row">
          <div>${it.description}</div>
          <div class="right">${it.quantity}</div>
          <div class="right">${Number(it.unitPrice || 0).toFixed(2)}</div>
          <div class="right">${Number(it.lineTotal || 0).toFixed(2)}</div>
        </div>`
      )
      .join("");

    // Generate QR code data URL if URL is available
    let qrCodeDataUrl = "";
    if (qrCodeUrl) {
      try {
        qrCodeDataUrl = await QRCode.toDataURL(qrCodeUrl, {
          width: 150,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
          errorCorrectionLevel: "M",
        });
      } catch (error) {
        console.error("Error generating QR code:", error);
      }
    }

    // Add QR code section if URL is available (used in header right)
    const qrCodeSection =
      qrCodeUrl && qrCodeDataUrl
        ? `
        <div class="qr-section">
          <div class="qr-code">
            <img src="${qrCodeDataUrl}" alt="QR Code" />
          </div>
        </div>`
        : "";

    return `
      <div class="paper">
        <div class="header">
          <div class="header-left">
            <div class="title">${t("receipt_number")}${d.receiptCode}</div>
            <div class="meta">
              <div>${new Date(d.dateTimeIssued).toLocaleString()}</div>
              <div>${t("payment")} ${d.paymentMethodLabel}</div>
            </div>
          </div>
          ${qrCodeSection}
        </div>
        <div class="section">
          <div class="section-title">${t("items")}</div>
          <div class="head">
            <div>${t("item")}</div>
            <div class="right">${t("qty")}</div>
            <div class="right">${t("price")}</div>
            <div class="right">${t("total")}</div>
          </div>
          ${itemsHtml}
        </div>
        <div class="section totals-card">
          <div class="row">
            <div class="totalLabel">${t("subtotal")}</div>
            <div class="totalValue">${formatAmount(d.subtotal)}</div>
          </div>
          ${
            d.discountTotal > 0
              ? `<div class="row"><div class="totalLabel">${t(
                  "discounts"
                )}</div><div class="totalValue">-${formatAmount(
                  d.discountTotal
                )}</div></div>`
              : ""
          }
          <div class="row">
            <div class="totalLabel">${t("taxes")}</div>
            <div class="totalValue">${formatAmount(d.taxTotal)}</div>
          </div>
          <div class="row grand">
            <div class="totalLabel">${t("grand_total")}</div>
            <div class="totalValue">${formatAmount(d.netPayable)}</div>
          </div>
        </div>
        <div class="footer">${t("thank_you_for_purchase")}</div>
      </div>`;
  };

  useEffect(() => {
    // Focus for accessibility when opened
    if (open) {
      setTimeout(() => {
        const btn = document.getElementById("print-receipt-btn");
        btn?.focus();
      }, 0);
    }
  }, [open]);

  if (!open || !data) return null;

  const handlePrint = async () => {
    if (!printAreaRef.current) return;
    const printHtml = await generatePrintHtml(data);

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;
    doc.open();
    doc.write(`<!doctype html><html><head><meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Receipt ${data.receiptCode}</title>
      <style>
        body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"; padding: 0; }
        .paper { width: 72mm; margin: 0 auto; padding: 10px 8px; }
        .header { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 6px; margin-bottom: 6px; }
        .header-left { text-align: left; }
        .title { font-weight: 800; font-size: 14px; margin-top: 2px; text-transform: uppercase; letter-spacing: .3px; }
        .meta { font-size: 10.5px; color: #374151; display: grid; gap: 2px; margin-top: 4px; }
        .section { margin-top: 8px; }
        .section-title { font-size: 10px; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: .2px; margin-bottom: 4px; }
        .divider { border-top: 1px dashed #d1d5db; margin: 6px 0; }
        .head { display: grid; grid-template-columns: 1fr 18mm 22mm 22mm; gap: 6px; font-weight: 700; font-size: 11px; padding: 4px 0; border-top: 1px dashed #d1d5db; border-bottom: 1px dashed #d1d5db; }
        .row { display: grid; grid-template-columns: 1fr 18mm 22mm 22mm; gap: 6px; font-size: 11px; align-items: baseline; padding: 2px 0; }
        .right { text-align: right; }
        .totals-card { margin-top: 8px; padding: 6px; border: 1px solid #e5e7eb; border-radius: 4px; font-size: 12px; }
        .totals-card .row { grid-template-columns: 1fr 1fr; }
        .totalLabel { text-align: left; }
        .totalValue { text-align: right; }
        .grand { font-weight: 800; font-size: 13px; border-top: 1px dashed #d1d5db; margin-top: 4px; padding-top: 4px; }
        .qr-section { text-align: right; }
        .qr-code { margin: 0; }
        .qr-code img { width: 24mm; height: 24mm; }
        .footer { margin-top: 8px; text-align: center; font-size: 10px; color: #6b7280; }
        @page { size: 80mm auto; margin: 0; }
      </style>
    </head><body>${printHtml}</body></html>`);
    doc.close();

    const printFn = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } finally {
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 100);
      }
    };

    if (iframe.contentWindow) {
      iframe.onload = printFn;
      // Fallback in case onload doesn't fire
      setTimeout(printFn, 300);
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} size="md">
      <ModalHeader>
        <Text variant="h3" color="dark" weight="semibold">
          {t("print_receipt_title")}
        </Text>
      </ModalHeader>

      <ModalContent>
        <div className="space-y-4">
          <div ref={printAreaRef}>
            {/* QR Code Section - moved to top */}
            {data.receiptId && (
              <div className="pb-3 mb-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-left">
                    <div className="font-extrabold text-sm uppercase tracking-wide">
                      {t("receipt_number")}
                      {data.receiptCode}
                    </div>
                    <div className="grid gap-0.5 mt-1">
                      <div className="text-xs text-gray-600">
                        {new Date(data.dateTimeIssued).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-600">
                        {t("payment")} {data.paymentMethodLabel}
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0">
                    {qrCodeLoading ? (
                      <div className="text-[10px] text-gray-500">
                        {t("loading_qr")}
                      </div>
                    ) : qrCodeUrl ? (
                      <QRCodeSVG
                        value={qrCodeUrl}
                        size={84}
                        level="M"
                        includeMargin={true}
                        bgColor="#FFFFFF"
                        fgColor="#000000"
                      />
                    ) : (
                      <div className="text-[10px] text-gray-500">
                        {t("qr_not_available")}
                      </div>
                    )}
                  </div>
                </div>
                <div className="border-b border-dashed border-gray-300 mt-2"></div>
              </div>
            )}
            {!data.receiptId && (
              <div className="text-center">
                <div className="font-extrabold text-sm uppercase tracking-wide">
                  {t("receipt_number")}
                  {data.receiptCode}
                </div>
                <div className="grid gap-0.5 mt-1">
                  <div className="text-xs text-gray-600">
                    {new Date(data.dateTimeIssued).toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-600">
                    {t("payment")} {data.paymentMethodLabel}
                  </div>
                </div>
              </div>
            )}

            <div className="mt-3">
              <div className="text-[10px] font-bold text-gray-700 uppercase tracking-wide mb-1">
                {t("items")}
              </div>
              <div className="grid grid-cols-4 gap-2 text-xs font-bold border-y border-dashed border-gray-300 py-1">
                <div>{t("item")}</div>
                <div className="text-right">{t("qty")}</div>
                <div className="text-right">{t("price")}</div>
                <div className="text-right">{t("total")}</div>
              </div>
            </div>

            <div className="mt-1 space-y-1">
              {data.items.map((it, idx) => (
                <div
                  className="grid grid-cols-4 gap-2 text-xs items-baseline py-0.5"
                  key={idx}
                >
                  <div className="truncate" title={it.description}>
                    {it.description}
                  </div>
                  <div className="text-right">{it.quantity}</div>
                  <div className="text-right">
                    {Number(it.unitPrice || 0).toFixed(2)}
                  </div>
                  <div className="text-right">
                    {Number(it.lineTotal || 0).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 p-3 border border-gray-200 rounded text-sm">
              <div className="grid grid-cols-2">
                <div className="text-gray-700">{t("subtotal")}</div>
                <div className="text-right">{formatAmount(data.subtotal)}</div>
              </div>
              {data.discountTotal > 0 && (
                <div className="grid grid-cols-2">
                  <div className="text-gray-700">{t("discounts")}</div>
                  <div className="text-right">
                    -{formatAmount(data.discountTotal)}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2">
                <div className="text-gray-700">{t("taxes")}</div>
                <div className="text-right">{formatAmount(data.taxTotal)}</div>
              </div>
              <div className="grid grid-cols-2 font-extrabold text-brand-dark mt-1 border-t border-dashed border-gray-300 pt-2">
                <div>{t("grand_total")}</div>
                <div className="text-right">
                  {formatAmount(data.netPayable)}
                </div>
              </div>
            </div>

            <div className="text-center text-xs text-gray-500 mt-3">
              {t("thank_you_for_purchase")}
            </div>
          </div>
        </div>
      </ModalContent>

      <ModalFooter>
        <div className="flex space-x-3">
          <Button
            id="print-receipt-btn"
            variant="primary"
            onClick={handlePrint}
            disabled={!canPrint}
            fullWidth
          >
            {t("print")}
          </Button>
          <Button variant="secondary" onClick={onClose} fullWidth>
            {t("skip")}
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
};

export { PrintReceiptModal };
