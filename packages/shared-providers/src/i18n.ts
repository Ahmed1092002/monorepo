import i18next from "i18next";
import { initReactI18next } from "react-i18next";

i18next.use(initReactI18next).init({
  fallbackLng: "en",
  supportedLngs: ["en", "ar"],
  ns: ["translation"],
  defaultNS: "translation",
  load: "languageOnly",
  resources: {
    en: { translation: {} },
    ar: { translation: {} },
  },
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

export default i18next;
