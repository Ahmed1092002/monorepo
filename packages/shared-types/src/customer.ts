export const CustomerType = {
  Individual: 0,
  Company: 1,
} as const;
export type CustomerType = (typeof CustomerType)[keyof typeof CustomerType];

export type CreateCustomerPayload = {
  CustomerType: CustomerType;
  code: string;
  mobile: string;
  // individual fields (optional) - renamed keys
  first?: string;
  last?: string;
  gender?: string;
  firstAr?: string;
  nationality?: string;
  // removed locations
  email?: string;
};

export type CreateCustomerResponse = {
  id?: number;
  data?: { id?: number };
  [key: string]: unknown;
};

// Mirrors QuickCustomerModal onSave payload
export type QuickCustomerInput = {
  type: "individual";
  code: string;
  phoneNumber: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  firstNameAr?: string;
  nationality?: string;
};
