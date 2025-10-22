import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import type { LineItem } from "@monorepo/shared-types";
import {
  Modal,
  ModalHeader,
  ModalContent,
  ModalFooter,
} from "@monorepo/shared-ui";
import { Button } from "@monorepo/shared-ui";
import { Input } from "@monorepo/shared-ui";
import { Text } from "@monorepo/shared-ui";

type PaymentMethod = "cash" | "card";

type PaymentSidebarProps = {
  open: boolean;
  items: LineItem[];
  amountDue: number;
  subtotal: number;
  discountTotal: number;
  onClose: () => void;
  onConfirm: (args: {
    method: PaymentMethod;
    paidAmount: number;
    buyerPaymentNumber?: string;
  }) => void;
  isLoading?: boolean;
  orderCode?: string;
};

const PaymentSidebar: React.FC<PaymentSidebarProps> = ({
  open,
  items,
  amountDue,
  subtotal,
  discountTotal,
  onClose,
  onConfirm,
  isLoading = false,
  orderCode,
}) => {
  const { t } = useTranslation();
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [buyerPaymentNumber, setBuyerPaymentNumber] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [cvv, setCvv] = useState("");
  // const [isAnimating, setIsAnimating] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Keep latest amountDue in a ref to avoid re-triggering animation when amountDue changes
  const latestAmountDueRef = useRef(amountDue);
  useEffect(() => {
    latestAmountDueRef.current = amountDue;
  }, [amountDue]);

  // Reset form state only when the sidebar is opened
  useEffect(() => {
    if (!open) return;
    setMethod("cash");
    setPaidAmount(latestAmountDueRef.current);
    setBuyerPaymentNumber("");
    setCardholderName("");
    setCardNumber("");
    setExpirationDate("");
    setCvv("");
  }, [open]);

  // Handle mount/unmount visibility and deterministic animate-in using double rAF
  useEffect(() => {
    if (open) {
      setIsVisible(true);
      let raf1 = 0;
      let raf2 = 0;
      raf1 = window.requestAnimationFrame(() => {
        raf2 = window.requestAnimationFrame(() => {
          // setIsAnimating(true);
        });
      });
      return () => {
        window.cancelAnimationFrame(raf1);
        window.cancelAnimationFrame(raf2);
      };
    } else {
      // setIsAnimating(false);
      const id = window.setTimeout(() => setIsVisible(false), 300);
      return () => window.clearTimeout(id);
    }
  }, [open]);

  const changeAmount = useMemo(() => {
    const diff = (paidAmount || 0) - (amountDue || 0);
    return method === "cash" ? Math.max(0, Number(diff.toFixed(2))) : 0;
  }, [paidAmount, amountDue, method]);

  const remainingAmount = useMemo(() => {
    const diff = (amountDue || 0) - (paidAmount || 0);
    return Number(diff.toFixed(2));
  }, [paidAmount, amountDue]);

  const canSubmit = useMemo(() => {
    if (amountDue <= 0) return false;
    if (method === "cash") return paidAmount > 0 && paidAmount >= amountDue;
    // For card, we just need a valid amount (removed strict validation for demo)
    return paidAmount > 0;
  }, [amountDue, method, paidAmount]);

  const handleSubmit = useCallback(() => {
    if (!canSubmit || isLoading) return;
    onConfirm({
      method,
      paidAmount,
      buyerPaymentNumber:
        buyerPaymentNumber.trim() || cardNumber.slice(-4) || undefined,
    });
  }, [
    canSubmit,
    isLoading,
    onConfirm,
    method,
    paidAmount,
    buyerPaymentNumber,
    cardNumber,
  ]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "Escape") onClose();
      if (e.key === "Enter") handleSubmit();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose, handleSubmit]);

  if (!isVisible) return null;

  return (
    <Modal isOpen={open} onClose={onClose} size="4xl">
      <ModalHeader>
        <div className="flex items-center justify-between">
          <Text variant="h3" color="dark" weight="semibold">
            {t("payment")}
          </Text>
        </div>
      </ModalHeader>

      <ModalContent>
        <div className="flex-1 flex overflow-hidden">
          {/* Left Side - Confirmation */}
          <div className="w-1/2 bg-white border-r border-gray-200 flex flex-col">
            <div className="px-6 py-3 border-b border-gray-200">
              <Text variant="h5" color="dark" weight="semibold">
                Confirmation
              </Text>
              <Text variant="small" color="secondary" className="mt-1">
                Orders #{orderCode || "N/A"}
              </Text>
            </div>

            {/* Items List - Scrollable */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-lg border border-gray-200 p-4 transition-all duration-200 hover:shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    {/* Item Image Placeholder */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex-shrink-0 overflow-hidden">
                      <div className="w-full h-full flex items-center justify-center text-white text-xs font-semibold">
                        {item.name.substring(0, 2).toUpperCase()}
                      </div>
                    </div>

                    {/* Item Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1">
                          <Text
                            variant="small"
                            color="dark"
                            weight="medium"
                            className="truncate w-28"
                          >
                            {item.name}
                          </Text>
                          <Text variant="small" color="secondary">
                            EGP {item.unitPrice.toFixed(2)}
                          </Text>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="inline-flex items-center justify-center bg-gray-100 rounded-md px-3 py-1 min-w-[3rem]">
                            <Text
                              variant="small"
                              color="dark"
                              weight="semibold"
                            >
                              {item.quantity}
                            </Text>
                          </div>
                          <Text
                            variant="small"
                            color="dark"
                            weight="semibold"
                            className="mt-1"
                          >
                            EGP {item.lineTotal.toFixed(2)}
                          </Text>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Summary */}
            <div className="border-t border-gray-200 px-6 py-4 space-y-2">
              <div className="flex justify-between">
                <Text variant="small" color="secondary">
                  Discount
                </Text>
                <Text variant="small" color="dark" weight="medium">
                  EGP {discountTotal.toFixed(2)}
                </Text>
              </div>
              <div className="flex justify-between">
                <Text variant="small" color="dark" weight="medium">
                  Sub total
                </Text>
                <Text variant="small" color="dark" weight="semibold">
                  EGP {subtotal.toFixed(2)}
                </Text>
              </div>
            </div>
          </div>

          {/* Right Side - Payment */}
          <div className="w-1/2 bg-gray-100 flex flex-col">
            <div className="px-6 py-3 border-b border-gray-200 bg-white">
              <Text variant="h5" color="dark" weight="semibold">
                Payment
              </Text>
              <Text variant="small" color="secondary" className="mt-1">
                {items.length} payment method available
              </Text>
            </div>

            {/* Payment Form - Scrollable */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              {/* Payment Method Selection */}
              <div>
                <Text
                  variant="small"
                  color="dark"
                  weight="medium"
                  className="mb-3"
                >
                  Payment Method
                </Text>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setMethod("cash")}
                    className={`relative flex flex-col items-center justify-center py-2 px-8 rounded-md border-2 transition-all duration-200 ${
                      method === "cash"
                        ? "border-orange-500 bg-orange-50 shadow-sm"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                    }`}
                  >
                    {method === "cash" && (
                      <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center">
                        <svg
                          className="w-2.5 h-2.5 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                    <span className="text-2xl mb-1">💰</span>
                    <Text variant="small" color="dark" weight="medium">
                      Cash
                    </Text>
                  </button>
                  <button
                    onClick={() => setMethod("card")}
                    className={`relative flex flex-col items-center justify-center py-2 px-8 rounded-md border-2 transition-all duration-200 ${
                      method === "card"
                        ? "border-orange-500 bg-orange-50 shadow-sm"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                    }`}
                  >
                    {method === "card" && (
                      <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center">
                        <svg
                          className="w-2.5 h-2.5 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                    <span className="text-2xl mb-1">💳</span>
                    <Text variant="small" color="dark" weight="medium">
                      Visa
                    </Text>
                  </button>
                </div>
              </div>

              {/* Card Payment Fields */}
              {method === "card" && (
                <>
                  <div>
                    <Input
                      type="text"
                      label="Cardholder Name"
                      placeholder="Levi Ackerman"
                      value={cardholderName}
                      onChange={(e) => setCardholderName(e.target.value)}
                      disabled={isLoading}
                      fullWidth
                    />
                  </div>

                  <div>
                    <Input
                      type="text"
                      label="Card Number"
                      placeholder="2564 1421 0897 1244"
                      value={cardNumber}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\s/g, "");
                        if (value.length <= 16 && /^\d*$/.test(value)) {
                          const formatted =
                            value.match(/.{1,4}/g)?.join(" ") || value;
                          setCardNumber(formatted);
                        }
                      }}
                      disabled={isLoading}
                      fullWidth
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Input
                        type="text"
                        label="Expiration Date"
                        placeholder="02/2022"
                        value={expirationDate}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "");
                          if (value.length <= 4) {
                            const formatted =
                              value.length >= 2
                                ? `${value.slice(0, 2)}/${value.slice(2)}`
                                : value;
                            setExpirationDate(formatted);
                          }
                        }}
                        disabled={isLoading}
                        fullWidth
                      />
                    </div>
                    <div>
                      <Input
                        type="password"
                        label="CVV"
                        placeholder="•••"
                        maxLength={3}
                        value={cvv}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "");
                          setCvv(value);
                        }}
                        disabled={isLoading}
                        fullWidth
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Cash Payment Fields */}
              {method === "cash" && (
                <>
                  <div>
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      label={t("paid_amount")}
                      value={
                        isNaN(paidAmount) || paidAmount === 0 ? "" : paidAmount
                      }
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "" || value === "0") {
                          setPaidAmount(0);
                        } else {
                          setPaidAmount(Number(value));
                        }
                      }}
                      disabled={isLoading}
                      placeholder="0.00"
                      fullWidth
                    />
                  </div>

                  <div>
                    <Text
                      variant="small"
                      color="dark"
                      weight="medium"
                      className="mb-2"
                    >
                      {t("change")}
                    </Text>
                    <div className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50">
                      <Text variant="small" color="dark" weight="medium">
                        {remainingAmount > 0
                          ? "-" + remainingAmount.toFixed(2)
                          : changeAmount.toFixed(2)}{" "}
                        EGP
                      </Text>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </ModalContent>

      <ModalFooter>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
            fullWidth
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSubmit}
            disabled={!canSubmit || isLoading}
            isLoading={isLoading}
            loadingText="Processing..."
            fullWidth
          >
            Confirm Payment
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
};

export default PaymentSidebar;
