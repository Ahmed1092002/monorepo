// components/ReturnPickerModal.tsx - Line-level return picker

import React, { useState, useEffect } from "react";
import {
  useCreateReceiptMutation,
  useCreateSubmitReceiptMutation,
  useGetReceiptByIdQuery,
} from "@monorepo/shared-api";
import { useGetProductByIdsQuery } from "@monorepo/shared-api";
import type { ReceiptLine, Receipt } from "@monorepo/shared-types";
import { toast } from "react-toastify";
import {
  calcTaxesAndItemTotal,
  convertLineTaxesToTaxesGrid,
} from "@monorepo/shared-utils";
import { useOfflineStatus } from "@monorepo/shared-utils";
import * as db from "@monorepo/shared-utils";
import { useTranslation } from "react-i18next";
import {
  Modal,
  ModalHeader,
  ModalContent,
  ModalFooter,
  Button,
  Input,
  Text,
} from "@monorepo/shared-ui";
// Simple price formatting function
const priceRangeHandle = (amount: number): number =>
  Math.round(amount * 100) / 100;

interface ReturnItem {
  id: string;
  name: string;
  code: string;
  maxQty: number;
  returnQty: number;
  unitPrice: number;
  originalLine: ReceiptLine;
}

interface ReturnPickerModalProps {
  onClose: () => void;
  receiptId: number;
}

