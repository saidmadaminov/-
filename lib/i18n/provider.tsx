"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Dictionary } from "./ru";
import { getDictionary, normalizeLocale, type Locale } from "./index";

const I18nContext = createContext<{ locale: Locale; t: Dictionary }>({
  locale: "ru",
  t: getDictionary("ru"),
});

export function I18nProvider({
  locale,
  children,
}: {
  locale: string | undefined | null;
  children: ReactNode;
}) {
  const loc = normalizeLocale(locale);
  return (
    <I18nContext.Provider value={{ locale: loc, t: getDictionary(loc) }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
