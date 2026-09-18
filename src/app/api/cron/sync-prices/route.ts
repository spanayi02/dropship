/**
 * Price & stock sync cron
 *
 * Refreshes cost, shipping and stock for every listing of an API supplier
 * (CJ), records price history and re-prices auto-priced products through the
 * pricing engine (markup, floor/ceiling, cheapest-supplier selection).
 * Manual / B2B listings are skipped: their prices change when the owner edits
 * them or posts to /api/suppliers/update-prices.
 *
 * Vercel cron: { "path": "/api/cron/sync-prices", "schedule": "0 6 * * *" }
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { adapterForSupplier, API_SUPPLIER_TYPES } from "@/lib/suppliers/factory";
import { updateSupplierPrice } from "@/lib/pricing/engine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? 150), 500);

  // Oldest-checked first so a partial run still rotates through the catalog.
  const listings = await db.productSupplier.findMany({
    where: {
      supplier: { apiType: { in: API_SUPPLIER_TYPES }, isActive: true },
      supplierSku: { not: null },
      isLocked: false,
    },
    include: { supplier: true, product: { select: { id: true, title: true, isActive: true } } },
    orderBy: { lastChecked: "asc" },
    take: limit,
  });

  let updated = 0;
  let errors = 0;
  const adapters = new Map<string, ReturnType<typeof adapterForSupplier>>();

  for (const listing of listings) {
    try {
      let adapter = adapters.get(listing.supplierId);
      if (!adapter) {
        adapter = adapterForSupplier(listing.supplier);
        adapters.set(listing.supplierId, adapter);
      }

      const quote = await adapter.getPrice({
        sku: listing.supplierSku!,
        variantId: listing.variantId,
        fromCountry: listing.warehouseCountry ?? listing.supplier.warehouseCountry,
      });

      await updateSupplierPrice(
        listing.productId,
        listing.supplierId,
        quote.costPrice,
        quote.shippingCost,
        quote.inStock,
        {
          stockQty: quote.stockQty,
          estimatedDeliveryDays: quote.estimatedDeliveryDays,
          warehouseCountry: quote.warehouseCountry,
          sourceCurrency: quote.sourceCurrency,
          sourceCostPrice: quote.sourceCostPrice,
        }
      );

      // A product with no in-stock supplier at all goes off the board; it
      // comes back automatically when any supplier has stock again.
      const inStockCount = await db.productSupplier.count({
        where: { productId: listing.productId, inStock: true },
      });
      if (inStockCount === 0 && listing.product.isActive) {
        await db.product.update({ where: { id: listing.productId }, data: { isActive: false } });
        console.log(`[sync-prices] ${listing.product.title}: no supplier in stock, deactivated`);
      } else if (inStockCount > 0 && !listing.product.isActive) {
        await db.product.update({ where: { id: listing.productId }, data: { isActive: true } });
      }

      updated++;
    } catch (err) {
      console.error(`[sync-prices] Failed for listing ${listing.id} (${listing.product.title}):`, err);
      errors++;
    }
  }

  console.log(`[sync-prices] Done. Updated: ${updated}, Errors: ${errors}`);
  return NextResponse.json({ ok: true, checked: listings.length, updated, errors });
}
