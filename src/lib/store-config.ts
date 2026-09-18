/**
 * Store-wide constants that both server and client can import.
 * Money is stored in integer minor units (cents) everywhere.
 */
export const STORE_CURRENCY = (process.env.NEXT_PUBLIC_CURRENCY ?? "EUR").toUpperCase();
export const STORE_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "WishlistAZ";

/** Free shipping threshold and flat rate, in minor units. Overridable via StoreSettings in DB. */
export const FREE_SHIPPING_THRESHOLD = Number(process.env.NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD ?? 5000);
export const FLAT_SHIPPING_RATE = Number(process.env.NEXT_PUBLIC_FLAT_SHIPPING_RATE ?? 490);

/** Where the store is based; used for "ships to" defaults and route lines. */
export const HOME_COUNTRY = "CY";

/** ISO country codes we treat as "inside the EU" for the no-customs promise. */
export const EU_COUNTRIES = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE",
  "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE",
]);

export function isEuCountry(code?: string | null): boolean {
  return !!code && EU_COUNTRIES.has(code.toUpperCase());
}
