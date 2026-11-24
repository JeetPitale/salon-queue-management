"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { translations, serviceTranslations, Language, formatLocalizedNumber } from "@/lib/i18n";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations.en) => string;
  tService: (serviceName: string) => string;
  tNumber: (val: number | string | null | undefined) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
  t: (key) => translations.en[key] || String(key),
  tService: (name) => name,
  tNumber: (val) => (val === null || val === undefined ? "" : String(val)),
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    const saved = localStorage.getItem("preferred_lang") as Language;
    if (saved && (saved === "en" || saved === "hi" || saved === "gu")) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("preferred_lang", lang);
  };

  const t = (key: keyof typeof translations.en): string => {
    const dict = translations[language] || translations.en;
    return dict[key] || translations.en[key] || String(key);
  };

  const tService = (serviceName: string): string => {
    if (language === "hi") {
      return serviceTranslations[serviceName]?.hi || serviceName;
    }
    if (language === "gu") {
      return serviceTranslations[serviceName]?.gu || serviceName;
    }
    return serviceName;
  };

  const tNumber = (val: number | string | null | undefined): string => {
    return formatLocalizedNumber(val, language);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, tService, tNumber }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