const ReturnPickerModal: React.FC<ReturnPickerModalProps> = ({
  onClose,
  receiptId,
}) => {
  const { t } = useTranslation();
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // RWR specific fields that user can modify
  const [receiptNumber, setReceiptNumber] = useState("");
  const [issuanceDate, setIssuanceDate] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { isOffline } = useOfflineStatus();
  const pollingInterval = import.meta.env.VITE_POLLING_INTERVAL
    ? Number(import.meta.env.VITE_POLLING_INTERVAL)
    : 3600000;
  // Offline data state
  const [offlineReceipt, setOfflineReceipt] = useState<Receipt | null>(null);
  const [offlineProducts, setOfflineProducts] = useState<
    Array<{
      id: number;
      name: string;
      code: string;
      sellingPrice?: number;
      category?: string;
      imageUrl?: string;
    }>
  >([]);
  async function IncrementToLocalIndex() {
    const index = await db.get<number>("localIndex");
    let newIndex = index ?? 0;
    newIndex += 1;
    await db.set("localIndex", newIndex);
    return newIndex;
  }
  // Use the create receipt mutation
  const [createReceipt, { isLoading: isCreating }] = useCreateReceiptMutation();

  // Fetch receipt data by ID with caching and auto-refresh
  const {
    data: receipt,
    isLoading: isLoadingReceipt,
    error: receiptError,
    isFetching,
    refetch,
  } = useGetReceiptByIdQuery(receiptId, {
    pollingInterval: pollingInterval, // Poll every hour
    refetchOnFocus: true,
    refetchOnReconnect: true,
    skip: isOffline, // Skip API calls when offline
  });
  const [createSubmitReceipt] = useCreateSubmitReceiptMutation();

  // Extract product IDs from receipt lines
  const productIds =
    (isOffline ? offlineReceipt : receipt)?.receiptLines
      ?.map((line) => line.productId)
      .filter(Boolean) || [];

  // Manual refresh function
  const handleRefresh = async () => {
    if (isOffline) {
      toast.info(t("cannot_refresh_offline"));
      return;
    }

    setIsRefreshing(true);
    try {
      await Promise.all([
        refetch(), // Refresh receipt data
        productIds.length > 0 ? refetchProducts() : Promise.resolve(), // Refresh products if needed
      ]);
    } catch (error) {
      console.error("Failed to refresh data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Fetch product details by IDs
  const {
    data: products,
    isLoading: isLoadingProducts,
    error: productsError,
    refetch: refetchProducts,
  } = useGetProductByIdsQuery(
    { ids: productIds },
    { skip: productIds.length === 0 || isOffline }
  );

  // Cache API data when online
  useEffect(() => {
    if (!isOffline && receipt) {
      (async () => {
        await db.set(`receipt_${receiptId}`, receipt);
      })();
    }
  }, [receipt, isOffline, receiptId]);

  useEffect(() => {
    if (!isOffline && products) {
      (async () => {
        await db.set("productsData", products);
      })();
    }
  }, [products, isOffline]);

  // Load offline data when offline
  useEffect(() => {
    if (isOffline) {
      (async () => {
        const receiptData = await db.get<Receipt>(`receipt_${receiptId}`);
        if (receiptData) {
          setOfflineReceipt(receiptData);
        }

        const productsData =
          (await db.get<
            Array<{
              id: number;
              name: string;
              code: string;
              sellingPrice?: number;
              category?: string;
              imageUrl?: string;
            }>
          >("productsData")) || [];
        setOfflineProducts(productsData);
      })();
    }
  }, [isOffline, receiptId]);

  // Convert receipt lines to return items when receipt and products change
  useEffect(() => {
    const currentReceipt = isOffline ? offlineReceipt : receipt;
    const currentProducts = isOffline ? offlineProducts : products;

    if (currentReceipt?.receiptLines && currentProducts) {
      const items: ReturnItem[] = currentReceipt.receiptLines.map(
        (line: ReceiptLine) => {
          // Find the product details from the fetched products
          const product = currentProducts.find((p) => p.id === line.productId);

          return {
            id: line.id.toString(),
            name: product?.name || line.itemDescription || "Unknown Item",
            code: product?.code || line.productCode || "",
            maxQty: line.quantity,
            returnQty: 0,
            unitPrice: line.unitValue,
            originalLine: line,
          };
        }
      );
      setReturnItems(items);
    }
  }, [receipt, products, offlineReceipt, offlineProducts, isOffline]);

  // Initialize return receipt fields when receipt changes
  useEffect(() => {
    const currentReceipt = isOffline ? offlineReceipt : receipt;
    if (currentReceipt) {
      IncrementToLocalIndex().then((localIndex) => {
        setReceiptNumber(`R-${currentReceipt.receiptCode}-${localIndex}`);
      });
      // Set default receipt number (R- prefix + original receipt code)

      // Set default issuance date to be after the original receipt's dateTimeIssued
      const originalReceiptDate = new Date(currentReceipt.dateTimeIssued);

      // Always set return date to be at least 1 minute after the original receipt
      const defaultDate = new Date(originalReceiptDate.getTime() + 60000); // Add 1 minute

      // Convert to local time for datetime-local input (YYYY-MM-DDTHH:MM format)
      const year = defaultDate.getFullYear();
      const month = String(defaultDate.getMonth() + 1).padStart(2, "0");
      const day = String(defaultDate.getDate()).padStart(2, "0");
      const hours = String(defaultDate.getHours()).padStart(2, "0");
      const minutes = String(defaultDate.getMinutes()).padStart(2, "0");

      setIssuanceDate(`${year}-${month}-${day}T${hours}:${minutes}`);
    }
  }, [receipt, offlineReceipt, isOffline]);

  const updateReturnQty = (itemId: string, qty: number) => {
    setReturnItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          // Ensure quantity is between 0 and maxQty (original quantity)
          const clampedQty = Math.max(0, Math.min(qty, item.maxQty));

          // Log warning if user tried to exceed max quantity
          if (qty > item.maxQty) {
            console.warn(
              `Cannot return more than ${item.maxQty} units for item: ${item.name}`
            );
          }

          return {
            ...item,
            returnQty: clampedQty,
          };
        }
        return item;
      })
    );
  };

  const handleConfirm = async () => {
    const selectedItems = returnItems.filter((item) => item.returnQty > 0);

    if (selectedItems.length === 0) return;

    // Double-check that no item exceeds the maximum returnable quantity
    const invalidItems = selectedItems.filter(
      (item) => item.returnQty > item.maxQty
    );
    if (invalidItems.length > 0) {
      const itemNames = invalidItems.map((item) => item.name).join(", ");
      toast.error(
        `Cannot return more than the original quantity for: ${itemNames}`
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // Get the current receipt data (online or offline)
      const currentReceipt = isOffline ? offlineReceipt : receipt;

      if (!currentReceipt) {
        throw new Error(t("receipt_data_not_available"));
      }

      // Create receipt lines for the return with correct calculations
      const receiptLines = selectedItems.map((item) => {
        const originalLine = item.originalLine;
        const originalQty = originalLine.quantity;
        const returnQty = item.returnQty;

        // Calculate proportional amounts based on return quantity
        const discountRate = originalLine.commercialDiscountRate || 0;
        const discountedPrice =
          item.unitPrice - item.unitPrice * (discountRate / 100);
        const salesTotal = item.unitPrice * returnQty;
        const netTotal = discountedPrice * returnQty;

        // Convert LineTaxes to ITaxesGrid format for proper tax calculation
        const taxesGrid = convertLineTaxesToTaxesGrid(
          originalLine.lineTaxes || []
        );

        // Calculate proportional taxes using the proper tax calculation function
        const proportionalTaxes = taxesGrid.map((tax) => {
          let proportionalAmount = 0;

          if (tax.taxRate && tax.taxRate > 0) {
            // Rate-based tax: calculate percentage of net total
            proportionalAmount = (netTotal * tax.taxRate) / 100;
          } else if (tax.taxAmount && tax.taxAmount > 0) {
            // Amount-based tax: proportional to quantity
            proportionalAmount = (tax.taxAmount / originalQty) * returnQty;
          }

          return {
            id: tax.id || 0,
            receiptLineId: parseInt(item.id),
            lookupTaxableTypeId: tax.lookupTaxableTypeId || 0,
            amount: priceRangeHandle(proportionalAmount),
            lookupTaxableSubTypeId: tax.lookupTaxableSubTypeId || 0,
            rate: tax.taxRate || 0,
            typeCode: tax.typeCode || "",
            subTypeCode: tax.subTypeCode || "",
            enDescription: tax.enDescription || "",
          };
        });

        // Use the proper tax calculation function for accurate totals
        const taxCalculation = calcTaxesAndItemTotal(
          netTotal,
          taxesGrid,
          0, // valueDifference
          salesTotal - netTotal // rowDiscount
        );

        const totalTaxAmount = taxCalculation.taxesTotal;

        return {
          id: parseInt(item.id),
          receiptId: currentReceipt.id,
          productId: originalLine.productId,
          productCode: originalLine.productCode,
          itemDescription: item.name,
          quantity: returnQty,
          unitValue: item.unitPrice,
          weightUnitType: originalLine.weightUnitType,
          weightQuantity: originalLine.weightQuantity,
          unitTypeId: originalLine.unitTypeId,
          salesTotal: salesTotal,
          total: salesTotal,
          grandTotal: taxCalculation.grandTotal,
          taxAmount: totalTaxAmount,
          valueDifference: 0,
          totalTaxableFees: taxCalculation.totalTaxableFees,
          netTotal: netTotal,
          itemsDiscount: salesTotal - netTotal,
          currencySold: "EGP",
          amountEGP: item.unitPrice,
          amountSold: 0,
          currencyExchangeRate: 0,
          commercialDiscountRate: discountRate,
          commercialDiscountAmount: salesTotal - netTotal,
          itemsDiscountRate: discountRate,
          itemsDiscountAmount: salesTotal - netTotal,
          lineTaxes: proportionalTaxes,
        };
      });

      // Validate required fields
      if (
        !currentReceipt ||
        !currentReceipt.id ||
        !currentReceipt.customerId ||
        !currentReceipt.companyLocationId ||
        !currentReceipt.posId
      ) {
        throw new Error(t("missing_required_receipt_data_for_return"));
      }

      // Validate return fields
      if (!receiptNumber.trim()) {
        throw new Error(t("receipt_number_required"));
      }
      if (!issuanceDate) {
        throw new Error(t("issuance_date_required"));
      }

      // Validate that return date is not before original receipt date
      const returnDate = new Date(issuanceDate);
      const originalReceiptDate = new Date(currentReceipt.dateTimeIssued);

      // Convert both to UTC for accurate comparison
      const returnDateUTC = new Date(returnDate.toISOString());
      const originalReceiptUTC = new Date(originalReceiptDate.toISOString());

      if (returnDateUTC <= originalReceiptUTC) {
        throw new Error(t("return_date_must_be_after_original_receipt"));
      }
      const index = await IncrementToLocalIndex();
      const receiptCode = `R-${currentReceipt.receiptCode}-${index}`;

      // Create the return payload (R - Return with Reference)
      const payload = {
        // id: currentReceipt.id,
        customerId: currentReceipt.customerId,
        companyLocationId: currentReceipt.companyLocationId,
        posId: currentReceipt.posId,
        taxActivityCodeId: currentReceipt.taxActivityCodeId,
        dateTimeIssued: issuanceDate
          ? new Date(issuanceDate).toISOString()
          : new Date().toISOString(),
        receiptCode: receiptNumber || receiptCode,
        grossWeight: 0,
        netWeight: 0,
        feesAmount: 0,
        adjustment: 0,
        extraDiscount: 0,
        receiptType: "R" as const,
        typeVersion: "1.2",
        paymentMethod: currentReceipt.paymentMethod || "CASH",
        buyerPaymentNumber: "",
        receiptLines: receiptLines,
        salesIssuedDateTime: currentReceipt.dateTimeIssued,
        reference: currentReceipt.uuid, // Required for R type
      };
      if (isOffline) {
        // Save return receipt to IndexedDB for later sync
        const offlineReturnReceipt = payload;
        (async () => {
          const savedReceipts =
            (await db.get<unknown[]>("offlineReceipts")) || [];
          savedReceipts.push(offlineReturnReceipt);
          await db.set("offlineReceipts", savedReceipts);
        })();
        toast.success(t("receipt_saved_for_sync"));
        setIsSubmitting(false);
        onClose();
        return;
      }
      // Create the return receipt
      const result = await createReceipt(payload).unwrap();
      const body = {
        ids: [+result?.id],
      };
      await createSubmitReceipt(body).unwrap();

      toast.success(
        t("return_receipt_created_successfully", { receiptNumber })
      );
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate return amounts similar to the original functions
  const getReturnNetTotal = () => {
    let netTotal = 0;
    for (const item of returnItems) {
      if (item.returnQty > 0) {
        const originalLine = item.originalLine;
        const discountRate = originalLine.commercialDiscountRate || 0;
        const discountedPrice =
          item.unitPrice - item.unitPrice * (discountRate / 100);
        netTotal += discountedPrice * item.returnQty;
      }
    }
    return netTotal;
  };

  const getReturnTotalSales = () => {
    let totalSales = 0;
    for (const item of returnItems) {
      if (item.returnQty > 0) {
        totalSales += item.unitPrice * item.returnQty;
      }
    }
    return totalSales;
  };

  const getReturnTaxesTotal = () => {
    let taxesTotal = 0;
    for (const item of returnItems) {
      if (item.returnQty > 0) {
        const originalLine = item.originalLine;
        const returnQty = item.returnQty;

        // Calculate proportional amounts
        const discountRate = originalLine.commercialDiscountRate || 0;
        const discountedPrice =
          item.unitPrice - item.unitPrice * (discountRate / 100);
        const netTotal = discountedPrice * returnQty;
        const salesTotal = item.unitPrice * returnQty;

        // Convert LineTaxes to ITaxesGrid format for proper tax calculation
        const taxesGrid = convertLineTaxesToTaxesGrid(
          originalLine.lineTaxes || []
        );

        // Use the proper tax calculation function
        const taxCalculation = calcTaxesAndItemTotal(
          netTotal,
          taxesGrid,
          0, // valueDifference
          salesTotal - netTotal // rowDiscount
        );

        taxesTotal += taxCalculation.taxesTotal;
      }
    }
    return taxesTotal;
  };

  const getReturnTotalPayable = (extraDiscount: number = 0) => {
    const netTotal = getReturnNetTotal();
    const taxesTotal = getReturnTaxesTotal();
    return netTotal - extraDiscount + taxesTotal;
  };

  // Use the calculated amounts
  const totalReturnAmount = getReturnTotalPayable();
  const returnNetTotal = getReturnNetTotal();
  const returnTotalSales = getReturnTotalSales();
  const returnTaxesTotal = getReturnTaxesTotal();

  const hasSelectedItems = returnItems.some((item) => item.returnQty > 0);

  // Check if receipt is eligible for return
  const isReceiptEligibleForReturn = true;
  // receipt &&
  // receipt.status !== "cancelled" &&
  // receipt.receiptType !== "R" && // Not already a return
  // receipt.receiptLines &&
  // receipt.receiptLines.length > 0;

  return (
    <Modal isOpen={true} onClose={onClose} size="7xl">
      <ModalHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-blue-600">🔄</span>
            <div>
              <div className="flex items-center space-x-2">
                <Text variant="h3" color="dark" weight="semibold">
                  {t("return_item_picker")}
                </Text>
                {isFetching && !isLoadingReceipt && (
                  <div
                    className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"
                    title={t("auto_refreshing_data")}
                  />
                )}
              </div>
              {receipt && (
                <div className="flex items-center space-x-4 mt-1">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-600">
                    {t("receipt")}: {receipt.receiptCode}
                  </span>
                  <Text variant="small" color="secondary">
                    {t("date")}:{" "}
                    {new Date(receipt.dateTimeIssued).toLocaleDateString()}
                  </Text>
                </div>
              )}
              {isLoadingReceipt && (
                <div className="flex items-center space-x-2 mt-1">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  <Text variant="small" color="secondary">
                    {t("loading_receipt_details")}
                  </Text>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing || isLoadingReceipt}
              isLoading={isRefreshing || isLoadingReceipt}
              leftIcon={<span>🔄</span>}
            >
              {t("refresh_data")}
            </Button>
          </div>
        </div>
      </ModalHeader>

      <ModalContent scrollable>
        {/* Instructions */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          {isOffline && (
            <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 rounded-lg">
              <Text variant="small" color="warning">
                🔌 {t("working_offline_return_saved_for_sync")}
              </Text>
            </div>
          )}
          <div className="flex items-start space-x-4">
            <span className="text-blue-600">🔄</span>
            <div>
              <Text
                variant="small"
                color="primary"
                weight="semibold"
                className="mb-2 flex items-center"
              >
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                {t("return_processing_instructions")}
              </Text>
              <Text variant="small" color="warning">
                {t("return_instructions_message")}
              </Text>
            </div>
          </div>
        </div>

        {/* Return Receipt Fields */}
        {(receipt || offlineReceipt) && (
          <div className="space-y-6">
            <Text variant="small" color="dark" weight="medium">
              {t("return_receipt_details")}
            </Text>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                type="text"
                value={receiptNumber}
                onChange={(e) => setReceiptNumber(e.target.value)}
                label={`${t("receipt_number")} *`}
                placeholder={t("enter_receipt_number")}
                error={
                  !receiptNumber.trim()
                    ? t("receipt_number_required")
                    : undefined
                }
                helperText={t("default_receipt_number", {
                  code: (isOffline ? offlineReceipt : receipt)?.receiptCode,
                })}
                fullWidth
                required
              />
              <Input
                type="datetime-local"
                value={issuanceDate}
                onChange={(e) => setIssuanceDate(e.target.value)}
                min={
                  receipt
                    ? (() => {
                        const minDate = new Date(
                          new Date(receipt.dateTimeIssued).getTime() + 60000
                        );
                        const year = minDate.getFullYear();
                        const month = String(minDate.getMonth() + 1).padStart(
                          2,
                          "0"
                        );
                        const day = String(minDate.getDate()).padStart(2, "0");
                        const hours = String(minDate.getHours()).padStart(
                          2,
                          "0"
                        );
                        const minutes = String(minDate.getMinutes()).padStart(
                          2,
                          "0"
                        );
                        return `${year}-${month}-${day}T${hours}:${minutes}`;
                      })()
                    : undefined
                }
                label={`${t("issuance_date")} *`}
                error={!issuanceDate ? t("issuance_date_required") : undefined}
                helperText={t("issuance_date_description")}
                fullWidth
                required
              />
            </div>
            {receipt && (
              <Text variant="small" color="primary">
                {t("return_date_must_be_after")}:{" "}
                {new Date(receipt.dateTimeIssued).toLocaleString()}
              </Text>
            )}
            {/* Items List */}
            {(isLoadingReceipt || isLoadingProducts) && !isOffline ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <Text variant="small" color="secondary">
                  {t("loading_receipt_data")}
                </Text>
                {isLoadingProducts && (
                  <Text variant="small" color="secondary" className="mt-2">
                    {t("loading_product_details")}
                  </Text>
                )}
              </div>
            ) : (receiptError || productsError) && !isOffline ? (
              <div className="text-center py-12">
                <span className="text-6xl mb-4 block">📦</span>
                <Text variant="small" color="error">
                  {t("error_loading_data")}
                </Text>
                <Text variant="small" color="secondary" className="mt-2">
                  {receiptError
                    ? t("failed_to_load_receipt")
                    : t("failed_to_load_product_details")}
                </Text>
                <Text variant="small" color="secondary">
                  {t("try_again_later")}
                </Text>
              </div>
            ) : !receipt && !offlineReceipt ? (
              <div className="text-center py-12">
                <span className="text-6xl mb-4 block">📦</span>
                <Text variant="small" color="secondary">
                  {isOffline
                    ? t("no_cached_receipt_found")
                    : t("receipt_not_found")}
                </Text>
                <Text variant="small" color="secondary" className="mt-2">
                  {isOffline
                    ? t("receipt_not_available_in_cache")
                    : t("requested_receipt_not_found")}
                </Text>
              </div>
            ) : !products && !offlineProducts && !isOffline ? (
              <div className="text-center py-12">
                <span className="text-6xl mb-4 block">📦</span>
                <Text variant="small" color="secondary">
                  {t("product_details_not_available")}
                </Text>
                <Text variant="small" color="secondary" className="mt-2">
                  {t("unable_to_load_product_information")}
                </Text>
              </div>
            ) : isSubmitting || isCreating ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <Text variant="small" color="secondary">
                  {t("creating_return_receipt")}
                </Text>
                <Text variant="small" color="secondary" className="mt-2">
                  {t("processing_return_message")}
                </Text>
              </div>
            ) : !isReceiptEligibleForReturn ? (
              <div className="text-center py-12">
                <span className="text-6xl mb-4 block">📦</span>
                <Text variant="small" color="error">
                  {t("receipt_not_eligible_for_return")}
                </Text>
                <Text variant="small" color="secondary" className="mt-2">
                  {(isOffline ? offlineReceipt : receipt)?.status ===
                  "cancelled"
                    ? t("receipt_cancelled")
                    : (isOffline ? offlineReceipt : receipt)?.receiptType ===
                        "R"
                      ? t("already_return_receipt")
                      : t("no_items_to_return")}
                </Text>
              </div>
            ) : returnItems.length === 0 ? (
              <div className="text-center py-12">
                <span className="text-6xl mb-4 block">📦</span>
                <Text variant="small" color="secondary">
                  {t("no_items_available_for_return")}
                </Text>
                <Text variant="small" color="secondary" className="mt-2">
                  {t("no_items_to_return")}
                </Text>
              </div>
            ) : (
              <div className="space-y-4">
                {returnItems.map((item) => (
                  <div
                    key={item.id}
                    className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <Text
                          variant="small"
                          color="dark"
                          weight="medium"
                          className="mb-1"
                        >
                          {item.name}
                        </Text>
                        <Text
                          variant="small"
                          color="secondary"
                          className="mb-2"
                        >
                          {t("code")}: {item.code} | {t("price")}:{" "}
                          {item.unitPrice} {t("egp")}
                        </Text>
                        <div className="flex items-center space-x-4">
                          <Text variant="small" color="secondary">
                            {t("available")}: {item.maxQty} {t("units")}
                          </Text>
                          <span>•</span>
                          <Text variant="small" color="secondary">
                            {t("original_qty")}: {item.originalLine.quantity}
                          </Text>
                          {item.originalLine.lineTaxes?.[0] && (
                            <>
                              <span>•</span>
                              <Text variant="small" color="secondary">
                                {t("tax")}:{" "}
                                {item.originalLine.lineTaxes[0].rate}%
                              </Text>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <Text
                            variant="small"
                            color="secondary"
                            className="mb-1"
                          >
                            {t("return_qty")}
                          </Text>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                updateReturnQty(item.id, item.returnQty - 1)
                              }
                              disabled={item.returnQty <= 0}
                            >
                              -
                            </Button>
                            <div className="flex flex-col">
                              <Input
                                type="number"
                                value={item.returnQty}
                                onChange={(e) => {
                                  const inputValue =
                                    parseInt(e.target.value) || 0;
                                  updateReturnQty(item.id, inputValue);
                                }}
                                className={`w-16 text-center ${
                                  item.returnQty > item.maxQty
                                    ? "border-red-500 bg-red-50"
                                    : ""
                                }`}
                                min="0"
                                max={item.maxQty}
                                title={`${t("max")}: ${item.maxQty} ${t(
                                  "units"
                                )}`}
                              />
                              {item.returnQty > item.maxQty && (
                                <Text
                                  variant="small"
                                  color="error"
                                  className="mt-1 text-center"
                                >
                                  {t("max")}: {item.maxQty}
                                </Text>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                updateReturnQty(item.id, item.returnQty + 1)
                              }
                              disabled={item.returnQty >= item.maxQty}
                            >
                              +
                            </Button>
                          </div>
                        </div>

                        <div className="text-right">
                          <Text
                            variant="small"
                            color="secondary"
                            className="mb-1"
                          >
                            {t("return_amount")}
                          </Text>
                          <Text
                            variant="small"
                            color="primary"
                            weight="semibold"
                          >
                            {(item.returnQty * item.unitPrice).toFixed(2)}{" "}
                            {t("egp")}
                          </Text>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {/* Summary */}
            {hasSelectedItems && (
              <div className="mt-6 p-4 border-t border-gray-200 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <Text variant="small" color="dark" weight="medium">
                      {t("return_summary")}
                    </Text>
                    <Text variant="small" color="secondary" className="mt-1">
                      {t("items_selected_for_return", {
                        count: returnItems.filter((item) => item.returnQty > 0)
                          .length,
                      })}
                    </Text>
                    <Text variant="small" color="secondary">
                      {t("original_receipt")}:{" "}
                      {(isOffline ? offlineReceipt : receipt)?.receiptCode} |{" "}
                      {t("total_items")}:{" "}
                      {(isOffline ? offlineReceipt : receipt)?.receiptLines
                        ?.length || 0}
                    </Text>
                  </div>
                  <div className="text-right">
                    <div className="space-y-1">
                      <Text variant="small" color="secondary">
                        {t("sales_total")}: {returnTotalSales.toFixed(2)}{" "}
                        {t("egp")}
                      </Text>
                      <Text variant="small" color="secondary">
                        {t("net_total")}: {returnNetTotal.toFixed(2)} {t("egp")}
                      </Text>
                      <Text variant="small" color="secondary">
                        {t("taxes")}: {returnTaxesTotal.toFixed(2)} {t("egp")}
                      </Text>
                      <Text
                        variant="small"
                        color="primary"
                        weight="semibold"
                        className="border-t pt-1"
                      >
                        {t("total_refund")}: {totalReturnAmount.toFixed(2)}{" "}
                        {t("egp")}
                      </Text>
                    </div>
                    <Text variant="small" color="secondary" className="mt-2">
                      {returnItems.reduce(
                        (sum, item) => sum + item.returnQty,
                        0
                      )}{" "}
                      {t("units_to_return")}
                    </Text>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </ModalContent>

      <ModalFooter>
        <div className="flex items-center justify-between">
          <Text variant="small" color="secondary">
            {hasSelectedItems
              ? t("items_selected_for_return", {
                  count: returnItems.filter((item) => item.returnQty > 0)
                    .length,
                })
              : t("no_items_selected_for_return")}
          </Text>
          <div className="flex space-x-3">
            <Button variant="secondary" onClick={onClose}>
              {t("cancel")}
            </Button>
            {isReceiptEligibleForReturn && (
              <Button
                variant="primary"
                onClick={handleConfirm}
                disabled={!hasSelectedItems || isSubmitting || isCreating}
                isLoading={isSubmitting || isCreating}
              >
                {isSubmitting || isCreating
                  ? t("creating_return")
                  : t("confirm_return")}
              </Button>
            )}
          </div>
        </div>
      </ModalFooter>
    </Modal>
  );
};

export default ReturnPickerModal;
