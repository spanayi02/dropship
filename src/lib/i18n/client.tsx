"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { makeT, intlLocale, type Locale, type TFunction } from "./index";

interface I18nContextValue {
  locale: Locale;
  intl: string;
  t: TFunction;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const value = useMemo<I18nContextValue>(
    () => ({ locale, intl: intlLocale(locale), t: makeT(locale) }),
    [locale]
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    // Safe fallback so components still render outside the provider (e.g. tests)
    return { locale: "en", intl: "en-IE", t: makeT("en") };
  }
  return ctx;
}
