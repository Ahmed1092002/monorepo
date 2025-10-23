import React, { useState, useEffect, useCallback } from "react";
import * as db from "@monorepo/shared-utils";
import type { HeldReceipt } from "@monorepo/shared-types";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import {
  Modal,
  ModalHeader,
  ModalContent,
  ModalFooter,
} from "@monorepo/shared-ui";
import { Button } from "@monorepo/shared-ui";
import { Text } from "@monorepo/shared-ui";
import { DataTable } from "@monorepo/shared-ui";

interface HeldReceiptsModalProps {
  open: boolean;
  onClose: () => void;
  onRestoreReceipt: (receipt: HeldReceipt) => void;
}

const HeldReceiptsModal: React.FC<HeldReceiptsModalProps> = ({
  open,
  onClose,
  onRestoreReceipt,
}) => {
  const { t } = useTranslation();
  const [heldReceipts, setHeldReceipts] = useState<HeldReceipt[]>([]);
  const [loading, setLoading] = useState(false);

  const loadHeldReceipts = useCallback(async () => {
    setLoading(true);
    try {
      const receipts = (await db.get<HeldReceipt[]>("heldReceipts")) || [];
      setHeldReceipts(receipts);
    } catch (error) {
      console.error("Error loading held receipts:", error);
      toast.error(t("failed_to_load_held_receipts"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  function restorHeldReceiptsModal(heldReceipt: HeldReceipt) {
    onRestoreReceipt(heldReceipt);
    deleteHeldReceipt(heldReceipt.id);
  }

  useEffect(() => {
    if (open) {
      loadHeldReceipts();
    }
  }, [open, loadHeldReceipts]);

  const deleteHeldReceipt = async (receiptId: string) => {
    try {
      const updatedReceipts = heldReceipts.filter((r) => r.id !== receiptId);
      await db.set("heldReceipts", updatedReceipts);
      setHeldReceipts(updatedReceipts);
      toast.success(t("receipt_deleted_successfully"));
    } catch (error) {
      console.error("Error deleting held receipt:", error);
      toast.error(t("failed_to_delete_receipt"));
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EGP",
    }).format(amount);
  };

  // Define columns for DataTable
  const columns = [
    {
      key: "receipt",
      label: t("receipt_details"),
      render: (_value: any, receipt: HeldReceipt) => (
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <Text variant="h5" color="dark" weight="semibold">
              {receipt.receiptCode}
            </Text>
            <Text variant="small" color="secondary">
              {formatDate(receipt.timestamp)}
            </Text>
            {receipt.isReturnMode && (
              <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                {t("return")}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <Text variant="small" color="secondary">
                {t("items_label")}: {receipt.items.length}
              </Text>
            </div>
            <div>
              <Text variant="small" color="primary" weight="semibold">
                {t("total_label")}: {formatCurrency(receipt.totalAmount)}
              </Text>
            </div>
            {receipt.selectedCustomer && (
              <div className="col-span-2">
                <Text variant="small" color="secondary">
                  {t("customer_label")}: {receipt.selectedCustomer.fullName}
                </Text>
              </div>
            )}
            {receipt.receiptDiscountValue > 0 && (
              <div className="col-span-2">
                <Text variant="small" color="secondary">
                  {t("discount_label")}:{" "}
                  {receipt.receiptDiscountMode === "percent"
                    ? `${receipt.receiptDiscountValue}%`
                    : formatCurrency(receipt.receiptDiscountValue)}
                </Text>
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <Text variant="small" color="secondary" weight="medium">
              {t("products_label")}
            </Text>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {receipt.items.slice(0, 4).map((item, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center text-xs bg-white rounded px-2 py-1"
                >
                  <div className="flex-1 mr-2">
                    <div className="font-medium truncate">{item.name}</div>
                    <div className="text-gray-400 text-xs">
                      {item.code} • {formatCurrency(item.unitPrice)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {t("qty_label")} {item.quantity}
                    </div>
                    <div className="text-blue-600 font-medium">
                      {formatCurrency(item.lineTotal)}
                    </div>
                  </div>
                </div>
              ))}
              {receipt.items.length > 4 && (
                <div className="text-xs text-gray-400 italic text-center py-1">
                  +{receipt.items.length - 4} {t("more_items")}
                </div>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "actions",
      label: t("actions"),
      render: (_value: any, receipt: HeldReceipt) => (
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => restorHeldReceiptsModal(receipt)}
            leftIcon={<span>🔄</span>}
          >
            {t("restore")}
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => deleteHeldReceipt(receipt.id)}
            leftIcon={<span>🗑️</span>}
          >
            {t("delete")}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Modal isOpen={open} onClose={onClose} size="4xl">
      <ModalHeader>
        <Text variant="h3" color="dark" weight="semibold">
          {t("held_receipts_title")}
        </Text>
      </ModalHeader>

      <ModalContent scrollable>
        <DataTable
          data={heldReceipts}
          columns={columns}
          loading={loading}
          emptyText={t("no_held_receipts")}
          emptyDescription={t("held_receipts_will_appear_here")}
        />
      </ModalContent>

      <ModalFooter>
        <div className="flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            {t("close")}
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
};

export default HeldReceiptsModal;
