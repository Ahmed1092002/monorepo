import type { LineItem } from "./tax.ts";
import type { POS } from "./pos";

export interface Supervisor {
  id: number;
  employeeId: number;
  employeeName: string;
  employeeNameAr: string;
  pin: string;
}

export interface Cashier {
  id: number;
  employeeId: number;
  employeeName: string;
  employeeNameAr: string;
}

export interface LineTax {
  id: number;
  receiptLineId: number;
  lookupTaxableTypeId: number;
  amount: number;
  lookupTaxableSubTypeId: number;
  rate: number;
  typeCode: string;
  subTypeCode: string;
  enDescription: string;
}

export interface ReceiptLine {
  id: number;
  receiptId: number;
  productId: number;
  productCode: string;
  itemDescription: string;
  quantity: number;
  unitValue: number;
  weightUnitType: string;
  weightQuantity: number;
  unitTypeId: number;
  salesTotal: number;
  total: number;
  grandTotal: number;
  taxAmount: number;
  valueDifference: number;
  totalTaxableFees: number;
  netTotal: number;
  itemsDiscount: number;
  currencySold: string;
  amountEGP: number;
  amountSold: number;
  currencyExchangeRate: number;
  commercialDiscountRate: number;
  commercialDiscountAmount: number;
  itemsDiscountRate: number;
  itemsDiscountAmount: number;
  lineTaxes: LineTax[];
}

export interface Receipt {
  id: number;
  customerId: number;
  companyLocationId: number;
  customerCode: string;
  companyLocationCode: string;
  posId: number;
  pos: POS;
  taxActivityCodeId: number;
  uuid: string;
  submissionId: string;
  reference: string;
  referenceOldUUID: string;
  dateTimeIssued: string;
  submittionDate: string;
  receiptCode: string;
  sOrderNameCode: string;
  orderdeliveryMode: string;
  grossWeight: number;
  netWeight: number;
  totalSales: number;
  totalAmount: number;
  totalCommercialDiscount: number;
  totalItemsDiscount: number;
  netAmount: number;
  feesAmount: number;
  adjustment: number;
  extraDiscount: number;
  contractorName: string;
  contractorAmount: number;
  contractorRate: number;
  beneficiaryAmount: number;
  beneficiaryRate: number;
  status: string;
  receiptType: string;
  typeVersion: string;
  paymentMethod: string;
  syndicateLicenseNumber: string;
  buyerPaymentNumber: string;
  qrCode: string;
  errors: string;
  documentUseReason: string;
  salesIssuedDateTime: string;
  receiptLines: ReceiptLine[];
}

export interface ReceiptsResponse {
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  data: Receipt[];
}

export interface HeldReceipt {
  id: string;
  items: LineItem[];
  receiptDiscountMode: "percent" | "amount";
  receiptDiscountValue: number;
  isReturnMode: boolean;
  referenceReceiptUuid?: string;
  selectedCustomer?: {
    id: number;
    fullName: string;
  } | null;
  timestamp: string;
  receiptCode: string;
  totalAmount: number;
}
