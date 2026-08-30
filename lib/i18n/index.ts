import { ru, type Dictionary } from "./ru";
import { en } from "./en";

export type Locale = "ru" | "en";
export const LOCALES: Locale[] = ["ru", "en"];
export const LOCALE_COOKIE = "naydi_locale";

const dictionaries: Record<Locale, Dictionary> = { ru, en };

export function getDictionary(locale: Locale | string | undefined | null): Dictionary {
  return locale === "en" ? dictionaries.en : dictionaries.ru;
}

export function normalizeLocale(v: string | undefined | null): Locale {
  return v === "en" ? "en" : "ru";
}
