/**
 * Price & stock sync cron
 *
 * Fetches current cost prices and stock levels from CJ Dropshipping for all
 * active CJ product listings, updates the database, and recalculates selling
 * prices for products with autoPrice = true.
 *
 * Protect with CRON_SECRET. On Vercel, add to vercel.json:
 *   { "crons": [{ "path": "/api/cron/sync-prices", "schedule": "0 6 * * *" }] }
 * Then set Authorization header via Vercel's built-in cron auth, or use
 * the Authorization: Bearer CRON_SECRET header from your cron service.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSupplierAdapter } from "@/lib/suppliers/factory";

export const dynamic = "force-dynamic";

function applyMarkup(costCents: number, markupType: string, markupValue: number | null): number {
  if (!markupValue) return costCents;
  if (markupType === "MULTIPLIER") return Math.round(costCents * markupValue);
  if (markupType === "FIXED") return costCents + Math.round(markupValue * 100);
  return costCents;
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Load all CJ product-supplier links with their supplier credentials
  const listings = await db.productSupplier.findMany({
    where: {
      supplier: { apiType: "CJ" },
      supplierSku: { not: null },
      isLocked: false, // respect manually locked prices
    },
    include: {
      supplier: true,
      product: true,
    },
  });

  let updated = 0;
  let errors = 0;

  for (const listing of listings) {
    try {
      const adapter = getSupplierAdapter(
        listing.supplier.apiType.toLowerCase(),
        listing.supplier.apiCredentials
      );

      const { costPrice, shippingCost, inStock } = await adapter.getPrice(
        listing.supplierSku!
      );

      const newTotalCost = costPrice + shippingCost;
      const priceChanged = listing.costPrice !== costPrice;

      // Update ProductSupplier
      await db.productSupplier.update({
        where: { id: listing.id },
        data: {
          costPrice,
          shippingCost,
          totalCost: newTotalCost,
          inStock,
          lastChecked: new Date(),
        },
      });

      // Record price history if cost changed
      if (priceChanged) {
        let newSellingPrice: number | undefined;

        if (listing.product.autoPrice) {
          newSellingPrice = applyMarkup(
            costPrice,
            listing.product.markupType,
            listing.product.markupValue
          );

          // Clamp to floor/ceiling if set
          if (listing.product.markupFloor && newSellingPrice < listing.product.markupFloor) {
            newSellingPrice = listing.product.markupFloor;
          }
          if (listing.product.markupCeiling && newSellingPrice > listing.product.markupCeiling) {
            newSellingPrice = listing.product.markupCeiling;
          }

          await db.product.update({
            where: { id: listing.productId },
            data: { sellingPrice: newSellingPrice },
          });
        }

        await db.priceHistory.create({
          data: {
            productId: listing.productId,
            supplierId: listing.supplierId,
            oldCostPrice: listing.costPrice,
            newCostPrice: costPrice,
            oldSellingPrice: listing.product.sellingPrice,
            newSellingPrice: newSellingPrice ?? listing.product.sellingPrice,
          },
        });
      }

      // Mark product inactive if out of stock (optional — remove if too aggressive)
      if (!inStock && listing.product.isActive) {
        await db.product.update({
          where: { id: listing.productId },
          data: { isActive: false },
        });
        console.log(`[sync-prices] Marked ${listing.product.title} inactive (out of stock)`);
      } else if (inStock && !listing.product.isActive) {
        await db.product.update({
          where: { id: listing.productId },
          data: { isActive: true },
        });
      }

      updated++;
    } catch (err) {
      console.error(`[sync-prices] Failed for listing ${listing.id}:`, err);
      errors++;
    }
  }

  console.log(`[sync-prices] Done. Updated: ${updated}, Errors: ${errors}`);
  return NextResponse.json({ ok: true, updated, errors });
}
