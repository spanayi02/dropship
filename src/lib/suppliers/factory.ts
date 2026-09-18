import type { Prisma, Supplier, SupplierApiType } from "@prisma/client";
import { db } from "@/lib/db";
import { AliExpressAdapter } from "./aliexpress";
import { CJDropshippingAdapter, type CJAdapterOptions, type CJCredentials } from "./cj";
import { AlibabaAdapter, MadeInChinaAdapter, ManualSupplierAdapter } from "./manual";
import { SupplierNotConfiguredError, type SupplierAdapter } from "./types";

/** Supplier types whose adapter can place orders and report status by API. */
export const API_SUPPLIER_TYPES: SupplierApiType[] = ["CJ"];

export function isApiSupplier(apiType: SupplierApiType | string): boolean {
  return API_SUPPLIER_TYPES.includes(apiType.toUpperCase() as SupplierApiType);
}

/**
 * Read CJ credentials for a supplier row, falling back to CJ_API_KEY from the
 * environment so a fresh deployment works before anything is typed into the
 * admin. Row credentials win when both exist.
 */
export function resolveCJCredentials(raw: unknown): CJCredentials | null {
  const fromRow =
    raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const apiKey =
    (typeof fromRow.apiKey === "string" && fromRow.apiKey.trim()) || process.env.CJ_API_KEY?.trim();
  if (!apiKey) return null;
  const str = (k: string) => (typeof fromRow[k] === "string" ? (fromRow[k] as string) : undefined);
  return {
    apiKey,
    email: str("email"),
    accessToken: str("accessToken"),
    accessTokenExpiresAt: str("accessTokenExpiresAt"),
    refreshToken: str("refreshToken"),
    refreshTokenExpiresAt: str("refreshTokenExpiresAt"),
    openId: str("openId") ?? process.env.CJ_OPEN_ID?.trim() ?? undefined,
  };
}

type SupplierLike = Pick<Supplier, "id" | "name" | "apiType" | "apiCredentials"> &
  Partial<Pick<Supplier, "warehouseCountry">>;

/**
 * Build the adapter for a supplier row. This is the entry point everything
 * (auto-order, crons, admin import) should use: it wires token persistence
 * and per-supplier defaults (warehouse country) in one place.
 */
export function adapterForSupplier(
  supplier: SupplierLike,
  cjOptions: CJAdapterOptions = {}
): SupplierAdapter {
  const base = { supplierId: supplier.id, name: supplier.name };
  switch (supplier.apiType) {
    case "CJ": {
      const creds = resolveCJCredentials(supplier.apiCredentials);
      if (!creds) {
        throw new SupplierNotConfiguredError(
          `Supplier "${supplier.name}" is CJ Dropshipping but has no API key. Add it in Admin → Suppliers → Edit, or set CJ_API_KEY.`
        );
      }
      return new CJDropshippingAdapter(creds, {
        fromCountryCode: supplier.warehouseCountry ?? undefined,
        ...cjOptions,
        persistCredentials: async (next) => {
          // Only persist to the row when the key came from the row, so an env-only
          // key never gets copied into the database behind the owner's back.
          const rowKey = (supplier.apiCredentials as { apiKey?: string } | null)?.apiKey;
          if (!rowKey) return;
          await db.supplier.update({
            where: { id: supplier.id },
            data: { apiCredentials: next as unknown as Prisma.InputJsonValue },
          });
          await cjOptions.persistCredentials?.(next);
        },
      });
    }
    case "ALIEXPRESS":
      return new AliExpressAdapter(base);
    case "ALIBABA":
      return new AlibabaAdapter(base);
    case "MADE_IN_CHINA":
      return new MadeInChinaAdapter(base);
    case "MANUAL":
    case "CUSTOM":
    default:
      return new ManualSupplierAdapter({ ...base, apiType: supplier.apiType });
  }
}

/**
 * Legacy signature kept for callers that only have a type string. Prefer
 * adapterForSupplier(): without the supplier row, CJ tokens cannot be cached
 * and manual lookups are not scoped to one supplier.
 */
export function getSupplierAdapter(type: string, credentials?: unknown): SupplierAdapter {
  switch (type.toLowerCase()) {
    case "cj": {
      const creds = resolveCJCredentials(credentials);
      if (!creds) {
        throw new SupplierNotConfiguredError(
          "CJ Dropshipping requires an API key (supplier credentials or CJ_API_KEY)."
        );
      }
      return new CJDropshippingAdapter(creds);
    }
    case "aliexpress":
      return new AliExpressAdapter();
    case "alibaba":
      return new AlibabaAdapter();
    case "made_in_china":
    case "made-in-china":
    case "madeinchina":
      return new MadeInChinaAdapter();
    case "manual":
    case "custom":
      return new ManualSupplierAdapter({ apiType: type.toUpperCase() as SupplierApiType });
    default:
      throw new Error(`Unknown supplier adapter type: ${type}`);
  }
}

/** The CJ supplier row used for catalog import: first active CJ supplier with a key (row or env). */
export async function findImportableCJSupplier() {
  const suppliers = await db.supplier.findMany({
    where: { apiType: "CJ", isActive: true },
    orderBy: { createdAt: "asc" },
  });
  return suppliers.find((s) => resolveCJCredentials(s.apiCredentials) !== null) ?? null;
}
