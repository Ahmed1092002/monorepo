// utils/priceHandle.ts - Centralized rounding helper for currency values

export function priceRangeHandle(value: number, fractionDigits = 2): number {
  if (!isFinite(value)) return 0;
  const factor = Math.pow(10, fractionDigits);
  return Math.round(value * factor) / factor;
}
