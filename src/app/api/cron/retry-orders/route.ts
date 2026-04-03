/**
 * Failed order retry cron — runs every hour
 *
 * Finds PENDING CJ supplier orders (those that failed auto-placement at checkout)
 * and re-attempts placing them. Skips items where the supplier order was created
 * less than 5 minutes ago (the Stripe webhook may still be processing).
 *
 * Vercel cron: { "path": "/api/cron/retry-orders", "schedule": "0 * * * *" }
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { CJDropshippingAdapter, type CJCredentials } from "@/lib/suppliers/cj";

export const dynamic = "force-dynamic";

// Don't retry orders created less than 5 minutes ago
const MIN_AGE_MS = 5 * 60 * 1000;
// Max retries per cron run
const BATCH_SIZE = 20;

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - MIN_AGE_MS);

  // Find PENDING supplier orders for CJ suppliers that have all required data
  const pendingOrders = await db.supplierOrder.findMany({
    where: {
      status: "PENDING",
      supplierOrderRef: null, // not yet placed with CJ
      createdAt: { lte: cutoff },
      supplier: { apiType: "CJ" },
    },
    include: {
      supplier: true,
      orderItem: {
        include: {
          order: true,
          product: {
            include: {
              suppliers: {
                where: { inStock: true },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
    take: BATCH_SIZE,
  });

  let retried = 0;
  let succeeded = 0;
  let failed = 0;

  for (const so of pendingOrders) {
    retried++;
    const orderItem = so.orderItem;
    const order = orderItem.order;

    // Look up the supplier SKU
    const productSupplier = await db.productSupplier.findUnique({
      where: {
        productId_supplierId: {
          productId: orderItem.productId,
          supplierId: so.supplierId,
        },
      },
    });

    if (!productSupplier?.supplierSku) {
      console.warn(
        `[retry-orders] Missing supplierSku for item ${orderItem.id}, skipping`
      );
      failed++;
      continue;
    }

    const shippingAddr = order.shippingAddress as {
      firstName: string;
      lastName: string;
      street: string;
      city: string;
      state: string;
      country: string;
      postalCode: string;
      phone?: string;
    };

    try {
      const credentials = so.supplier.apiCredentials as unknown as CJCredentials;
      const adapter = new CJDropshippingAdapter(credentials);

      const result = await adapter.placeOrder({
        supplierSku: productSupplier.supplierSku,
        quantity: orderItem.quantity,
        shippingAddress: shippingAddr,
      });

      await db.supplierOrder.update({
        where: { id: so.id },
        data: {
          status: "ORDERED",
          supplierOrderRef: result.orderId,
          trackingUrl: result.trackingUrl ?? null,
          orderedAt: new Date(),
        },
      });

      console.log(
        `[retry-orders] Successfully placed CJ order ${result.orderId} for item ${orderItem.id} (order ${order.orderNumber})`
      );
      succeeded++;
    } catch (err) {
      console.error(
        `[retry-orders] Failed to place order for item ${orderItem.id}:`,
        err
      );
      failed++;
    }
  }

  console.log(
    `[retry-orders] Done. Retried: ${retried}, Succeeded: ${succeeded}, Failed: ${failed}`
  );
  return NextResponse.json({ ok: true, retried, succeeded, failed });
}
