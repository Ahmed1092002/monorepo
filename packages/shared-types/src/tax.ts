// types/tax.ts - Types for tax configuration and grids

export interface TaxType {
  id: number;
  code: string;
  desc_en: string;
  desc_ar: string;
  taxSubTypes?: TaxSubtype[];
}

export interface TaxSubtype {
  id: number;
  code: string;
  desc_en: string;
  desc_ar: string;
  isRated: boolean;
  taxCode: string;
}

// Grid tax item for advanced ETA calculations (T1..T20)
export interface ITaxesGrid {
  taxType: string; // e.g., "T1 (VAT)"
  taxRate?: number; // percentage
  taxAmount?: number; // absolute amount
  subtypeCode?: string;
  taxTypeId: number; // Required tax type ID
  taxSubtypeId: number; // Required tax subtype ID
}

// Core tax details attached to a line item
export interface TaxDetails {
  type: string;
  subtype: string;
  taxTypeId?: number;
  subtypeCode?: string;
  amount: number;
  rate: number;
}

// POS line item carrying tax details
export interface LineItem {
  id: string;
  name: string;
  code: string;
  productId?: number;
  unitTypeId?: number;
  quantity: number;
  unitPrice: number;
  discountMode: "percent" | "amount";
  discountValue: number;
  tax: TaxDetails;
  lineTotal: number;
  itemTaxes?: ITaxesGrid[];
  displayOnlyTaxes?: ITaxesGrid[];
}

// Receipt summary totals
export interface ReceiptSummary {
  subtotal: number;
  totalDiscount: number;
  taxTotal: number;
  netPayable: number;
  receiptUuid?: string;
}

// Advanced ETA totals/types
export interface ITaxesTotalList {
  amount: number;
  taxType: string;
}

export interface IItemRows {
  id: string | number;
  itemCode: string | number;
  itemDescription: string | number;
  itemPrice: number;
  itemQty: number;
  itemTotalSalesAmount: number;
  itemDiscountRate: number;
  itemAmount: number;
  itemNetTotal: number;
  itemTaxes: ITaxesGrid[] | [];
  itemValueDifference: number;
  itemTaxesTotal: number;
  itemTotal: number;
  itemsDiscount: number;
  itemGrandTotal: number;
}
