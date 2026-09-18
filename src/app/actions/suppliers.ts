"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Prisma, SupplierApiType } from "@prisma/client";
import { updateSupplierPrice } from "@/lib/pricing/engine";
import { CJDropshippingAdapter } from "@/lib/suppliers/cj";
import { adapterForSupplier, resolveCJCredentials } from "@/lib/suppliers/factory";

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
}

export interface UpsertSupplierData {
  name: string;
  website?: string;
  apiType?: SupplierApiType;
  /**
   * CJ API key. Empty string / undefined on edit means "keep the saved key
   * (and its cached tokens)". Only CJ suppliers store credentials.
   */
  cjApiKey?: string;
  rating?: number;
  avgShippingDays?: number;
  warehouseCountry?: string;
  leadTimeDays?: number;
  contactEmail?: string;
  contactUrl?: string;
  paymentTerms?: string;
  notes?: string;
  isActive?: boolean;
}

function clean(value?: string | null): string | null {
  const v = value?.trim();
  return v ? v : null;
}

export async function upsertSupplier(
  data: UpsertSupplierData,
  id?: string
): Promise<{ success: boolean; supplierId?: string; error?: string }> {
  try {
    await requireAdmin();

    const apiType = data.apiType ?? "MANUAL";
    const existing = id
      ? await db.supplier.findUnique({ where: { id }, select: { apiCredentials: true, apiType: true } })
      : null;

    let apiCredentials: Prisma.InputJsonValue | typeof Prisma.DbNull = Prisma.DbNull;
    if (apiType === "CJ") {
      const newKey = data.cjApiKey?.trim();
      const saved = existing?.apiType === "CJ" ? resolveCJCredentials(existing.apiCredentials) : null;
      const savedRowKey = (existing?.apiCredentials as { apiKey?: string } | null)?.apiKey;
      if (newKey && newKey !== savedRowKey) {
        apiCredentials = { apiKey: newKey }; // new key → old tokens are void
      } else if (savedRowKey && saved) {
        apiCredentials = existing!.apiCredentials as Prisma.InputJsonValue; // keep key + tokens
      } else if (!process.env.CJ_API_KEY) {
        return { success: false, error: "CJ Dropshipping needs an API key (or set CJ_API_KEY in the environment)." };
      }
    }

    const warehouseCountry = clean(data.warehouseCountry)?.toUpperCase() ?? null;
    if (warehouseCountry && !/^[A-Z]{2}$/.test(warehouseCountry)) {
      return { success: false, error: "Warehouse country must be a 2-letter ISO code (DE, CN, CY…)." };
    }

    const payload = {
      name: data.name.trim(),
      website: clean(data.website),
      apiType,
      apiCredentials,
      rating: data.rating ?? null,
      avgShippingDays: data.avgShippingDays ?? null,
      warehouseCountry,
      leadTimeDays: data.leadTimeDays ?? null,
      contactEmail: clean(data.contactEmail),
      contactUrl: clean(data.contactUrl),
      paymentTerms: clean(data.paymentTerms),
      notes: clean(data.notes),
      isActive: data.isActive ?? true,
    };

    if (id) {
      const supplier = await db.supplier.update({ where: { id }, data: payload });
      revalidatePath("/admin/suppliers");
      revalidatePath(`/admin/suppliers/${id}`);
      return { success: true, supplierId: supplier.id };
    } else {
      const supplier = await db.supplier.create({ data: payload });
      revalidatePath("/admin/suppliers");
      return { success: true, supplierId: supplier.id };
    }
  } catch (error) {
    console.error("[upsertSupplier]", error);
    return { success: false, error: "Failed to save supplier" };
  }
}

/**
 * Round-trip to the supplier API with either a key typed in the form (not yet
 * saved) or the saved credentials of an existing supplier.
 */
