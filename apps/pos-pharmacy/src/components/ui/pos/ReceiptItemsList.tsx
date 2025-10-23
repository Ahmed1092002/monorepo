import React from "react";
import { Plus, Minus, Trash2, ShoppingCart, Receipt as ReceiptIcon } from "lucide-react";
import type { LineItem } from "@monorepo/shared-types";
import { useTranslation } from "react-i18next";

type ReceiptItemsListProps = {
  items: LineItem[];
  onUpdateQuantity: (itemId: string, qty: number) => void;
  onUpdatePrice: (itemId: string, price: number) => void;
  onOpenTax: (item: LineItem) => void;
  onDeleteRequest: (itemId: string) => void;
};

const ReceiptItemsList: React.FC<ReceiptItemsListProps> = ({
  items,
  onUpdateQuantity,
  onUpdatePrice: _onUpdatePrice,
  onOpenTax,
  onDeleteRequest,
}) => {
  const { t } = useTranslation();
  void _onUpdatePrice;

  return (
    <div className="card shadow-brand-lg h-full flex flex-col overflow-hidden">
      <div className="bg-gradient-to-r from-[var(--brand-primary)]/5 to-orange-400/5 px-3 py-2 border-b border-brand-border flex items-center gap-2 flex-shrink-0">
        <ReceiptIcon className="w-5 h-5 text-[var(--brand-primary)]" />
        <h2 className="text-base font-semibold text-brand-dark">
          {t("receipt_items_title")}
        </h2>
        {items.length > 0 && (
          <span className="ml-auto bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] px-2 py-0.5 rounded-full text-[11px] font-semibold">
            {items.length} {items.length === 1 ? t("item") : t("items")}
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-brand-dark/50 p-4">
          <div className="text-center">
            <div className="relative inline-block mb-3">
              <div className="absolute inset-0 bg-[var(--brand-primary)]/10 rounded-full blur-xl"></div>
              <ShoppingCart
                className="relative w-16 h-16 text-[var(--brand-primary)]/30"
                strokeWidth={1.5}
              />
            </div>
            <h3 className="text-lg font-medium text-brand-dark mb-1">
              {t("no_items_in_receipt")}
            </h3>
            <p className="text-sm text-brand-dark/50">
              {t("start_scanning_or_searching_for_products_to_add")}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {/* Header row for column labels */}
          <div className="sticky top-0 bg-white border-b border-brand-border px-3 py-2 text-xs font-semibold text-brand-dark/70 grid grid-cols-12 gap-2">
            <div className="col-span-3">Item</div>
            <div className="col-span-2 text-center">Qty</div>
            <div className="col-span-2 text-right">Price</div>
            <div className="col-span-2 text-right">Tax</div>
            <div className="col-span-2 text-right">Total</div>
            <div className="col-span-1 text-center">Action</div>
          </div>

          <div className="divide-y divide-brand-border/50">
            {items.map((item) => (
              <div
                key={item.id}
                className="px-3 py-2 hover:bg-gray-50/50 transition-colors duration-150"
              >
                <div className="grid grid-cols-12 gap-2 items-center text-sm">
                  {/* Item Name */}
                  <div className="col-span-3 min-w-0">
                    <h3 className="font-medium text-brand-dark truncate">
                      {item.name}
                    </h3>
                  </div>

                  {/* Quantity Controls */}
                  <div className="col-span-2 flex items-center justify-center gap-1">
                    <button
                      onClick={() =>
                        onUpdateQuantity(item.id, item.quantity - 1)
                      }
                      className="p-1 rounded-md bg-brand-muted hover:bg-[var(--brand-primary)] hover:text-white transition-all duration-200 cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        onUpdateQuantity(item.id, parseInt(e.target.value) || 0)
                      }
                      className="w-10 px-1 py-0.5 text-center text-xs bg-white border border-brand-border rounded focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)] font-semibold"
                    />
                    <button
                      onClick={() =>
                        onUpdateQuantity(item.id, item.quantity + 1)
                      }
                      className="p-1 rounded-md bg-brand-muted hover:bg-[var(--brand-primary)] hover:text-white transition-all duration-200 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Price */}
                  <div className="col-span-2 text-right">
                    <span className="font-medium text-brand-dark">
                      {Number(item.unitPrice).toFixed(2)} EGP
                    </span>
                  </div>

                  {/* Tax */}
                  <div className="col-span-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <span className="font-medium text-brand-dark">
                        {(() => {
                          const taxes =
                            (item.itemTaxes && item.itemTaxes.length > 0
                              ? item.itemTaxes
                              : item.displayOnlyTaxes) || [];
                          const base =
                            Number(item.unitPrice) * Number(item.quantity);
                          const total = taxes.reduce((s, taxItem) => {
                            if (
                              taxItem.taxRate !== undefined &&
                              taxItem.taxRate !== null
                            ) {
                              return s + (Number(taxItem.taxRate) * base) / 100;
                            }
                            return s + (Number(taxItem.taxAmount) || 0);
                          }, 0);
                          return total.toFixed(2);
                        })()}{" "}
                        EGP
                      </span>
                      <button
                        onClick={() => onOpenTax(item)}
                        className="p-0.5 rounded hover:bg-[var(--brand-primary)]/10 hover:text-[var(--brand-primary)] transition-all duration-200 cursor-pointer"
                        title={
                          item.itemTaxes && item.itemTaxes.length > 0
                            ? t("edit_taxes")
                            : t("add_tax")
                        }
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Total */}
                  <div className="col-span-2 text-right">
                    <span className="font-bold text-[var(--brand-primary)]">
                      {item?.lineTotal?.toFixed(2)} EGP
                    </span>
                  </div>

                  {/* Delete Button */}
                  <div className="col-span-1 flex justify-center">
                    <button
                      onClick={() => onDeleteRequest(item.id)}
                      className="text-brand-error hover:text-red-700 hover:bg-red-50 p-1 rounded-md cursor-pointer transition-all duration-200"
                      title="Delete item (requires supervisor password)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceiptItemsList;
