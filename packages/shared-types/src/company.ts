export interface CompanyLocation {
  id: number;
  code: string;
  address: string;
  shortName: string;
  isDefault: boolean;
}

export interface TaxActivityCode {
  id: number;
  code: string;
  isDefault: boolean;
}

export interface Contact {
  id: number;
  first: string;
  middle: string;
  last: string;
  full: string;
  firstAr: string | null;
  middleAr: string | null;
  lastAr: string | null;
  fullAr: string | null;
  title: number;
  position: string;
  phone: string;
  mobile: string;
  email: string;
  fax: string | null;
  type: number;
  isPreferred: boolean | null;
  contactInfo: any | null;
}

export interface CompanyLocationByCompanyId {
  id: number;
  code: string;
  address: string;
  shortName: string;
  locationTypeId: number;
  locationTypeCode: string;
  locationTypeName: string;
  isDefault: boolean;
  hasProducts: boolean;
  governmentId: number;
  cityId: number;
  postalCode: string;
  street: string;
  buildingNo: string;
  floor: string;
  room: string;
  landmark: string;
  additionalInfo: any | null;
  publicLink: string;
  taxActivityCodes: TaxActivityCode[];
  contacts: Contact[];
}
