export interface Category {
  id: number;
  code: string;
  title: string;
  value: string;
}

export interface Tag {
  id: number;
  tag: string;
  code: string;
}

export interface Tax {
  id: number;
  taxId: number;
  value: number;
  typeCode: string;
  subTypeCode: string;
  enDescription: string;
  arDescription: string;
  isRated: boolean;
}

export interface Vendor {
  id: number;
  vendorId: number;
  vendorCode: string;
  measureUnitId: number;
  numberOfUnits: number;
  costPrice: number;
  discount: number;
  recommendedSellingPrice: number;
}

export interface Product {
  id: number;
  companyId: number;
  note: string;
  code: string;
  type: string;
  unitTypeId: number;
  standardBarcode: string;
  customBarcode: string;
  isActive: boolean;
  name: string;
  nameAr: string;
  desc: string;
  descAr: string;
  etaItemCodeType: string;
  etaItemCode: string;
  etaUnitType: string;
  categoryId: number;
  category: string;
  manufacturerId: number;
  manufacturer: string;
  brandId: number;
  brand: string;
  sizeId: number;
  size: string;
  colorId: number;
  color: string;
  hsCode: string;
  countryId: number;
  city: string;
  tags: Tag[];
  lengthQty: number;
  widthQty: number;
  heightQty: number;
  dimensionsId: number;
  weightQty: number;
  weightId: number;
  areaQty: number;
  areaId: number;
  volumeQty: number;
  volumeId: number;
  sellingPrice: number;
  minSellingPrice: number;
  taxes: Tax[];
  vendors: Vendor[];
  existInAll: boolean;
  locationsIds: number[];
  imageUrl: string;
}

export interface ProductResponse {
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  data: Product[];
}

export type CatalogItem = {
  id: string;
  name: string;
  code: string;
  price: number;
  category: string;
  imageUrl?: string;
  nameAr?: string;
};

export interface ProductWithBalance {
  companyId: number;
  note: string;
  id: number;
  code: string;
  type: string;
  unitTypeId: number;
  standardBarcode: string;
  customBarcode: string;
  isActive: boolean;
  name: string;
  nameAr: string;
  desc: string;
  descAr: string;
  etaItemCodeType: string;
  etaItemCode: string;
  etaUnitTypeId: number;
  etaUnitType: string;
  categoryId: number | null;
  category: string | null;
  manufacturerId: number | null;
  manufacturer: string | null;
  brandId: number | null;
  brand: string | null;
  sizeId: number | null;
  size: string | null;
  colorId: number | null;
  color: string | null;
  hsCode: string;
  countryId: number | null;
  city: string;
  tags: Tag[];
  lengthQty: number | null;
  widthQty: number | null;
  heightQty: number | null;
  dimensionsId: number | null;
  weightQty: number | null;
  weightId: number | null;
  areaQty: number | null;
  areaId: number | null;
  volumeQty: number | null;
  volumeId: number | null;
  sellingPrice: number | null;
  minSellingPrice: number | null;
  taxes: Tax[];
  currentBalance: number | null;
  minBalance: number | null;
  vendors: Vendor[];
  balance: number;
  existInAll: boolean | null;
  locationsIds: number[] | null;
  imageUrl?: string;
}
