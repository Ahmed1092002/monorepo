// utils/etaTaxCalc.ts - Advanced ETA taxes and totals
import { priceRangeHandle } from "./priceHandle";
import type {
  ITaxesGrid,
  ITaxesTotalList,
  IItemRows,
  LineItem,
  TaxDetails,
} from "@monorepo/shared-types";

export function calcTotalSalesAmount(price: number, quantity: number) {
  const totalSalesAmount = +price * +quantity;
  return priceRangeHandle(totalSalesAmount);
}

export function calcDiscountRateAmount(
  price: number,
  quantity: number,
  discountRate: number
) {
  const discountRateAmount = (+price * +quantity * +discountRate) / 100;
  return priceRangeHandle(discountRateAmount);
}

export function calcNetTotal(totalSalesAmount: number, discountRate: number) {
  const discountRateAmount = (+totalSalesAmount * +discountRate) / 100;
  const netTotal = +totalSalesAmount - discountRateAmount;
  return priceRangeHandle(netTotal);
}

export const DEFAULT_VAT_RATE = 14; // 14% VAT rate in Egypt

export function calculateTaxableBase(item: LineItem): number {
  const lineValue = item.quantity * item.unitPrice;
  let discountAmount = 0;
  if (item.discountMode === "percent") {
    discountAmount = (item.discountValue / 100) * lineValue;
  } else {
    discountAmount = item.discountValue;
  }
  return Math.max(0, lineValue - discountAmount);
}

export function calculateTaxFromRate(
  taxableBase: number,
  rate: number
): number {
  return (rate / 100) * taxableBase;
}

export function calculateRateFromAmount(
  taxableBase: number,
  amount: number
): number {
  if (taxableBase === 0) return 0;
  return (amount / taxableBase) * 100;
}

export function updateTaxDetails(
  currentTax: TaxDetails,
  updates: Partial<TaxDetails>,
  taxableBase: number
): TaxDetails {
  const newTax = { ...currentTax, ...updates };
  if (updates.rate !== undefined) {
    newTax.amount = calculateTaxFromRate(taxableBase, updates.rate);
  } else if (updates.amount !== undefined) {
    newTax.rate = calculateRateFromAmount(taxableBase, updates.amount);
  }
  return newTax;
}

export function validateTaxDetails(
  tax: TaxDetails,
  taxableBase: number
): string[] {
  const errors: string[] = [];
  if (tax.rate < 0 || tax.rate > 100) {
    errors.push("Tax rate must be between 0% and 100%");
  }
  if (tax.amount < 0) {
    errors.push("Tax amount cannot be negative");
  }
  if (taxableBase > 0) {
    const expectedAmount = calculateTaxFromRate(taxableBase, tax.rate);
    const expectedRate = calculateRateFromAmount(taxableBase, tax.amount);
    if (Math.abs(tax.amount - expectedAmount) > 0.01) {
      errors.push("Tax amount does not match calculated rate");
    }
    if (Math.abs(tax.rate - expectedRate) > 0.01) {
      errors.push("Tax rate does not match calculated amount");
    }
  }
  return errors;
}

function extractCode(type: string | undefined): string | undefined {
  return type?.split(" (")[0];
}

