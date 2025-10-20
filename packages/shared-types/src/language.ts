export interface Language {
  ISO: string;
  fallbackLanguageId: string | null;
  id: string | number;
  isActive: boolean;
  isDefault: boolean;
  isRTL: boolean;
  locales: Record<string, string>;
  name: string;
  shortCode: string;
  version?: number; // Version field for tracking updates
}

export interface LanguageListData {
  id: number;
  name: string;
  ISO: string;
  shortCode: string;
  fallbackLanguageId: string | null;
  isRTL: boolean;
  isDefault: boolean;
  isActive: boolean;
  locales: Record<string, string>;
  version?: number;
}
export interface LanguageList {
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  data: LanguageListData[];
}
export interface locales {
  [key: string]: string;
}
