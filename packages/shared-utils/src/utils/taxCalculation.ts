// utils/taxCalculation.ts - Tax calculation functions for ETA compliance

export interface ITaxesGrid {
  id?: number;
  lookupTaxableTypeId?: number;
  lookupTaxableSubTypeId?: number;
  taxType: string;
  taxRate?: number;
  taxAmount?: number;
  typeCode?: string;
  subTypeCode?: string;
  enDescription?: string;
}

export interface ITaxesTotalList {
  taxType: string;
  amount: number;
}

export interface IItemRows {
  itemTotalTaxableFees: number;
  itemTotalSalesAmount: number;
  itemNetTotal: number;
  itemTaxesTotal: number;
  itemGrandTotal: number;
  itemTaxes: ITaxesGrid[];
}

export function calcTaxesAndItemTotal(
  netTotal: number,
  taxes: ITaxesGrid[],
  valueDifference: number,
  rowDiscount: number
) {
  // valueDifference only apply for taxes (T1 to T4)
  let totalAmount = 0;
  let totalTaxableFees = 0; // only exist on Taxes from T5 to T12
  let sumT2AndT3 = 0; // sum T2 & T3 Taxes amount if exist to add on T1 Taxes

  // Check taxes from T5 to T12
  taxes?.forEach((element: ITaxesGrid) => {
    if (
      element?.taxType?.split(" (")[0] == "T5" ||
      element?.taxType?.split(" (")[0] == "T6" ||
      element?.taxType?.split(" (")[0] == "T7" ||
      element?.taxType?.split(" (")[0] == "T8" ||
      element?.taxType?.split(" (")[0] == "T9" ||
      element?.taxType?.split(" (")[0] == "T10" ||
      element?.taxType?.split(" (")[0] == "T11" ||
      element?.taxType?.split(" (")[0] == "T12"
    ) {
      if (element?.taxRate) {
        const amount: number = (Number(element.taxRate) * +netTotal) / 100;
        totalAmount += amount;
        totalTaxableFees += amount;
        element.taxAmount = amount;
      } else {
        totalAmount += Number(element.taxAmount);
        totalTaxableFees += Number(element.taxAmount);
      }
    }
  });

  // Check taxes from T2 to T3
  taxes?.forEach((element: ITaxesGrid) => {
    if (
      element?.taxType?.split(" (")[0] == "T2" ||
      element?.taxType?.split(" (")[0] == "T3"
    ) {
      if (element?.taxRate) {
        const amount: number =
          (Number(element.taxRate) *
            (+netTotal + +valueDifference + +totalTaxableFees)) /
          100;
        totalAmount += amount;
        sumT2AndT3 += amount;
        element.taxAmount = amount;
      } else {
        totalAmount += Number(element.taxAmount);
        sumT2AndT3 += Number(element.taxAmount);
      }
    }
  });

  // Check taxes from T1
  taxes?.forEach((element: ITaxesGrid) => {
    if (element?.taxType?.split(" (")[0] == "T1") {
      if (element?.taxRate) {
        const amount: number =
          (Number(element.taxRate) *
            (+netTotal + +valueDifference + +totalTaxableFees + +sumT2AndT3)) /
          100;
        totalAmount += amount;
        element.taxAmount = amount;
      } else {
        totalAmount += Number(element.taxAmount);
      }
    }
  });

  // Check taxes from T13 to 20
  taxes?.forEach((element: ITaxesGrid) => {
    if (
      element?.taxType?.split(" (")[0] == "T13" ||
      element?.taxType?.split(" (")[0] == "T14" ||
      element?.taxType?.split(" (")[0] == "T15" ||
      element?.taxType?.split(" (")[0] == "T16" ||
      element?.taxType?.split(" (")[0] == "T17" ||
      element?.taxType?.split(" (")[0] == "T18" ||
      element?.taxType?.split(" (")[0] == "T19" ||
      element?.taxType?.split(" (")[0] == "T20"
    ) {
      if (element?.taxRate) {
        const amount: number = (Number(element.taxRate) * +netTotal) / 100;
        totalAmount += amount;
        element.taxAmount = amount;
      } else {
        totalAmount += Number(element.taxAmount);
      }
    }
  });

  // // Check taxes from T4
  let t4Val = 0;
  taxes?.forEach((element: ITaxesGrid) => {
    if (element?.taxType?.split(" (")[0] == "T4") {
      if (element?.taxRate) {
        const amount: number =
          (Number(element.taxRate) * (+netTotal - +rowDiscount)) / 100;
        t4Val += amount;
        element.taxAmount = amount;
      } else {
        t4Val += Number(element.taxAmount);
      }
    }
  });

  const itemTotal = +totalAmount + +netTotal;
  const grandTotal = +itemTotal - +rowDiscount - +t4Val;

  return {
    taxesTotal: +netTotal <= 0 ? 0 : totalAmount,
    totalTaxableFees: +netTotal <= 0 ? 0 : totalTaxableFees,
    itemTotal: +netTotal <= 0 ? 0 : itemTotal,
    grandTotal: +netTotal <= 0 ? 0 : grandTotal,
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
      totalTaxableFees += Number(element.itemTotalTaxableFees);
      sales += Number(element.itemTotalSalesAmount);
      netTotal += Number(element.itemNetTotal);
      totalTaxes += element.itemTaxesTotal;
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
    totalTaxableFees: totalTaxableFees,
    sales: sales,
    netTotal: netTotal,
    taxArray,
    totalTaxes: totalTaxes,
    extraDiscount: extraDiscount,
    total: totalAfterDiscount,
  };
}

export function convertLineTaxesToTaxesGrid(
  lineTaxes: unknown[]
): ITaxesGrid[] {
  return lineTaxes.map((tax) => {
    const t = tax as {
      id: number;
      lookupTaxableTypeId: number;
      lookupTaxableSubTypeId: number;
      typeCode: string;
      enDescription: string;
      rate: number | null;
      amount: number;
      subTypeCode: string;
    };
    return {
      id: t.id,
      lookupTaxableTypeId: t.lookupTaxableTypeId,
      lookupTaxableSubTypeId: t.lookupTaxableSubTypeId,
      taxType: `${t.typeCode} (${t.enDescription})`,
      taxRate: t.rate ?? undefined,
      taxAmount: t.amount,
      typeCode: t.typeCode,
      subTypeCode: t.subTypeCode,
      enDescription: t.enDescription,
    };
  });
}
