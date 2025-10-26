import { useState, useCallback } from "react";
import { toast } from "react-toastify";
import * as db from "../utils/db";
import type { Receipt } from "@monorepo/shared-types";

export interface HeldReceipt {
  id: string;
  items: any[];
  receiptDiscountMode: "percent" | "amount";
  receiptDiscountValue: number;
  isReturnMode: boolean;
  referenceReceiptUuid?: string;
  selectedCustomer: any;
  timestamp: string;
  receiptCode: string;
  totalAmount: number;
}

/**
 * Hook for handling offline receipt syncing
 * Extracted from POSPage offline sync logic
 */
export function useReceiptOfflineSync() {
  const [localIndex, setLocalIndex] = useState(0);

  /**
   * Increment local index for receipt codes
   */
  const incrementToLocalIndex = async (): Promise<number> => {
    const index = await db.get<number>("localIndex");
    let newIndex = index ?? 0;
    newIndex += 1;
    setLocalIndex(newIndex);
    await db.set("localIndex", newIndex);
    return newIndex;
  };

  /**
   * Hold a receipt for later processing
   */
  const holdReceipt = useCallback(
    async (
      items: any[],
      receiptDiscountMode: "percent" | "amount",
      receiptDiscountValue: number,
      isReturnMode: boolean,
      referenceReceiptUuid: string | undefined,
      selectedCustomer: any,
      receiptSummary: { netPayable: number },
      currentShiftId: number
    ) => {
      const localIdx = await incrementToLocalIndex();
      try {
        const timestamp = Date.now();
        const date = new Date(timestamp);
        const heldReceipt: HeldReceipt = {
          id: `held_${date.toISOString()}+${currentShiftId.toString()}+${localIdx.toString()}`,
          items: [...items],
          receiptDiscountMode,
          receiptDiscountValue,
          isReturnMode,
          referenceReceiptUuid,
          selectedCustomer,
          timestamp: new Date().toISOString(),
          receiptCode: `HOLD-${date.toISOString()}-${currentShiftId.toString()}-${localIdx.toString()}`,
          totalAmount: receiptSummary.netPayable,
        };

        const existingHeldReceipts =
          (await db.get<HeldReceipt[]>("heldReceipts")) || [];
        existingHeldReceipts.push(heldReceipt);
        await db.set("heldReceipts", existingHeldReceipts);

        return { success: true, message: "receipt_saved_for_processing" };
      } catch (error) {
        console.error("Error holding receipt:", error);
        return { success: false, message: "failed_to_save_receipt" };
      }
    },
    []
  );

  /**
   * Restore a held receipt
   */
  const restoreReceipt = useCallback((heldReceipt: HeldReceipt) => {
    return {
      items: heldReceipt.items,
      receiptDiscountMode: heldReceipt.receiptDiscountMode,
      receiptDiscountValue: heldReceipt.receiptDiscountValue,
      isReturnMode: heldReceipt.isReturnMode,
      referenceReceiptUuid: heldReceipt.referenceReceiptUuid,
      selectedCustomer: heldReceipt.selectedCustomer || null,
      message: "receipt_restored_successfully",
    };
  }, []);

  /**
   * Get all held receipts
   */
  const getHeldReceipts = async (): Promise<HeldReceipt[]> => {
    return (await db.get<HeldReceipt[]>("heldReceipts")) || [];
  };

  /**
   * Delete a held receipt
   */
  const deleteHeldReceipt = async (receiptId: string) => {
    const heldReceipts = await getHeldReceipts();
    const updated = heldReceipts.filter((r) => r.id !== receiptId);
    await db.set("heldReceipts", updated);
  };

  /**
   * Get all offline receipts (for sync)
   */
  const getOfflineReceipts = async (): Promise<any[]> => {
    return (await db.get<any[]>("offlineReceipts")) || [];
  };

  /**
   * Delete offline receipts (after successful sync)
   */
  const clearOfflineReceipts = async () => {
    await db.del("offlineReceipts");
  };

  return {
    holdReceipt,
    restoreReceipt,
    getHeldReceipts,
    deleteHeldReceipt,
    incrementToLocalIndex,
    getOfflineReceipts,
    clearOfflineReceipts,
  };
}