export function calcTaxesAndItemTotal(
  netTotal: number,
  taxes: ITaxesGrid[],
  valueDifference: number,
  rowDiscount: number
) {
  if (!taxes || taxes.length === 0) {
    return {
      taxesTotal: 0,
      totalTaxableFees: 0,
      itemTotal: netTotal,
      grandTotal: Math.max(0, netTotal - rowDiscount),
    };
  }
  let totalAmount = 0;
  let totalTaxableFees = 0; // only exist on Taxes from T5 to T12
  let sumT2AndT3 = 0; // sum T2 & T3 Taxes amount if exist to add on T1 Taxes

  // Include ad-hoc amount-only taxes (no ETA code like T1..T20)
  taxes?.forEach((element: ITaxesGrid) => {
    const code = extractCode(element?.taxType);
    const isEta = !!code && /^T\d+$/i.test(code);
    if (!isEta) {
      const amount = Number(element.taxAmount) || 0;
      if (amount > 0) {
        totalAmount += amount;
      }
    }
  });

  // T5..T12
  taxes?.forEach((element: ITaxesGrid) => {
    const code = extractCode(element?.taxType);
    if (
      code == "T5" ||
      code == "T6" ||
      code == "T7" ||
      code == "T8" ||
      code == "T9" ||
      code == "T10" ||
      code == "T11" ||
      code == "T12"
    ) {
      const rateAmount = element?.taxRate
        ? (Number(element.taxRate) * +netTotal) / 100
        : undefined;
      const amount = rateAmount ?? Number(element.taxAmount);
      totalAmount += amount;
      totalTaxableFees += amount;
      element.taxAmount = priceRangeHandle(amount);
    }
  });

  // T2..T3
  taxes?.forEach((element: ITaxesGrid) => {
    const code = extractCode(element?.taxType);
    if (code == "T2" || code == "T3") {
      const base = +netTotal + +valueDifference + +totalTaxableFees;
      const rateAmount = element?.taxRate
        ? (Number(element.taxRate) * base) / 100
        : undefined;
      const amount = rateAmount ?? Number(element.taxAmount);
      totalAmount += amount;
      sumT2AndT3 += amount;
      element.taxAmount = priceRangeHandle(amount);
    }
  });

  // T1
  taxes?.forEach((element: ITaxesGrid) => {
    const code = extractCode(element?.taxType);
    if (code == "T1") {
      const base =
        +netTotal + +valueDifference + +totalTaxableFees + +sumT2AndT3;
      const rateAmount = element?.taxRate
        ? (Number(element.taxRate) * base) / 100
        : undefined;
      const amount = rateAmount ?? Number(element.taxAmount);
      totalAmount += amount;
      element.taxAmount = priceRangeHandle(amount);
    }
  });

  // T13..T20
  taxes?.forEach((element: ITaxesGrid) => {
    const code = extractCode(element?.taxType);
    if (
      code == "T13" ||
      code == "T14" ||
      code == "T15" ||
      code == "T16" ||
      code == "T17" ||
      code == "T18" ||
      code == "T19" ||
      code == "T20"
    ) {
      const rateAmount = element?.taxRate
        ? (Number(element.taxRate) * +netTotal) / 100
        : undefined;
      const amount = rateAmount ?? Number(element.taxAmount);
      totalAmount += amount;
      element.taxAmount = priceRangeHandle(amount);
    }
  });

  // T4
  let t4Val = 0;
  taxes?.forEach((element: ITaxesGrid) => {
    const code = extractCode(element?.taxType);
    if (code == "T4") {
      const base = +netTotal - +rowDiscount;
      const rateAmount = element?.taxRate
        ? (Number(element.taxRate) * base) / 100
        : undefined;
      const amount = rateAmount ?? Number(element.taxAmount);
      t4Val += amount;
      element.taxAmount = priceRangeHandle(amount);
    }
  });

  const itemTotal = +totalAmount + +netTotal;
  const grandTotal = +itemTotal - +rowDiscount - +t4Val;

  return {
    taxesTotal: +netTotal <= 0 ? 0 : priceRangeHandle(totalAmount),
    totalTaxableFees: +netTotal <= 0 ? 0 : priceRangeHandle(totalTaxableFees),
    itemTotal: +netTotal <= 0 ? 0 : priceRangeHandle(itemTotal),
    grandTotal: +netTotal <= 0 ? 0 : priceRangeHandle(grandTotal),
  };
}

export function calcDocumentTotals(itemRows: IItemRows[], extraDiscount = 0) {
  let totalTaxableFees = 0;
  let sales = 0;
  let netTotal = 0;
  let totalTaxes = 0;
  let total = 0;
  const discount = extraDiscount || 0;
  let taxArray: ITaxesTotalList[] = [];
  if (itemRows?.length > 0) {
    const taxesList = [...itemRows];
    for (const element of taxesList) {
      totalTaxableFees += Number((element as any).itemTotalTaxableFees ?? 0);
      sales += Number(element.itemTotalSalesAmount);
      netTotal += Number(element.itemNetTotal);
      totalTaxes += +priceRangeHandle(element.itemTaxesTotal);
      total += Number(element.itemGrandTotal);
      element?.itemTaxes?.forEach((tax) => {
        const taxExist: ITaxesTotalList | undefined = taxArray.find(
          (row) => row.taxType == tax.taxType
        );
        const otherTaxes = taxArray.filter((row) => row.taxType != tax.taxType);
        if (taxExist) {
          const totatTax: number =
            Number(tax.taxAmount) + Number(taxExist.amount);
          taxArray = [
            ...otherTaxes,
            { taxType: tax.taxType, amount: totatTax },
          ];
        } else {
          taxArray.push({
            taxType: tax.taxType,
            amount: Number(tax.taxAmount),
          });
        }
      });
    }
  }
  let totalAfterDiscount = 0;
  if (extraDiscount) {
    totalAfterDiscount = total - Number(discount);
  } else {
    totalAfterDiscount = total;
  }
  return {
    totalTaxableFees: priceRangeHandle(totalTaxableFees),
    sales: priceRangeHandle(sales),
    netTotal: priceRangeHandle(netTotal),
    taxArray,
    totalTaxes: priceRangeHandle(totalTaxes),
    extraDiscount: priceRangeHandle(extraDiscount),
    total: priceRangeHandle(totalAfterDiscount),
  };
}
