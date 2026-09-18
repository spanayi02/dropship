/**
 * Failed supplier-order retry cron
 *
 * Finds PENDING supplier orders for API suppliers (those whose auto-placement
 * failed at checkout — CJ outage, rate limit, expired token, missing balance)
 * and tries again through the same code path the Stripe webhook uses. Manual
 * suppliers are never touched: their PENDING rows are the owner's queue.
 *
 * Skips rows younger than 5 minutes so it never races the webhook.
 * Vercel cron: { "path": "/api/cron/retry-orders", "schedule": "0 * * * *" }
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { API_SUPPLIER_TYPES } from "@/lib/suppliers/factory";
import { placeSupplierOrderForItem } from "@/lib/suppliers/auto-order";

export const dynamic = "force-dynamic";

const MIN_AGE_MS = 5 * 60 * 1000;
const BATCH_SIZE = 20;

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - MIN_AGE_MS);
  const pending = await db.supplierOrder.findMany({
    where: {
      status: "PENDING",
      supplierOrderRef: null,
      createdAt: { lte: cutoff },
      supplier: { apiType: { in: API_SUPPLIER_TYPES }, isActive: true },
    },
    select: { id: true, orderItemId: true },
    orderBy: { createdAt: "asc" },
    take: BATCH_SIZE,
  });

  let succeeded = 0;
  let failed = 0;
  const failures: { supplierOrderId: string; error: string }[] = [];

  for (const so of pending) {
    const result = await placeSupplierOrderForItem(so.orderItemId);
    if (result.ok) succeeded++;
    else {
      failed++;
      failures.push({ supplierOrderId: so.id, error: result.error ?? "unknown" });
    }
  }

  console.log(`[retry-orders] Done. Retried: ${pending.length}, Succeeded: ${succeeded}, Failed: ${failed}`);
  return NextResponse.json({ ok: true, retried: pending.length, succeeded, failed, failures });
}
