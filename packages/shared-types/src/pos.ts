export interface POS {
  id: number;
  code: string;
  companyLocationId: number;
  companyLocationCode: string;
  companyLocationAddress: string;
  serialNumber: string;
  lastSentUUID: string;
  osVersion: string;
  clientId: string;
  clientSecret: string;
  isDefault: boolean;
  isActive: boolean;
  supervisors: supervisors[];
  cashiers: cashiers[];
  open: boolean;
}
export interface supervisors {
  id: number;
  employeeId: number;
  employeeName: string;
  employeeNameAr: string;
  pin: string;
}
export interface cashiers {
  id: number;
  employeeId: number;
  employeeName: string;
  employeeNameAr: string;
}

export interface Shift {
  id: number;
  posId: number;
  cashierId: number;
  employeeId: number;
  startDate: string;
  endDate: string;
  startCash: number;
  cashAmount: number;
  startVisa: number;
  visaAmount: number;
}
