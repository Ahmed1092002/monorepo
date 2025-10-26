// components/TaxDetailsModal.tsx - Tax details mini-modal

import React, { useState, useMemo } from "react";
import {
  calculateTaxFromRate,
  calculateRateFromAmount,
} from "@monorepo/shared-utils";
import { priceRangeHandle } from "@monorepo/shared-utils";
import type {
  LineItem,
  TaxType,
  TaxSubtype,
  ITaxesGrid,
} from "@monorepo/shared-types";
import {
  useGetTaxTypesQuery,
  useLazyGetTaxSubtypesQuery,
} from "@monorepo/shared-api";
import { useTranslation } from "react-i18next";
import {
  Modal,
  ModalHeader,
  ModalContent,
  ModalFooter,
} from "@monorepo/shared-ui";
import { Button } from "@monorepo/shared-ui";
import { Input } from "@monorepo/shared-ui";
import { Text } from "@monorepo/shared-ui";
import { Select } from "@monorepo/shared-ui";

interface TaxDetailsModalProps {
  item: LineItem;
  onClose: () => void;
  onUpdate: (taxes: ITaxesGrid[]) => void;
}

const TaxDetailsModal: React.FC<TaxDetailsModalProps> = ({
  item,
  onClose,
  onUpdate,
}) => {
  const { t } = useTranslation();
  // Keep initial tax to taxable base only (already computed from item)
  // Do not prefill with product/display taxes; only show computed total by default.
  // If user previously set manual taxes (item.itemTaxes), load them for editing; otherwise start empty.
  const initialRows: ITaxesGrid[] =
    item.itemTaxes && item.itemTaxes.length > 0 ? item.itemTaxes : [];
  const [itemTaxes, setItemTaxes] = useState<ITaxesGrid[]>(initialRows);
  const [rowSelections, setRowSelections] = useState<
    Array<{ typeId?: number; subtypeCode?: string }>
  >(
    initialRows.map((r) => ({ typeId: undefined, subtypeCode: r.subtypeCode }))
  );
  const [subtypesCache, setSubtypesCache] = useState<
    Record<number, TaxSubtype[]>
  >({});
  // validation not required globally; taxes are optional per row
  const { data: taxTypes = [] } = useGetTaxTypesQuery();
  // Derive selected taxTypeId from either stored id or current code
  // Global selectedTypeId not used; per-row selection state is used instead
  const [triggerGetSubtypes] = useLazyGetTaxSubtypesQuery();
  // per-row state; no global hasTypeSelected needed

  // Use product price base (unitPrice * quantity) for modal calculations
  const priceBase = Number(item.unitPrice) * Number(item.quantity);

  // No global validation

  // removed global change handler; each row manages its own selections

  // Multi-tax handlers
  const addTaxRow = () => {
    setItemTaxes((prev) => [
      ...prev,
      {
        taxType: "",
        taxRate: undefined,
        taxAmount: 0,
        taxTypeId: 0,
        taxSubtypeId: 0,
      },
    ]);
    setRowSelections((prev) => [
      ...prev,
      { typeId: undefined, subtypeCode: undefined },
    ]);
  };
  const removeTaxRow = (index: number) => {
    setItemTaxes((prev) => prev.filter((_, i) => i !== index));
    setRowSelections((prev) => prev.filter((_, i) => i !== index));
  };
  const updateTaxRow = async (
    index: number,
    field: keyof ITaxesGrid | "typeCode" | "subtypeCode",
    value: string | number | undefined
  ) => {
    setItemTaxes((prev) => {
      const rows = [...prev];
      const row = { ...rows[index] };
      if (field === "typeCode") {
        // typeCode is ETA code prefix (e.g., T1), reset row and fetch subtypes for UI if needed
        row.taxType = String(value);
        // Find the tax type ID from the selected type
        const selectedType = taxTypes.find((t: TaxType) => t.code === value);
        row.taxTypeId = selectedType?.id || 0;
      } else if (field === "subtypeCode") {
        // Persist subtypeCode on the row for restore
        row.subtypeCode = String(value);
        // Find the tax subtype ID from the selected subtype
        const rowTypeId = rowSelections[index]?.typeId;
        if (rowTypeId) {
          const subtypes = subtypesCache[rowTypeId] || [];
          const selectedSubtype = subtypes.find(
            (s: TaxSubtype) => s.code === value
          );
          row.taxSubtypeId = selectedSubtype?.id || 0;
        }
      } else if (field === "taxRate") {
        const rate =
          typeof value === "number" ? value : parseFloat(String(value)) || 0;
        // Check if the current subtype is rated
        const rowTypeId = rowSelections[index]?.typeId;
        const rowSubtypes = rowTypeId ? subtypesCache[rowTypeId] || [] : [];
        const currentSubtype = rowSubtypes.find(
          (s: TaxSubtype) => s.code === rowSelections[index]?.subtypeCode
        );

        if (currentSubtype?.isRated) {
          row.taxRate = rate;
          row.taxAmount = priceRangeHandle(
            calculateTaxFromRate(priceBase, rate)
          );
        } else {
          // For non-rated taxes, don't set rate
          row.taxRate = undefined;
        }
      } else if (field === "taxAmount") {
        const amount =
          typeof value === "number" ? value : parseFloat(String(value)) || 0;
        row.taxAmount = amount;

        // Check if the current subtype is rated
        const rowTypeId = rowSelections[index]?.typeId;
        const rowSubtypes = rowTypeId ? subtypesCache[rowTypeId] || [] : [];
        const currentSubtype = rowSubtypes.find(
          (s: TaxSubtype) => s.code === rowSelections[index]?.subtypeCode
        );

        if (currentSubtype?.isRated) {
          row.taxRate = priceRangeHandle(
            calculateRateFromAmount(priceBase, amount)
          );
        } else {
          // For non-rated taxes, don't set rate
          row.taxRate = undefined;
        }
      }
      rows[index] = row;
      return rows;
    });
  };

  const handleRowTypeChange = (index: number, typeCode: string) => {
    const selectedType = taxTypes.find((t: TaxType) => t.code === typeCode);
    if (selectedType?.id) {
      triggerGetSubtypes({ taxTypeId: selectedType.id })
        .unwrap()
        .then((data) => {
          setSubtypesCache((prev) => ({
            ...prev,
            [selectedType.id as number]: data as TaxSubtype[],
          }));
        })
        .catch(() => {});
    }
    setRowSelections((prev) => {
      const next = [...prev];
      next[index] = { typeId: selectedType?.id, subtypeCode: undefined };
      return next;
    });
    // Persist the chosen type code into the row itself so it is restored when reopening
    updateTaxRow(index, "typeCode", typeCode);
  };

  const handleRowSubtypeChange = (index: number, subtypeCode: string) => {
    setRowSelections((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], subtypeCode };
      return next;
    });
    updateTaxRow(index, "subtypeCode", subtypeCode);
  };

  const taxesTotal = useMemo(() => {
    const manualSum = itemTaxes.reduce(
      (s, r) => s + (Number(r.taxAmount) || 0),
      0
    );
    // If item already has manual taxes saved, don't add base again to avoid double counting
    const hasSavedManual =
      Array.isArray(item.itemTaxes) && item.itemTaxes.length > 0;
    const baseAuto = hasSavedManual ? 0 : Number(item.tax?.amount) || 0;
    return priceRangeHandle(baseAuto + manualSum);
  }, [itemTaxes, item.tax?.amount, item.itemTaxes]);

  // Reset and hydrate state if a different item is opened
  React.useEffect(() => {
    // Only hydrate with previously saved manual taxes; ignore displayOnlyTaxes
    const rows: ITaxesGrid[] =
      item.itemTaxes && item.itemTaxes.length > 0 ? item.itemTaxes : [];
    setItemTaxes(rows);
    // Derive the selected type from the saved code on each row (if present)
    const deriveSelections = async () => {
      const selections = await Promise.all(
        rows.map(async (r) => {
          const type = taxTypes.find(
            (t: TaxType) => t.code === (r.taxType || "")
          );
          if (type?.id) {
            try {
              const data = await triggerGetSubtypes({
                taxTypeId: type.id,
              }).unwrap();
              setSubtypesCache((prev) => ({
                ...prev,
                [type.id as number]: data as TaxSubtype[],
              }));
            } catch {
              // ignore
            }
          }
          return { typeId: type?.id, subtypeCode: r.subtypeCode };
        })
      );
      setRowSelections(selections);
    };
    deriveSelections();
  }, [item.id, item.itemTaxes, taxTypes, triggerGetSubtypes]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // If no manual rows, do not overwrite existing taxes
    if (itemTaxes.length === 0) {
      onClose();
      return;
    }
    onUpdate(itemTaxes);
  };

  return (
    <Modal isOpen={true} onClose={onClose} size="lg">
      <ModalHeader>
        <div className="flex items-center space-x-2">
          <span className="text-blue-600">🧮</span>
          <Text variant="h3" color="dark" weight="semibold">
            {t("tax_details")}
          </Text>
        </div>
      </ModalHeader>

      <ModalContent>
        <div className="space-y-4">
          {/* Item Info */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <Text variant="small" color="dark" weight="medium">
              {item.name}
            </Text>
            <Text variant="small" color="secondary" className="mt-1">
              {t("code")}: {item.code} | {t("qty")}: {item.quantity} |{" "}
              {t("price")}: {item.unitPrice} EGP
            </Text>
            <Text variant="small" color="secondary">
              {t("price_base")}: {priceBase.toFixed(2)} EGP
            </Text>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Optional Taxes List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Text variant="small" color="dark" weight="medium">
                  {t("taxes_optional")}
                </Text>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={addTaxRow}
                >
                  {t("add_tax")}
                </Button>
              </div>
              {itemTaxes.map((row, idx) => {
                const rowTypeId = rowSelections[idx]?.typeId;
                const rowSubtypes = rowTypeId
                  ? subtypesCache[rowTypeId] || []
                  : [];
                const rowSubtype = rowSubtypes.find(
                  (s) => s.code === rowSelections[idx]?.subtypeCode
                );
                const rowIsRated = !!rowSubtype?.isRated;
                return (
                  <div
                    key={idx}
                    className="border border-gray-200 rounded-lg p-3 bg-gray-50"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-6 gap-3 items-end">
                      <div className="sm:col-span-2">
                        <Select
                          value={
                            taxTypes.find((t) => t.id === rowTypeId)?.code ||
                            row.taxType ||
                            ""
                          }
                          onChange={(e) =>
                            handleRowTypeChange(idx, e.target.value)
                          }
                          label={t("tax_type")}
                          options={[
                            { value: "", label: t("select") },
                            ...taxTypes.map((type) => ({
                              value: type.code,
                              label: `${type.code} - ${type.desc_en}`,
                            })),
                          ]}
                          fullWidth
                        />
                      </div>
                      {rowTypeId && (
                        <div className="sm:col-span-2">
                          <Select
                            value={
                              rowSelections[idx]?.subtypeCode ||
                              row.subtypeCode ||
                              ""
                            }
                            onChange={(e) =>
                              handleRowSubtypeChange(idx, e.target.value)
                            }
                            label={t("tax_subtype")}
                            options={[
                              { value: "", label: t("select") },
                              ...rowSubtypes.map((subtype) => ({
                                value: subtype.code,
                                label: `${subtype.code} - ${subtype.desc_en}`,
                              })),
                            ]}
                            fullWidth
                          />
                        </div>
                      )}
                      {rowIsRated ? (
                        <div>
                          <Input
                            type="number"
                            value={
                              row.taxRate === undefined || row.taxRate === null
                                ? ""
                                : row.taxRate
                            }
                            onChange={(e) =>
                              updateTaxRow(
                                idx,
                                "taxRate",
                                e.target.value === ""
                                  ? undefined
                                  : parseFloat(e.target.value) || 0
                              )
                            }
                            label={t("rate_percent")}
                            min="0"
                            step="0.01"
                            fullWidth
                          />
                        </div>
                      ) : (
                        <div>
                          <Input
                            type="number"
                            value={
                              row.taxAmount === 0 || row.taxAmount === undefined
                                ? ""
                                : row.taxAmount
                            }
                            onChange={(e) =>
                              updateTaxRow(
                                idx,
                                "taxAmount",
                                e.target.value === ""
                                  ? 0
                                  : parseFloat(e.target.value) || 0
                              )
                            }
                            label={t("amount")}
                            min="0"
                            step="0.01"
                            fullWidth
                          />
                        </div>
                      )}
                      <div className="text-right">
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() => removeTaxRow(idx)}
                        >
                          {t("remove")}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Tax Total */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <Text variant="small" color="primary" weight="medium">
                  {t("tax_total")}
                </Text>
                <Text variant="small" color="primary" weight="semibold">
                  {taxesTotal.toFixed(2)} EGP
                </Text>
              </div>
            </div>
          </form>
        </div>
      </ModalContent>

      <ModalFooter>
        <div className="flex space-x-3">
          <Button type="button" variant="secondary" onClick={onClose} fullWidth>
            {t("cancel")}
          </Button>
          <Button
            type="submit"
            variant="primary"
            onClick={handleSubmit}
            fullWidth
          >
            {t("update_tax")}
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
};

export { TaxDetailsModal };
