/**
 * Supplier currency conversion.
 *
 * CJ quotes in USD; Alibaba / Made-in-China quotes are usually USD too. The
 * store prices in EUR (STORE_CURRENCY). Rates are configured, not fetched:
 * a wrong-but-known rate is easier to reason about than a live feed that
 * silently moves the margin. Set FX_<FROM>_<TO> in the environment, e.g.
 * FX_USD_EUR=0.92, and review it when you review supplier prices.
 */
import { STORE_CURRENCY } from "@/lib/store-config";

const DEFAULT_RATES: Record<string, number> = {
  USD_EUR: 0.92,
  EUR_USD: 1.09,
  CNY_EUR: 0.13,
  GBP_EUR: 1.17,
};

export function getFxRate(from: string, to: string = STORE_CURRENCY): number {
  const f = from.toUpperCase();
  const t = to.toUpperCase();
  if (f === t) return 1;
  const key = `${f}_${t}`;
  const fromEnv = process.env[`FX_${key}`];
  if (fromEnv) {
    const n = Number(fromEnv);
    if (Number.isFinite(n) && n > 0) return n;
    console.warn(`[currency] Ignoring invalid FX_${key}="${fromEnv}"`);
  }
  if (DEFAULT_RATES[key]) return DEFAULT_RATES[key];
  const inverseKey = `${t}_${f}`;
  const inverseEnv = process.env[`FX_${inverseKey}`];
  const inverse = inverseEnv ? Number(inverseEnv) : DEFAULT_RATES[inverseKey];
  if (inverse && Number.isFinite(inverse) && inverse > 0) return 1 / inverse;
  throw new Error(
    `No FX rate for ${f}→${t}. Set FX_${key} in the environment (see .env.example).`
  );
}

/** Convert a major-unit amount in `from` currency to store minor units (cents). */
export function toStoreCents(amount: number | string | null | undefined, from: string): number {
  const n = typeof amount === "string" ? parseFloat(amount) : amount ?? 0;
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * getFxRate(from) * 100);
}

/** CJ price strings can be a single value ("11.85") or a range ("1.00-2.00"). Take the low end. */
export function parseSupplierPrice(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return 0;
  const first = value.split(/\s*-{1,2}\s*/)[0]?.replace(/[^0-9.]/g, "");
  const n = parseFloat(first ?? "");
  return Number.isFinite(n) ? n : 0;
}