export async function testSupplierConnection(input: {
  supplierId?: string;
  apiType: SupplierApiType;
  cjApiKey?: string;
}): Promise<{ ok: boolean; message: string }> {
  try {
    await requireAdmin();

    if (input.apiType !== "CJ") {
      return {
        ok: true,
        message: "This supplier type has no API. Prices and stock come from your listings; orders go through the supplier queue.",
      };
    }

    const typed = input.cjApiKey?.trim();
    if (typed) {
      const adapter = new CJDropshippingAdapter({ apiKey: typed });
      return await adapter.testConnection();
    }

    if (input.supplierId) {
      const supplier = await db.supplier.findUnique({ where: { id: input.supplierId } });
      if (!supplier) return { ok: false, message: "Supplier not found" };
      const adapter = adapterForSupplier(supplier);
      if (!adapter.testConnection) return { ok: false, message: "Adapter cannot test connections" };
      return await adapter.testConnection();
    }

    if (process.env.CJ_API_KEY) {
      const adapter = new CJDropshippingAdapter({ apiKey: process.env.CJ_API_KEY });
      const r = await adapter.testConnection();
      return { ...r, message: `${r.message} (using CJ_API_KEY from the environment)` };
    }

    return { ok: false, message: "Enter an API key first." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Connection test failed" };
  }
}

export async function deleteSupplier(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();

    const activeProducts = await db.productSupplier.count({
      where: {
        supplierId: id,
        product: { isActive: true },
      },
    });

    if (activeProducts > 0) {
      return {
        success: false,
        error: `Cannot delete: supplier has ${activeProducts} active product(s)`,
      };
    }

    await db.supplier.delete({ where: { id } });

    revalidatePath("/admin/suppliers");
    return { success: true };
  } catch (error) {
    console.error("[deleteSupplier]", error);
    return { success: false, error: "Failed to delete supplier" };
  }
}

export async function lockSupplier(
  productId: string,
  supplierId: string,
  locked: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();

    await db.productSupplier.update({
      where: { productId_supplierId: { productId, supplierId } },
      data: { isLocked: locked },
    });

    revalidatePath(`/admin/suppliers/${supplierId}`);
    return { success: true };
  } catch (error) {
    console.error("[lockSupplier]", error);
    return { success: false, error: "Failed to update lock status" };
  }
}

export async function updateProductSupplierPrice(
  productId: string,
  supplierId: string,
  costPrice: number,
  shippingCost: number,
  inStock: boolean,
  extras?: { moq?: number; leadTimeDays?: number; sourceCurrency?: string; sourceCostPrice?: number }
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();

    await updateSupplierPrice(productId, supplierId, costPrice, shippingCost, inStock, {
      sourceCurrency: extras?.sourceCurrency,
      sourceCostPrice: extras?.sourceCostPrice,
      estimatedDeliveryDays: extras?.leadTimeDays,
    });

    if (extras?.moq !== undefined) {
      await db.productSupplier.update({
        where: { productId_supplierId: { productId, supplierId } },
        data: { moq: Math.max(1, Math.round(extras.moq)) },
      });
    }

    revalidatePath(`/admin/suppliers/${supplierId}`);
    revalidatePath("/admin/suppliers");

    return { success: true };
  } catch (error) {
    console.error("[updateProductSupplierPrice]", error);
    return { success: false, error: "Failed to update supplier price" };
  }
}

/**
 * Pull a fresh quote from an API supplier for one listing (admin "Refresh"
 * button on the supplier page). Manual suppliers return their stored values.
 */
export async function refreshListingFromSupplier(
  productId: string,
  supplierId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    const listing = await db.productSupplier.findUnique({
      where: { productId_supplierId: { productId, supplierId } },
      include: { supplier: true },
    });
    if (!listing?.supplierSku) return { success: false, error: "Listing has no supplier SKU" };

    const adapter = adapterForSupplier(listing.supplier);
    if (!adapter.capabilities.livePricing) {
      return { success: false, error: `${listing.supplier.name} has no live pricing API` };
    }
    const quote = await adapter.getPrice({
      sku: listing.supplierSku,
      variantId: listing.variantId,
      fromCountry: listing.warehouseCountry ?? listing.supplier.warehouseCountry,
    });
    await updateSupplierPrice(productId, supplierId, quote.costPrice, quote.shippingCost, quote.inStock, {
      stockQty: quote.stockQty,
      estimatedDeliveryDays: quote.estimatedDeliveryDays,
      warehouseCountry: quote.warehouseCountry,
      sourceCurrency: quote.sourceCurrency,
      sourceCostPrice: quote.sourceCostPrice,
    });
    revalidatePath(`/admin/suppliers/${supplierId}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Refresh failed" };
  }
}
