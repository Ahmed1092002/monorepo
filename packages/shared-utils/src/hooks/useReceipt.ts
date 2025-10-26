import { useState, useMemo, useCallback } from "react";
import type { LineItem, Product, ITaxesGrid } from "@monorepo/shared-types";
import {
  calcTotalSalesAmount,
  calcNetTotal,
  calcTaxesAndItemTotal,
  calcDocumentTotals,
} from "../utils/etaTaxCalc";

export interface UseReceiptOptions {
  onItemAdded?: (item: LineItem) => void;
  onItemRemoved?: (itemId: string) => void;
  onSuccessToast?: (message: string) => void;
}

export interface ReceiptSummary {
  subtotal: number;
  totalDiscount: number;
  taxTotal: number;
  netPayable: number;
}

/**
 * Hook for managing receipt items and calculations
 * Extracted from POSPage business logic
 */
export function useReceipt(options: UseReceiptOptions = {}) {
  const [items, setItems] = useState<LineItem[]>([]);
  const [receiptDiscountValue, setReceiptDiscountValue] = useState(0);
  const [receiptDiscountMode, setReceiptDiscountMode] = useState<
    "percent" | "amount"
  >("amount");

  /**
   * Build taxes grid from line item
   * Prefer explicit editing taxes; otherwise fall back to displayOnlyTaxes
   */
  const buildItemTaxes = useCallback((item: LineItem) => {
    if (item.itemTaxes && item.itemTaxes.length > 0) {
      return item.itemTaxes;
    }
    if (item.displayOnlyTaxes && item.displayOnlyTaxes.length > 0) {
      // Scale amount-only taxes by quantity so totals reflect line quantity
      return item.displayOnlyTaxes.map((t) => {
        const isAmountOnly = t.taxRate === undefined || t.taxRate === null;
        return {
          ...t,
          taxAmount: isAmountOnly
            ? (Number(t.taxAmount) || 0) * Number(item.quantity)
            : t.taxAmount,
        };
      });
    }
    return [];
  }, []);

  /**
   * Recalculate a single item using ETA calc
   */
  const recalcItem = useCallback(
    (item: LineItem): LineItem => {
      const totalSalesAmount = calcTotalSalesAmount(
        item.unitPrice,
        item.quantity
      );
      const discountRatePercent =
        item.discountMode === "percent"
          ? item.discountValue
          : totalSalesAmount === 0
            ? 0
            : (item.discountValue / totalSalesAmount) * 100;
      const netTotal = calcNetTotal(totalSalesAmount, discountRatePercent);
      const taxesGrid = buildItemTaxes(item);
      const { taxesTotal, itemTotal } = calcTaxesAndItemTotal(
        netTotal,
        taxesGrid,
        0,
        0
      );
      return {
        ...item,
        tax: { ...item.tax, amount: taxesTotal },
        lineTotal: taxesGrid.length === 0 ? netTotal : itemTotal,
      };
    },
    [buildItemTaxes]
  );

  /**
   * Add item to receipt
   */
  const addItem = useCallback(
    (quantity: number, productData: Product) => {
      const existingItem = items.find((i) => i.code === productData.code);

      if (existingItem) {
        setItems((prev) =>
          prev.map((i) => {
            if (i.code !== productData.code) return i;
            const updated = recalcItem({
              ...i,
              quantity: i.quantity + quantity,
            });
            options.onItemAdded?.(updated);
            return updated;
          })
        );
      } else {
        const productTaxes: ITaxesGrid[] = Array.isArray(productData.taxes)
          ? productData.taxes.map((t) => ({
              taxType: t.typeCode || "",
              taxRate: t.isRated ? Number(t.value) : undefined,
              taxAmount: t.isRated ? undefined : Number(t.value) || 0,
              taxTypeId: t.taxId,
              taxSubtypeId: t.taxId,
            }))
          : [];

        const newItem: LineItem = {
          id: Math.random().toString(36).substr(2, 9),
          name: productData.name,
          code: productData.code,
          productId: productData.id,
          quantity,
          unitPrice: productData.sellingPrice,
          discountMode: "percent",
          discountValue: 0,
          tax: {
            type: "VAT",
            subtype: "",
            taxTypeId: undefined,
            subtypeCode: undefined,
            amount: 0,
            rate: 0,
          },
          lineTotal: 0,
          // Do NOT calculate using product taxes by default; only display them
          itemTaxes: [],
          displayOnlyTaxes: productTaxes,
        };

        // Calculate initial tax and line total via ETA calc
        const recalced = recalcItem(newItem);
        newItem.tax = recalced.tax;
        newItem.lineTotal = recalced.lineTotal;

        setItems((prev) => [...prev, newItem]);
        options.onItemAdded?.(newItem);
      }

      options.onSuccessToast?.(`${productData.name} added to receipt`);
    },
    [items, recalcItem, options]
  );

  /**
   * Remove item from receipt
   */
  const removeItem = useCallback(
    (itemId: string) => {
      setItems((prev) => prev.filter((item) => item.id !== itemId));
      options.onItemRemoved?.(itemId);
      options.onSuccessToast?.("Item removed successfully");
    },
    [options]
  );

  /**
   * Update item quantity
   */
  const updateQuantity = useCallback(
    (itemId: string, newQuantity: number) => {
      if (newQuantity <= 0) {
        removeItem(itemId);
        return;
      }

      setItems((prev) =>
        prev.map((item) => {
          if (item.id === itemId) {
            const updatedItem = recalcItem({ ...item, quantity: newQuantity });
            return updatedItem;
          }
          return item;
        })
      );
    },
    [recalcItem, removeItem]
  );

  /**
   * Update item price
   */
  const updatePrice = useCallback(
    (itemId: string, newPrice: number) => {
      setItems((prev) =>
        prev.map((item) => {
          if (item.id === itemId) {
            const updatedItem = recalcItem({ ...item, unitPrice: newPrice });
            return updatedItem;
          }
          return item;
        })
      );
    },
    [recalcItem]
  );

  /**
   * Update item taxes
   */
  const updateItemTaxes = useCallback(
    (itemId: string, updatedTaxes: ITaxesGrid[]) => {
      setItems((prev) =>
        prev.map((item) => {
          if (item.id === itemId) {
            // Merge existing product/display taxes with newly added manual taxes
            const baseDisplay = (item.displayOnlyTaxes || []).map((t) => {
              const isAmountOnly =
                t.taxRate === undefined || t.taxRate === null;
              return {
                ...t,
                taxAmount: isAmountOnly
                  ? (Number(t.taxAmount) || 0) * Number(item.quantity)
                  : t.taxAmount,
              };
            });
            const mergedTaxes: ITaxesGrid[] = [...baseDisplay, ...updatedTaxes];

            const updatedItemBase: LineItem = {
              ...item,
              itemTaxes: mergedTaxes,
              // Keep displayOnlyTaxes for reference only
              displayOnlyTaxes: item.displayOnlyTaxes,
            };

            // Recalc using ETA with updated multi taxes
            const totalSalesAmount = calcTotalSalesAmount(
              updatedItemBase.unitPrice,
              updatedItemBase.quantity
            );
            const discountRatePercent =
              updatedItemBase.discountMode === "percent"
                ? updatedItemBase.discountValue
                : totalSalesAmount === 0
                  ? 0
                  : (updatedItemBase.discountValue / totalSalesAmount) * 100;
            const netTotal = calcNetTotal(
              totalSalesAmount,
              discountRatePercent
            );
            const { taxesTotal, itemTotal } = calcTaxesAndItemTotal(
              netTotal,
              mergedTaxes,
              0,
              0
            );

            const updatedItem: LineItem = {
              ...updatedItemBase,
              tax: { ...updatedItemBase.tax, amount: taxesTotal },
              lineTotal: itemTotal,
            };
            return updatedItem;
          }
          return item;
        })
      );
    },
    []
  );

  /**
   * Calculate receipt summary via ETA document totals
   */
  const summary = useMemo<ReceiptSummary>(() => {
    const rows = items.map((item) => {
      const totalSalesAmount = calcTotalSalesAmount(
        item.unitPrice,
        item.quantity
      );
      const discountRatePercent =
        item.discountMode === "percent"
          ? item.discountValue
          : totalSalesAmount === 0
            ? 0
            : (item.discountValue / totalSalesAmount) * 100;
      const netTotal = calcNetTotal(totalSalesAmount, discountRatePercent);
      const taxesGrid = buildItemTaxes(item);
      const { taxesTotal, totalTaxableFees, itemTotal, grandTotal } =
        calcTaxesAndItemTotal(netTotal, taxesGrid, 0, 0);
      return {
        id: item.id,
        itemCode: item.code,
        itemDescription: item.name,
        itemPrice: item.unitPrice,
        itemQty: item.quantity,
        itemTotalSalesAmount: totalSalesAmount,
        itemDiscountRate: discountRatePercent,
        itemAmount: totalSalesAmount,
        itemNetTotal: netTotal,
        itemTaxes: taxesGrid,
        itemValueDifference: 0,
        itemTaxesTotal: taxesGrid.length === 0 ? 0 : taxesTotal,
        itemTotalTaxableFees: taxesGrid.length === 0 ? 0 : totalTaxableFees,
        itemTotal: taxesGrid.length === 0 ? netTotal : itemTotal,
        itemsDiscount:
          item.discountMode === "percent"
            ? (totalSalesAmount * item.discountValue) / 100
            : item.discountValue,
        itemGrandTotal: taxesGrid.length === 0 ? netTotal : grandTotal,
      };
    });
    const extraDiscountAbs = receiptDiscountValue;
    const doc = calcDocumentTotals(rows, extraDiscountAbs);
    return {
      subtotal: rows.reduce((s, r) => s + Number(r.itemTotalSalesAmount), 0),
      totalDiscount:
        rows.reduce((s, r) => s + Number(r.itemsDiscount), 0) +
        extraDiscountAbs,
      taxTotal: doc.totalTaxes,
      netPayable: doc.total,
    };
  }, [items, receiptDiscountValue, buildItemTaxes]);

  /**
   * Clear all items
   */
  const clear = useCallback(() => {
    setItems([]);
    setReceiptDiscountValue(0);
    setReceiptDiscountMode("amount");
  }, []);

  /**
   * Set items directly (useful for restoring held receipts)
   */
  const setItemsDirectly = useCallback((newItems: LineItem[]) => {
    setItems(newItems);
  }, []);

  /**
   * Set receipt discount mode
   */
  const setReceiptDiscountModeCallback = useCallback(
    (mode: "percent" | "amount") => {
      setReceiptDiscountMode(mode);
    },
    []
  );

  /**
   * Build receipt payload for API submission (simplified version)
   */
  const buildReceiptPayload = useCallback(
    (
      options: {
        customerId?: string;
        discountMode?: "percent" | "amount";
        discountValue?: number;
        isReturnMode?: boolean;
        referenceReceiptUuid?: string;
      } = {}
    ) => {
      // Build full rows like receiptSummary does
      const rows = items.map((item) => {
        const totalSalesAmount = calcTotalSalesAmount(
          item.unitPrice,
          item.quantity
        );
        const discountRatePercent =
          item.discountMode === "percent"
            ? item.discountValue
            : totalSalesAmount === 0
              ? 0
              : (item.discountValue / totalSalesAmount) * 100;
        const netTotal = calcNetTotal(totalSalesAmount, discountRatePercent);
        const taxesGrid = buildItemTaxes(item);
        const { taxesTotal, itemTotal } = calcTaxesAndItemTotal(
          netTotal,
          taxesGrid,
          0,
          0
        );

        return {
          id: item.id,
          itemCode: item.code,
          itemDescription: item.name,
          itemPrice: item.unitPrice,
          itemQty: item.quantity,
          itemTotalSalesAmount: totalSalesAmount,
          itemDiscountRate: discountRatePercent,
          itemAmount: totalSalesAmount,
          itemNetTotal: netTotal,
          itemTaxes: taxesGrid,
          itemValueDifference: 0,
          itemTaxesTotal: taxesGrid.length === 0 ? 0 : taxesTotal,
          itemTotalTaxableFees: 0,
          itemTotal: taxesGrid.length === 0 ? netTotal : itemTotal,
          itemsDiscount:
            item.discountMode === "percent"
              ? (totalSalesAmount * item.discountValue) / 100
              : item.discountValue,
          itemGrandTotal: itemTotal,
        };
      });

      const extraDiscountAbs = options.discountValue || receiptDiscountValue;
      const doc = calcDocumentTotals(rows, extraDiscountAbs);

      return {
        customerId: options.customerId,
        discountMode: options.discountMode || "percent",
        discountValue: options.discountValue || receiptDiscountValue,
        isReturnMode: options.isReturnMode || false,
        referenceReceiptUuid: options.referenceReceiptUuid,
        rows,
      };
    },
    [items, receiptDiscountValue, buildItemTaxes]
  );

  return {
    items,
    receiptDiscountValue,
    receiptDiscountMode,
    setReceiptDiscountValue,
    setReceiptDiscountMode: setReceiptDiscountModeCallback,
    setItems: setItemsDirectly,
    summary,
    addItem,
    updateQuantity,
    removeItem,
    updatePrice,
    updateItemTaxes,
    buildItemTaxes,
    recalcItem,
    buildReceiptPayload,
    clear,
  };
}
