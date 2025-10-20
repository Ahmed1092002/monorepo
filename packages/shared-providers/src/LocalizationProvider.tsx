import {
  useGetLanguagesQuery,
  useGetLanguageByIdQuery,
} from "@monorepo/shared-api";
import { useEffect, useState, useCallback, useRef } from "react";
import { LocalizationContext } from "./LocalizationContext";
import * as db from "@monorepo/shared-utils";
import type { LanguageList, Language } from "@monorepo/shared-types";
import i18next from "./i18n";
import { useOfflineStatus } from "@monorepo/shared-utils";

export function LocalizationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isOffline } = useOfflineStatus();

  const [selectedLanguageId, setSelectedLanguageId] = useState<number>(1);
  const [languagesCache, setLanguagesCache] = useState<Language[]>([]);
  const [currentLanguage, setCurrentLanguage] = useState<Language | undefined>(
    undefined
  );
  const [isInitialized, setIsInitialized] = useState(false);

  const [skipLanguagesList, setSkipLanguagesList] = useState(true);
  const [skipLanguageById, setSkipLanguageById] = useState(true);

  const initializingRef = useRef(false);
  const versionCheckingRef = useRef(false);
  const lastAppliedLanguageRef = useRef<string>("");

  const { data: languagesData, isLoading: languagesLoading } =
    useGetLanguagesQuery(undefined, {
      skip: skipLanguagesList || isOffline,
    });

  const { data: languageByIdData } = useGetLanguageByIdQuery(
    { id: selectedLanguageId },
    {
      skip: skipLanguageById || isOffline,
      refetchOnMountOrArgChange: true,
    }
  );

  const applyLanguageToI18n = useCallback((language: Language) => {
    const languageCode = language.ISO || "en";
    const languageKey = `${language.id}_${language.version || 0}`;

    if (lastAppliedLanguageRef.current === languageKey) {
      return;
    }
    lastAppliedLanguageRef.current = languageKey;

    if (i18next.hasResourceBundle(languageCode, "translation")) {
      i18next.removeResourceBundle(languageCode, "translation");
    }

    i18next.addResourceBundle(
      languageCode,
      "translation",
      language.locales,
      true,
      true
    );

    i18next.changeLanguage(languageCode);

    const dir = language.isRTL ? "rtl" : "ltr";
    document.documentElement.setAttribute("dir", dir);
    document.documentElement.setAttribute(
      "lang",
      language.shortCode || languageCode
    );

    if (language.isRTL) {
      document.body.classList.add("rtl");
      document.body.classList.remove("ltr");
    } else {
      document.body.classList.add("ltr");
      document.body.classList.remove("rtl");
    }
  }, []);

  const setFallbackLanguage = useCallback(() => {
    i18next.changeLanguage("en");
    document.documentElement.setAttribute("dir", "ltr");
    document.documentElement.setAttribute("lang", "en");
    document.body.classList.add("ltr");
    document.body.classList.remove("rtl");
  }, []);

  const loadSelectedLanguage = useCallback(
    async (langId: number, languagesList: Language[]) => {
      const language = languagesList.find((lang) => Number(lang.id) === langId);

      if (language) {
        await db.set(`locale_${langId}`, language);
        setCurrentLanguage(language);
        applyLanguageToI18n(language);
      }
    },
    [applyLanguageToI18n]
  );

  useEffect(() => {
    const initialize = async () => {
      if (initializingRef.current || isInitialized) return;
      initializingRef.current = true;

      try {
        const savedLanguageId = await db.get("selectedLanguageId");
        if (savedLanguageId && typeof savedLanguageId === "number") {
          setSelectedLanguageId(savedLanguageId);
        }

        const cachedLanguagesData = (await db.get(
          "languages"
        )) as LanguageList | null;

        if (cachedLanguagesData?.data && cachedLanguagesData.data.length > 0) {
          setLanguagesCache(cachedLanguagesData.data);

          const langId = savedLanguageId || 1;
          const savedLocale = (await db.get(
            `locale_${langId}`
          )) as Language | null;

          if (savedLocale) {
            setCurrentLanguage(savedLocale);
            applyLanguageToI18n(savedLocale);
          }

          setSkipLanguageById(false);
        } else {
          setSkipLanguagesList(false);
        }

        setIsInitialized(true);
      } catch (error) {
        console.error("Initialization error:", error);
        setFallbackLanguage();
        setIsInitialized(true);
      } finally {
        initializingRef.current = false;
      }
    };

    initialize();
  }, [applyLanguageToI18n, setFallbackLanguage]);

  useEffect(() => {
    if (languagesData?.data && languagesData.data.length > 0) {
      db.set("languages", languagesData);
      setLanguagesCache(languagesData.data);
      setSkipLanguagesList(true);
      loadSelectedLanguage(selectedLanguageId, languagesData.data);
    }
  }, [languagesData, selectedLanguageId, loadSelectedLanguage]);

  useEffect(() => {
    const checkVersion = async () => {
      if (!languageByIdData || versionCheckingRef.current || !isInitialized)
        return;
      versionCheckingRef.current = true;

      try {
        const serverVersion = languageByIdData.version || 0;
        const cachedLocale = (await db.get(
          `locale_${selectedLanguageId}`
        )) as Language | null;
        const cachedVersion = cachedLocale?.version || 0;

        if (serverVersion > cachedVersion) {
          setSkipLanguagesList(false);
        } else {
          if (cachedLocale) {
            setCurrentLanguage(cachedLocale);
            applyLanguageToI18n(cachedLocale);
          }
        }

        setSkipLanguageById(true);
      } catch (error) {
        console.error("Version check error:", error);
      } finally {
        versionCheckingRef.current = false;
      }
    };

    checkVersion();
  }, [languageByIdData, selectedLanguageId, applyLanguageToI18n]);

  useEffect(() => {
    if (currentLanguage?.locales) {
      applyLanguageToI18n(currentLanguage);
    }
  }, [currentLanguage, applyLanguageToI18n]);

  const selectLanguage = useCallback(
    async (languageId: number) => {
      setSelectedLanguageId(languageId);
      await db.set("selectedLanguageId", languageId);

      const cachedLocale = (await db.get(
        `locale_${languageId}`
      )) as Language | null;

      if (cachedLocale) {
        setCurrentLanguage(cachedLocale);
        applyLanguageToI18n(cachedLocale);
        versionCheckingRef.current = false;
        setSkipLanguageById(false);
      } else {
        const language = languagesCache.find(
          (lang) => Number(lang.id) === languageId
        );

        if (language) {
          await db.set(`locale_${languageId}`, language);
          setCurrentLanguage(language);
          applyLanguageToI18n(language);
          versionCheckingRef.current = false;
          setSkipLanguageById(false);
        } else {
          setSkipLanguagesList(false);
        }
      }
    },
    [languagesCache, applyLanguageToI18n]
  );

  const forceRefresh = useCallback(() => {
    versionCheckingRef.current = false;
    setSkipLanguagesList(false);
    setSkipLanguageById(false);
  }, []);

  const contextValue = {
    languages: languagesData as any,
    language: currentLanguage,
    selectedLanguageId,
    isLoading: languagesLoading || !isInitialized,
    error: undefined,
    selectLanguage,
    refetchLanguages: forceRefresh,
    refetchLanguage: () => {
      versionCheckingRef.current = false;
      setSkipLanguageById(false);
    },
    isInitialized,
  };

  return (
    <LocalizationContext.Provider value={contextValue}>
      {children}
    </LocalizationContext.Provider>
  );
}
