import gbFlag from "circle-flags/flags/gb.svg?url";
import itFlag from "circle-flags/flags/it.svg?url";
import { createI18n } from "vue-i18n";

import enGB from "./locales/en-GB.json";
import itIT from "./locales/it-IT.json";

/** Message schema, taken from the English file. */
export type MessageSchema = typeof enGB;

/** Locales the site is translated into. */
export type LocaleCode = "en-GB" | "it-IT";

/**
 * A selectable language.
 * @property code - BCP 47 tag, also the message file name
 * @property label - Name of the language in that language
 * @property flag - URL of the round flag icon
 */
export interface LocaleOption {
  code: LocaleCode;
  label: string;
  flag: string;
}

/** Every available language, in menu order. */
export const LOCALES: readonly LocaleOption[] = [
  { code: "en-GB", label: "English", flag: gbFlag },
  { code: "it-IT", label: "Italiano", flag: itFlag },
];

const STORAGE_KEY = "music:locale";

/**
 * Picks the starting locale: the stored choice, else the browser's
 * language, else English.
 * @returns The locale code
 */
function initialLocale(): LocaleCode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "en-GB" || stored === "it-IT") return stored;
  } catch {
    /* Storage blocked: fall back to the browser language. */
  }
  const preferred = typeof navigator === "undefined" ? [] : navigator.languages;
  return preferred.some((language) => language.toLowerCase().startsWith("it"))
    ? "it-IT"
    : "en-GB";
}

/** The app's i18n instance (Composition API mode). */
export const i18n = createI18n<[MessageSchema], LocaleCode, false>({
  legacy: false,
  locale: initialLocale(),
  fallbackLocale: "en-GB",
  messages: { "en-GB": enGB, "it-IT": itIT },
});

/**
 * Returns the active locale.
 * @returns The locale code
 */
export function currentLocale(): LocaleCode {
  return i18n.global.locale.value;
}

/**
 * Switches language, remembers it and updates `<html lang>`.
 * @param code - The new locale
 * @returns Nothing
 */
export function setLocale(code: LocaleCode): void {
  i18n.global.locale.value = code;
  if (typeof document !== "undefined") document.documentElement.lang = code;
  try {
    localStorage.setItem(STORAGE_KEY, code);
  } catch {
    /* Private mode: the choice lasts for this visit. */
  }
}
