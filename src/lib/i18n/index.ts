import { en, type Dictionary } from "./dictionaries/en";
import { el } from "./dictionaries/el";

export type Locale = "en" | "el";
export const LOCALES: Locale[] = ["en", "el"];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "wl_locale";

export const dictionaries: Record<Locale, Dictionary> = { en, el };

export function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "el";
}

/** Intl locale tag used for number/date formatting per UI locale. */
export function intlLocale(locale: Locale): string {
  return locale === "el" ? "el-GR" : "en-IE";
}

type Params = Record<string, string | number>;

/** Replace {name} placeholders. */
export function interpolate(template: string, params?: Params): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    params[key] !== undefined ? String(params[key]) : `{${key}}`
  );
}

type PathKeys<T, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends string
    ? `${Prefix}${K}`
    : T[K] extends Record<string, unknown>
      ? PathKeys<T[K], `${Prefix}${K}.`>
      : never;
}[keyof T & string];

export type TKey = PathKeys<Dictionary>;

function getPath(dict: Dictionary, key: string): string | undefined {
  const parts = key.split(".");
  let cur: unknown = dict;
  for (const p of parts) {
    if (cur && typeof cur === "object" && p in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      return undefined;
    }
  }
  return typeof cur === "string" ? cur : undefined;
}

export function makeT(locale: Locale) {
  const dict = dictionaries[locale];
  const fallback = dictionaries[DEFAULT_LOCALE];
  return function t(key: TKey, params?: Params): string {
    const raw = getPath(dict, key) ?? getPath(fallback, key) ?? key;
    return interpolate(raw, params);
  };
}

export type TFunction = ReturnType<typeof makeT>;
