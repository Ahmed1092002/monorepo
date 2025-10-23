import React, { useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import * as db from "@monorepo/shared-utils";
import type { LineItem, ITaxesGrid } from "@monorepo/shared-types";
import {
  calcTaxesAndItemTotal,
  calcDocumentTotals,
  calcTotalSalesAmount,
  calcNetTotal,
} from "@monorepo/shared-utils";
import SidebarNav from "../components/ui/pos/SidebarNav";
import BrowseItems from "../components/ui/pos/BrowseItems";
import ReceiptItemsList from "../components/ui/pos/ReceiptItemsList";
import OrderSummary from "../components/ui/pos/OrderSummary";
// CompactFooter removed in favor of actions within OrderSummary
import DeleteConfirmModal from "../components/ui/modal/DeleteConfirmModal";
import TaxDetailsModal from "../components/ui/modal/TaxDetailsModal";
import ItemSearchModal from "../components/ui/modal/ItemSearchModal";
import CustomerSearchModal from "../components/ui/modal/CustomerSearchModal";
import ReceiptSearchModal from "../components/ui/modal/ReceiptSearchModal";
import ReturnPickerModal from "../components/ui/modal/ReturnPickerModal";
import QuickCustomerModal from "../components/ui/modal/QuickCustomerModal";
import PaymentSidebar from "../components/ui/modal/PaymentSidebar";
import PrintReceiptModal from "../components/ui/modal/PrintReceiptModal";
import {
  useCreateReceiptMutation,
  useCreateSubmitReceiptMutation,
  useCreateReceiptRangeMutation,
} from "@monorepo/shared-api";
import {
  useCreateCustomerMutation,
  useGetCustomerDefaultQuery,
} from "@monorepo/shared-api";
import {
  useCloseShiftPOSMutation,
  useGetCompaniesLocationsByCompanyIdQuery,
} from "@monorepo/shared-api";
import { clearSubscription } from "../store/features/subscriptionSlice";
import { useAppSelector } from "../store/hooks";
import { useKeycloak } from "@react-keycloak/web";
import { toast } from "react-toastify";
import type { Product } from "@monorepo/shared-types";
import type { Receipt } from "@monorepo/shared-types";
import type { HeldReceipt } from "@monorepo/shared-types";
import type { CreateCustomerResponse } from "@monorepo/shared-types";
import type { CompanyLocationByCompanyId } from "@monorepo/shared-types";
import { useOfflineStatus } from "@monorepo/shared-utils";
import HeldReceiptsModal from "../components/ui/modal/HeldReceiptsModal";
import LogoutModal from "../components/ui/modal/LogoutModal";
import { useTranslation } from "react-i18next";

// type OfflineReceipt = {
//   id: number;
//   items: LineItem[];
//   discountMode: "percent" | "amount";
//   discountValue: number;
//   isReturnMode: boolean;
//   referenceReceiptUuid?: string;
//   timestamp: string;
//   status: string;
// };

const POSPage: React.FC = () => {
  // Hooks
  const dispatch = useDispatch();
  const { keycloak } = useKeycloak();
  const { t } = useTranslation();
  const { currentShift } = useAppSelector((state) => state.subscription);
  const [closeShiftPOS] = useCloseShiftPOSMutation();

  // State management
  const [items, setItems] = useState<LineItem[]>([]);
  const [barcodeInput, setBarcodeInput] = useState("");
  const { isOffline, isOnline } = useOfflineStatus();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const [receiptDiscountMode, setReceiptDiscountMode] = useState<
    "percent" | "amount"
  >("amount");
  const [receiptDiscountValue, setReceiptDiscountValue] = useState(0);
  const [isReturnMode, setIsReturnMode] = useState(false);
  const [referenceReceiptUuid, setReferenceReceiptUuid] = useState<string>();
  const [createSubmitReceipt] = useCreateSubmitReceiptMutation();
  const [createReceiptRange] = useCreateReceiptRangeMutation();
  const [isBrowseItemsExpanded, setIsBrowseItemsExpanded] = useState(true);
  const [showItemSearch, setShowItemSearch] = useState(false);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [showReceiptSearch, setShowReceiptSearch] = useState(false);
  const [showReturnPicker, setShowReturnPicker] = useState(false);
  const [showCreateCustomer, setShowCreateCustomer] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showHeldReceipts, setShowHeldReceipts] = useState(false);
  const [, setLocalIndex] = useState(0);
  const [createReceipt, { isLoading: isCreatingReceipt }] =
    useCreateReceiptMutation();
  const [createCustomer, { isLoading: isCreatingCustomer }] =
    useCreateCustomerMutation();
  const [receiptData, setReceiptData] = useState<Receipt | undefined>(
    undefined
  );

  // Offline data state
  const [offlineDefaultCustomer, setOfflineDefaultCustomer] =
    useState<CreateCustomerResponse | null>(null);
  const [offlineCompanyLocationDetails, setOfflineCompanyLocationDetails] =
    useState<CompanyLocationByCompanyId | null>(null);

  // Fetch default customer to be used when none is selected
  const { data: defaultCustomerData } = useGetCustomerDefaultQuery(undefined, {
    skip: isOffline,
  });
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printData, setPrintData] = useState<{
    receiptCode: string;
    dateTimeIssued: string;
    paymentMethodLabel: string;
    subtotal: number;
    taxTotal: number;
    discountTotal: number;
    netPayable: number;
    items: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      lineTotal: number;
    }>;
    receiptId?: number;
  } | null>(null);
  async function IncrementToLocalIndex() {
    const index = await db.get<number>("localIndex");
    let newIndex = index ?? 0;
    newIndex += 1;
    setLocalIndex(newIndex);
    await db.set("localIndex", newIndex);
    return newIndex;
  }

  // Load selected POS data from localStorage if available
  const [selectedPOSDataLS, setSelectedPOSDataLS] = useState<null | {
    id?: number;
    companyLocationId?: number;
    serialNumber?: string;
  }>(null);

  useEffect(() => {
    (async () => {
      try {
        const parsed = await db.get<{
          id?: number;
          companyLocationId?: number;
          serialNumber?: string;
        }>("selectedPOSData");
        if (parsed && typeof parsed === "object") {
          setSelectedPOSDataLS({
            id: parsed.id,
            companyLocationId: parsed.companyLocationId,
            serialNumber: parsed.serialNumber,
          });
        }
      } catch {
        // no-op
      }
    })();
  }, []);

  // Cache default customer data when online
  useEffect(() => {
    if (!isOffline && defaultCustomerData) {
      (async () => {
        await db.set("defaultCustomerData", defaultCustomerData);
      })();
    }
  }, [defaultCustomerData, isOffline]);

  // Load tax activity codes for the selected company location (branch) and pick default
  const selectedCompanyLocationId = selectedPOSDataLS?.companyLocationId;
  const { data: companyLocationDetails } =
    useGetCompaniesLocationsByCompanyIdQuery(
      String(selectedCompanyLocationId ?? ""),
      {
        skip: !selectedCompanyLocationId || isOffline,
      }
    );

  // Cache company location details when online
  useEffect(() => {
    if (!isOffline && companyLocationDetails) {
      (async () => {
        await db.set("companyLocationDetails", companyLocationDetails);
      })();
    }
  }, [companyLocationDetails, isOffline]);

  // Load offline data when going offline
  useEffect(() => {
    if (isOffline) {
      (async () => {
        const cachedDefaultCustomer = await db.get("defaultCustomerData");
        const cachedCompanyLocationDetails = await db.get(
          "companyLocationDetails"
        );

        if (
          cachedDefaultCustomer &&
          Object.keys(cachedDefaultCustomer).length > 0
        ) {
          setOfflineDefaultCustomer(
            cachedDefaultCustomer as CreateCustomerResponse
          );
        }
        if (
          cachedCompanyLocationDetails &&
          Object.keys(cachedCompanyLocationDetails).length > 0
        ) {
          setOfflineCompanyLocationDetails(
            cachedCompanyLocationDetails as CompanyLocationByCompanyId
          );
        }
      })();
    } else {
      // Clear offline data when going online
      setOfflineDefaultCustomer(null);
      setOfflineCompanyLocationDetails(null);
    }
  }, [isOffline]);

  // Track currently selected/created customer to be used in receipts
  const [selectedCustomer, setSelectedCustomer] = useState<{
    id: number;
    fullName: string;
  } | null>(null);

  // Use online or offline data for company location details
  const effectiveCompanyLocationDetails = isOffline
    ? offlineCompanyLocationDetails
    : companyLocationDetails;

  const defaultTaxActivityCodeId =
    effectiveCompanyLocationDetails?.taxActivityCodes?.find(
      (t: { isDefault: boolean }) => t.isDefault
    )?.id;

  // Small helper to extract ETA code (e.g., "T1" from "T1 (VAT)")
  const extractEtaCode = (type?: string) => (type ? type.split(" (")[0] : "");

  const buildReceiptPayload = async (payment: {
    method: "cash" | "card";
    paidAmount: number;
    buyerPaymentNumber?: string;
  }) => {
    const randomNegativeId = () => -Math.floor(1 + Math.random() * 1000000000);
    // Build lines data from current items using the same logic as summary
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
        productId: item.productId ?? 0,
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

    const issuedAtEta = new Date().toISOString().slice(0, 16);
    // const effectivePOS = selectedPOSDataLS ;
    const posId = selectedPOSDataLS?.id ?? 0;
    const serialNumber = selectedPOSDataLS?.serialNumber ?? 0;
    const companyLocationId = selectedPOSDataLS?.companyLocationId ?? 0;

    const receiptLines = rows.map((r) => ({
      id: randomNegativeId(),
      productId: r.productId ?? 0,
      itemDescription: r.itemDescription,
      quantity: r.itemQty,
      unitValue: r.itemPrice,
      weightUnitType: null,
      weightQuantity: null,
      unitTypeId: items.find((it) => it.id === String(r.id))?.unitTypeId ?? 15,
      salesTotal: r.itemTotalSalesAmount,
      total: r.itemGrandTotal,
      valueDifference: r.itemValueDifference,
      netTotal: r.itemNetTotal,
      itemsDiscount: r.itemsDiscount,
      currencySold: "EGP",
      amountEGP: r.itemPrice,
      amountSold: 0,
      currencyExchangeRate: 0,
      commercialDiscountRate: 0,
      lineTaxes: (r.itemTaxes || []).map((t) => ({
        lookupTaxableTypeId: Number(t.taxTypeId || 0),
        amount: Number(t.taxAmount || 0),
        lookupTaxableSubTypeId: Number(t.taxSubtypeId || 0),
        rate:
          t.taxRate === undefined || t.taxRate === null
            ? null
            : Number(t.taxRate),
        typeCode: extractEtaCode(t.taxType) || "",
        subTypeCode: t.subtypeCode || "",
        enDescription: t.taxType || "",
      })),
    }));
    const localIndex = await IncrementToLocalIndex();
    const timestamp = Date.now();
    const date = new Date(timestamp);
    // Use online or offline default customer data
    const effectiveDefaultCustomer = isOffline
      ? offlineDefaultCustomer
      : defaultCustomerData;

    const payload = {
      customerId: selectedCustomer?.id ?? effectiveDefaultCustomer?.id ?? 0,
      companyLocationId,
      posId,
      taxActivityCodeId: Number(defaultTaxActivityCodeId),
      // reference: "",
      dateTimeIssued: issuedAtEta,
      receiptCode: `POS-${serialNumber}-${date.toISOString()}-${currentShift?.id.toString()}-${localIndex.toString()}`,
      // sOrderNameCode: "",
      // orderdeliveryMode: "FC",
      grossWeight: 0,
      netWeight: 0,
      feesAmount: 0,
      adjustment: 0,
      extraDiscount: Number(extraDiscountAbs) || 0,
      // contractorName: "",
      // contractorAmount: 0,
      // contractorRate: 0,
      // beneficiaryAmount: 0,
      // beneficiaryRate: 0,
      receiptType: isReturnMode ? "R" : "S",
      typeVersion: "1.2",
      paymentMethod: payment.method === "cash" ? "C" : "CC",
      // syndicateLicenseNumber: "",
      buyerPaymentNumber: payment.buyerPaymentNumber || "",
      // documentUseReason: "I",
      receiptLines,
    } as const;

    return payload;
  };
  const [showTaxModal, setShowTaxModal] = useState(false);
  const [selectedItemForTax, setSelectedItemForTax] = useState<LineItem | null>(
    null
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [supervisorPassword, setSupervisorPassword] = useState("");
  // Refs
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Helper: build taxes grid from line item
  // Prefer explicit editing taxes; otherwise fall back to displayOnlyTaxes
  const buildItemTaxes = (item: LineItem) => {
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
  };

  // Recalculate a single item using ETA calc
  const recalcItem = (item: LineItem): LineItem => {
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
  };

  // Calculate receipt summary via ETA document totals
  const receiptSummary = (() => {
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
  })();

  // Auto-focus barcode input
  useEffect(() => {
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, []);

  const addItem = (quantity: number = 1, productData: Product) => {
    const existingItem = items.find((i) => i.code === productData.code);

    if (existingItem) {
      setItems((prev) =>
        prev.map((i) => {
          if (i.code !== productData.code) return i;
          const updated = recalcItem({
            ...i,
            quantity: i.quantity + quantity,
          });
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
    }

    toast.success(`${productData.name} ${t("product_added_to_receipt")}`);
  };

  // Update item quantity
  const updateQuantity = (itemId: string, newQuantity: number) => {
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
  };

  // Show delete confirmation popup
  const showDeleteConfirmation = (itemId: string) => {
    setItemToDelete(itemId);
    setShowDeleteConfirm(true);
    setSupervisorPassword("");
  };

  // Remove item after supervisor confirmation
  const removeItem = (itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
    setShowDeleteConfirm(false);
    setItemToDelete(null);
    setSupervisorPassword("");

    toast.success(t("item_removed_successfully"));
  };

  // Handle supervisor password confirmation
  const handleDeleteConfirm = () => {
    // In a real app, you'd validate against a supervisor password
    // For demo purposes, we'll accept "supervisor" as the password
    if (supervisorPassword === t("supervisor")) {
      if (itemToDelete) {
        removeItem(itemToDelete);
      }
    } else {
      toast.error(t("supervisor_password_incorrect"));
    }
  };

  // Update item price
  const updatePrice = (itemId: string, newPrice: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const updatedItem = recalcItem({ ...item, unitPrice: newPrice });
          return updatedItem;
        }
        return item;
      })
    );
  };

  // Open tax details modal
  const openTaxModal = (item: LineItem) => {
    // Compute total tax based on product price (unitPrice * quantity)
    const activeTaxes = buildItemTaxes(item);
    const baseAmount = Number(item.unitPrice) * Number(item.quantity);
    const totalByPrice = (activeTaxes || []).reduce((sum, t) => {
      const rate = t.taxRate;
      const amount = t.taxAmount;
      if (rate !== undefined && rate !== null) {
        return sum + (Number(rate) * baseAmount) / 100;
      }
      // amount-only taxes should be scaled by quantity
      return sum + (Number(amount) || 0);
    }, 0);

    const itemWithComputedTax: LineItem = {
      ...item,
      tax: { ...item.tax, amount: totalByPrice },
    };
    setSelectedItemForTax(itemWithComputedTax);
    setShowTaxModal(true);
  };

  // Handle tax details update (multi taxes)
  const handleTaxUpdate = (updatedTaxes: ITaxesGrid[]) => {
    if (!selectedItemForTax) return;

    setItems((prev) =>
      prev.map((item) => {
        if (item.id === selectedItemForTax.id) {
          // Merge existing product/display taxes with newly added manual taxes
          const baseDisplay = (item.displayOnlyTaxes || []).map((t) => {
            const isAmountOnly = t.taxRate === undefined || t.taxRate === null;
            return {
              ...t,
              taxAmount: isAmountOnly
                ? (Number(t.taxAmount) || 0) * Number(item.quantity)
                : t.taxAmount,
            } as ITaxesGrid;
          });
          const mergedTaxes: ITaxesGrid[] = [...baseDisplay, ...updatedTaxes];

          const updatedItemBase: LineItem = {
            ...item,
            itemTaxes: mergedTaxes,
            // Keep displayOnlyTaxes for reference only
            displayOnlyTaxes: item.displayOnlyTaxes,
          };
          // recalc using ETA with updated multi taxes
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
          const netTotal = calcNetTotal(totalSalesAmount, discountRatePercent);
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

    setShowTaxModal(false);
    setSelectedItemForTax(null);
  };

  // Handle receipt selection for return
  const handleReceiptSelect = (receipt: Receipt) => {
    setShowReceiptSearch(false);
    setShowReturnPicker(true);
    setReceiptData(receipt);
    // In a real app, you'd load the receipt items here
  };

  // Handle return picker confirmation - currently handled inside ReturnPickerModal via API

  // Action handlers
  const handleCancel = () => {
    setItems([]);
    setIsReturnMode(false);
    setReferenceReceiptUuid(undefined);
    setReceiptDiscountValue(0);
    toast.info(t("current_receipt_cleared"));
  };

  const handleHold = async () => {
    if (items.length === 0) {
      toast.warning(t("please_add_items_before_holding"));
      return;
    }
    const localIndex = await IncrementToLocalIndex();
    try {
      const timestamp = Date.now();
      const date = new Date(timestamp);
      const heldReceipt: HeldReceipt = {
        id: `held_${date.toISOString()}+${currentShift?.id.toString()}+${localIndex.toString()}`,
        items: [...items],
        receiptDiscountMode,
        receiptDiscountValue,
        isReturnMode,
        referenceReceiptUuid,
        selectedCustomer,
        timestamp: new Date().toISOString(),
        receiptCode: `HOLD-${date.toISOString()}-${currentShift?.id.toString()}-${localIndex.toString()}`,
        totalAmount: receiptSummary.netPayable,
      };

      const existingHeldReceipts =
        (await db.get<HeldReceipt[]>("heldReceipts")) || [];
      existingHeldReceipts.push(heldReceipt);
      await db.set("heldReceipts", existingHeldReceipts);

      // Clear current receipt
      setItems([]);
      setReceiptDiscountValue(0);
      setIsReturnMode(false);
      setReferenceReceiptUuid(undefined);
      setSelectedCustomer(null);

      toast.success(t("receipt_saved_for_processing"));
    } catch (error) {
      console.error("Error holding receipt:", error);
      toast.error(t("failed_to_save_receipt"));
    }
  };
  const handleRestoreReceipt = (heldReceipt: HeldReceipt) => {
    setItems(heldReceipt.items);
    setReceiptDiscountMode(heldReceipt.receiptDiscountMode);
    setReceiptDiscountValue(heldReceipt.receiptDiscountValue);
    setIsReturnMode(heldReceipt.isReturnMode);
    setReferenceReceiptUuid(heldReceipt.referenceReceiptUuid);
    setSelectedCustomer(heldReceipt.selectedCustomer || null);
    setShowHeldReceipts(false);
    toast.success(t("receipt_restored_successfully"));
  };

  const handlePayAndSubmit = () => {
    if (items.length === 0) {
      toast.warning(t("please_add_items_before_submitting"));
      return;
    }

    // if (isOffline) {
    //   // Save receipt to localStorage for later sync
    //   const offlineReceipt = {
    //     id: Date.now(),
    //     items: items,
    //     discountMode: receiptDiscountMode,
    //     discountValue: receiptDiscountValue,
    //     isReturnMode: isReturnMode,
    //     referenceReceiptUuid: referenceReceiptUuid,
    //     timestamp: new Date().toISOString(),
    //     status: "pending_sync",
    //   };

    //   (async () => {
    //     const savedReceipts =
    //       (await db.get<OfflineReceipt[]>("offlineReceipts")) || [];
    //     savedReceipts.push(offlineReceipt);
    //     await db.set("offlineReceipts", savedReceipts);
    //   })();

    //   toast.success(
    //     isReturnMode ? "Refund saved for sync" : "Receipt saved for sync"
    //   );
    // } else {
    //   // Simulate ETA submission
    //   toast.success(isReturnMode ? "Refund Submitted" : "Receipt Submitted");
    // }

    // Clear receipt after successful submission
    // setTimeout(() => {
    //   handleCancel();
    // }, 2000);
    setShowPayment(true);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleCancel();
      } else if (e.key === "F4") {
        handleHold();
      } else if (e.key === "F2") {
        handlePayAndSubmit();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (isOnline) {
      (async () => {
        const savedReceipts =
          (await db.get<unknown[]>("offlineReceipts")) || [];

        // Clear items when going online, don't restore saved receipts as items
        // The offline receipts are already processed and should not be restored as current items

        if (savedReceipts.length > 0) {
          setItems([]);
          const loadingToast = toast.loading(t("syncing_offline_receipts"));
          try {
            const result = await createReceiptRange(savedReceipts);
            if (!result?.data?.ids) {
              toast.dismiss(loadingToast);

              toast.error(t("failed_to_sync_offline_receipts"));
              return;
            }
            const body = {
              ids: result?.data?.ids,
            };
            await createSubmitReceipt(body).unwrap();
            toast.dismiss(loadingToast);
            toast.success(t("receipts_synced_from_offline"));
            db.del("offlineReceipts");
          } catch {
            toast.dismiss(loadingToast);
            toast.error(t("failed_to_sync_offline_receipts"));
          }
        }
      })();
    }
  }, [isOnline]);

  // Handle hold shift (just logout without clearing data)
  const handleHoldShift = () => {
    setIsLogoutModalOpen(false);
    keycloak.logout({
      redirectUri: import.meta.env.VITE_API_BASE_URL,
    });
  };

  // Handle full logout (clear shift and data)
  const handleFullLogout = async () => {
    // Close shift if exists
    if (currentShift?.id) {
      await closeShiftPOS({
        posShiftId: Number(currentShift.id),
      }).unwrap();

      // Clear only session-specific data, keep cached data
      await db.clear().then(() => {
        dispatch(clearSubscription());
        // Close modal and logout
        setIsLogoutModalOpen(false);
        keycloak.logout({
          redirectUri: import.meta.env.VITE_API_BASE_URL_RESTAURANT,
        });
      });
    }
  };

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-slate-50 via-white to-gray-50 flex flex-col overflow-hidden">
      <SidebarNav
        onOpenItemSearch={() => setShowItemSearch(true)}
        onOpenReceiptSearch={() => setShowReceiptSearch(true)}
        onOpenCreateCustomer={() => setShowCreateCustomer(true)}
        onOpenCustomerSearch={() => setShowCustomerSearch(true)}
        taxActivityCode={
          effectiveCompanyLocationDetails?.taxActivityCodes?.find(
            (t: { isDefault: boolean }) => t.isDefault
          )?.code ||
          (defaultTaxActivityCodeId ? String(defaultTaxActivityCodeId) : "")
        }
        isReturnMode={isReturnMode}
        onExitReturnMode={() => setIsReturnMode(false)}
        onOpenLogoutModal={() => setIsLogoutModalOpen(true)}
        hasItems={items.length > 0}
      />

      {/* Main Content - Optimized Grid Layout (reduced bottom padding due to floating dock) */}
      <div className="flex-1 pl-16 overflow-hidden">
        <div className="h-full grid grid-cols-1 lg:grid-cols-5 gap-2 px-2 py-2">
          {/* Left Panel - Browse & Add Items (takes 3/5 of space) */}
          <div className="h-full flex flex-col space-y-2 overflow-hidden lg:col-span-3">
            <BrowseItems
              items={[]} // BrowseItems now fetches its own data
              isExpanded={isBrowseItemsExpanded}
              onToggleExpanded={() =>
                setIsBrowseItemsExpanded(!isBrowseItemsExpanded)
              }
              onAddItem={(quantity, productData) =>
                addItem(quantity, productData)
              }
              barcodeInput={barcodeInput}
              onBarcodeChange={setBarcodeInput}
              onOpenSearch={() => setShowItemSearch(true)}
              barcodeInputRef={barcodeInputRef}
            />
          </div>

          {/* Right Panel - Receipt & Summary (takes 2/5 of space) */}
          <div className="h-full flex flex-col space-y-2 overflow-hidden lg:col-span-2">
            {/* Receipt Items - Scrollable */}
            <div className="flex-1 min-h-0 overflow-y-auto">
              <ReceiptItemsList
                items={items}
                onUpdateQuantity={updateQuantity}
                onUpdatePrice={updatePrice}
                onOpenTax={openTaxModal}
                onDeleteRequest={showDeleteConfirmation}
              />
            </div>

            {/* Order Summary - With Inline Pay */}
            <div className="flex-shrink-0">
              <OrderSummary
                summary={receiptSummary}
                discountValue={receiptDiscountValue}
                onDiscountChange={(v) => setReceiptDiscountValue(v)}
                isReturnMode={isReturnMode}
                referenceReceiptUuid={referenceReceiptUuid}
                onSubmit={handlePayAndSubmit}
                onCancel={handleCancel}
                onHold={handleHold}
                onOpenHeldReceipts={() => setShowHeldReceipts(true)}
                isOffline={isOffline}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer removed from floating dock to keep actions near Pay in summary */}
      {/* Modals */}
      {showTaxModal && selectedItemForTax && (
        <TaxDetailsModal
          item={selectedItemForTax}
          onClose={() => setShowTaxModal(false)}
          onUpdate={handleTaxUpdate}
        />
      )}
      {showItemSearch && (
        <ItemSearchModal
          onClose={() => setShowItemSearch(false)}
          onSelectItem={(quantity, productData) =>
            addItem(quantity, productData as Product)
          }
        />
      )}
      {showCustomerSearch && (
        <CustomerSearchModal
          onClose={() => setShowCustomerSearch(false)}
          onSelectCustomer={(c) => {
            setSelectedCustomer(c);
            setShowCustomerSearch(false);
          }}
        />
      )}
      {showReceiptSearch && (
        <ReceiptSearchModal
          onClose={() => setShowReceiptSearch(false)}
          onSelectReceipt={handleReceiptSelect}
        />
      )}
      {showReturnPicker && (
        <ReturnPickerModal
          onClose={() => setShowReturnPicker(false)}
          receiptId={receiptData?.id as number}
        />
      )}
      {showCreateCustomer && (
        <QuickCustomerModal
          onClose={() => setShowCreateCustomer(false)}
          isLoading={isCreatingCustomer}
          onSave={async (form: FormData) => {
            try {
              // Ensure defaultForReceipt is always false when creating a customer
              form.set("defaultForReceipt", "false");
              const result = await createCustomer(form).unwrap();
              const createdId =
                (result as { id?: number; data?: { id?: number } }).id ??
                (result as { data?: { id?: number } }).data?.id;
              if (typeof createdId === "number" && createdId > 0) {
                const first = form.get("first");
                const last = form.get("last");
                const displayName =
                  `${typeof first === "string" ? first : ""} ${
                    typeof last === "string" ? last : ""
                  }`.trim() || t("customer");
                setSelectedCustomer({ id: createdId, fullName: displayName });
                toast.success(`${t("customer_saved")}: ${displayName}`);
              } else {
                toast.info(t("customer_created_could_not_read_id"));
              }
              setShowCreateCustomer(false);
            } catch (err) {
              console.error(err);
            }
          }}
        />
      )}
      <PaymentSidebar
        open={showPayment}
        items={items}
        amountDue={receiptSummary.netPayable}
        subtotal={receiptSummary.subtotal}
        discountTotal={receiptSummary.totalDiscount}
        orderCode={currentShift?.id ? `${currentShift.id}` : undefined}
        onClose={() => setShowPayment(false)}
        isLoading={isCreatingReceipt}
        onConfirm={async ({ method, paidAmount, buyerPaymentNumber }) => {
          setShowPayment(false);
          try {
            const payload = await buildReceiptPayload({
              method,
              paidAmount,
              buyerPaymentNumber,
            });
            if (isOffline) {
              // Save receipt to localStorage for later sync
              const offlineReceipt = payload;
              (async () => {
                const savedReceipts =
                  (await db.get<unknown[]>("offlineReceipts")) || [];
                savedReceipts.push(offlineReceipt);
                await db.set("offlineReceipts", savedReceipts);
              })();
              toast.success(t("receipt_saved_for_sync"));
              // Prepare print data from current UI state
              setPrintData({
                receiptCode: payload.receiptCode,
                dateTimeIssued: payload.dateTimeIssued,
                paymentMethodLabel: method === "cash" ? "Cash" : "Card",
                subtotal: receiptSummary.subtotal,
                taxTotal: receiptSummary.taxTotal,
                discountTotal: receiptSummary.totalDiscount,
                netPayable: receiptSummary.netPayable,
                items: items.map((it) => ({
                  description: it.name,
                  quantity: it.quantity,
                  unitPrice: it.unitPrice,
                  lineTotal: it.lineTotal,
                })),
                receiptId: undefined, // No receipt ID for offline receipts
              });
              setShowPrintModal(true);
            } else {
              // Save receipt to database
              const createReceiptToast = toast.loading(t("creating_receipt"));
              try {
                const result = await createReceipt(payload).unwrap();
                toast.dismiss(createReceiptToast);

                const submitReceiptToast = toast.loading(
                  t("submitting_receipt")
                );
                const body = {
                  ids: [+result?.id],
                };
                await createSubmitReceipt(body).unwrap();
                toast.dismiss(submitReceiptToast);
                // Prepare print data based on submitted receipt and current summary
                setPrintData({
                  receiptCode: result?.receiptCode || payload.receiptCode,
                  dateTimeIssued:
                    result?.dateTimeIssued || payload.dateTimeIssued,
                  paymentMethodLabel: method === "cash" ? "Cash" : "Card",
                  subtotal: receiptSummary.subtotal,
                  taxTotal: receiptSummary.taxTotal,
                  discountTotal: receiptSummary.totalDiscount,
                  netPayable: receiptSummary.netPayable,
                  items: items.map((it) => ({
                    description: it.name,
                    quantity: it.quantity,
                    unitPrice: it.unitPrice,
                    lineTotal: it.lineTotal,
                  })),
                  receiptId: result?.id, // Add receipt ID for QR code
                });
                setShowPrintModal(true);
              } catch (error) {
                toast.dismiss(createReceiptToast);
                throw error;
              }
            }
            // await createReceipt(payload).unwrap();
            toast.success(
              isReturnMode ? t("refund_submitted") : t("receipt_submitted")
            );
            handleCancel();
            setSelectedCustomer(null);
          } catch (err) {
            console.error(err);
            toast.error(t("failed_to_process_receipt"));
          }
        }}
      />
      <PrintReceiptModal
        open={showPrintModal}
        data={printData}
        onClose={() => {
          setShowPrintModal(false);
          setPrintData(null);
        }}
      />
      <DeleteConfirmModal
        open={showDeleteConfirm}
        supervisorPassword={supervisorPassword}
        onPasswordChange={setSupervisorPassword}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setItemToDelete(null);
          setSupervisorPassword("");
        }}
        onConfirm={handleDeleteConfirm}
      />
      <HeldReceiptsModal
        open={showHeldReceipts}
        onClose={() => setShowHeldReceipts(false)}
        onRestoreReceipt={handleRestoreReceipt}
      />

      {/* Logout Modal */}
      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onHoldShift={handleHoldShift}
        onLogout={handleFullLogout}
      />
    </div>
  );
};
export default POSPage;
