import { createContext, useContext } from "react";
import type { LanguageList, Language } from "@monorepo/shared-types";

interface LocalizationContextType {
  languages?: LanguageList;
  language?: Language;
  selectedLanguageId: number;
  isLoading?: boolean;
  error?: unknown;
  selectLanguage: (languageId: number) => Promise<void>;
  refetchLanguages: () => void;
  refetchLanguage: () => void;
  isInitialized: boolean;
}

export const LocalizationContext = createContext<LocalizationContextType>({
  selectedLanguageId: 1,
  selectLanguage: async () => {},
  refetchLanguages: () => {},
  refetchLanguage: () => {},
  isInitialized: false,
});

export function useLocalization() {
  return useContext(LocalizationContext);
}
