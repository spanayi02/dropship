/**
 * Supplier order status sync cron
 *
 * Polls API suppliers (CJ) for every ORDERED supplier order and moves it to
 * SHIPPED / DELIVERED, notifying the customer on the SHIPPED transition. This
 * is the safety net behind the CJ webhook: if a push is missed, the next run
 * catches up.
 *
 * Vercel cron: path /api/cron/sync-orders, schedule every 2 hours.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { adapterForSupplier, API_SUPPLIER_TYPES } from "@/lib/suppliers/factory";
import { applySupplierOrderStatus } from "@/lib/suppliers/order-status";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const open = await db.supplierOrder.findMany({
    where: {
      status: "ORDERED",
      supplierOrderRef: { not: null },
      supplier: { apiType: { in: API_SUPPLIER_TYPES } },
    },
    include: { supplier: true },
    orderBy: { orderedAt: "asc" },
    take: 100, // stay inside the function timeout at 1 req/s
  });

  let shipped = 0;
  let delivered = 0;
  let errors = 0;

  for (const so of open) {
    try {
      const adapter = adapterForSupplier(so.supplier);
      if (!adapter.getOrderStatus) continue;
      const status = await adapter.getOrderStatus(so.supplierOrderRef!);
      const outcome = await applySupplierOrderStatus(so.id, status, "sync-orders");
      if (outcome === "shipped") shipped++;
      if (outcome === "delivered") delivered++;
    } catch (err) {
      console.error(`[sync-orders] Failed for supplier order ${so.id}:`, err);
      errors++;
    }
  }

  console.log(
    `[sync-orders] Done. Checked: ${open.length}, Shipped: ${shipped}, Delivered: ${delivered}, Errors: ${errors}`
  );
  return NextResponse.json({ ok: true, checked: open.length, shipped, delivered, errors });
}
