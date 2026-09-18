import "server-only";
import { cookies, headers } from "next/headers";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  isLocale,
  makeT,
  type Locale,
} from "./index";

/**
 * Resolve the UI locale for the current request.
 * Order: explicit cookie → Accept-Language (el) → default (en).
 */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const fromCookie = store.get(LOCALE_COOKIE)?.value;
  if (isLocale(fromCookie)) return fromCookie;

  const accept = (await headers()).get("accept-language") ?? "";
  if (/^el\b|,\s*el\b/i.test(accept)) return "el";
  return DEFAULT_LOCALE;
}

export async function getT() {
  const locale = await getLocale();
  return { t: makeT(locale), locale };
}
