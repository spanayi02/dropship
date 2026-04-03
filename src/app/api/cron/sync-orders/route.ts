/**
 * Order status sync cron — runs every 2 hours
 *
 * Polls CJ Dropshipping for the current status of all ORDERED supplier orders.
 * This is a backup to the CJ webhook: if the webhook misses an event, this cron
 * will catch it and update tracking + notify the customer.
 *
 * Vercel cron schedule: "0 * /2 * * *" (every 2 hours — remove the space before /2)
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { CJDropshippingAdapter, type CJCredentials } from "@/lib/suppliers/cj";
import { sendShippingNotificationEmail } from "@/lib/email/send";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find all CJ supplier orders that are ORDERED (placed but not yet shipped)
  const orderedItems = await db.supplierOrder.findMany({
    where: {
      status: "ORDERED",
      supplierOrderRef: { not: null },
      supplier: { apiType: "CJ" },
    },
    include: {
      supplier: true,
      orderItem: {
        include: {
          order: {
            include: {
              user: true,
              orderItems: { include: { product: true } },
            },
          },
        },
      },
    },
    // Limit per run to stay within cron timeout
    take: 100,
  });

  let shipped = 0;
  let delivered = 0;
  let errors = 0;

  for (const so of orderedItems) {
    try {
      const credentials = so.supplier.apiCredentials as unknown as CJCredentials;
      const adapter = new CJDropshippingAdapter(credentials);
      const result = await adapter.getOrderStatus(so.supplierOrderRef!);

      const statusLower = result.status.toLowerCase();
      const isShipped =
        statusLower.includes("ship") ||
        statusLower === "transit" ||
        statusLower === "in_transit";
      const isDelivered =
        statusLower === "delivered" || statusLower === "completed";

      if (isDelivered && so.status !== "DELIVERED") {
        await db.supplierOrder.update({
          where: { id: so.id },
          data: {
            status: "DELIVERED",
            deliveredAt: new Date(),
            ...(result.trackingNumber ? { trackingNumber: result.trackingNumber } : {}),
            ...(result.trackingUrl ? { trackingUrl: result.trackingUrl } : {}),
          },
        });
        await db.order.update({
          where: { id: so.orderItem.order.id },
          data: { status: "DELIVERED" },
        });
        delivered++;
      } else if (isShipped && result.trackingNumber && so.status !== "SHIPPED") {
        await db.supplierOrder.update({
          where: { id: so.id },
          data: {
            status: "SHIPPED",
            trackingNumber: result.trackingNumber,
            trackingUrl: result.trackingUrl ?? null,
            shippedAt: result.shippedAt ? new Date(result.shippedAt) : new Date(),
          },
        });

        const order = so.orderItem.order;
        await db.order.update({
          where: { id: order.id },
          data: { status: "SHIPPED" },
        });

        const toEmail = order.user?.email ?? order.guestEmail;
        if (toEmail) {
          const customerName =
            order.user?.name ??
            (order.shippingAddress as { firstName?: string })?.firstName ??
            toEmail;

          void sendShippingNotificationEmail({
            to: toEmail,
            orderNumber: order.orderNumber,
            customerName,
            trackingNumber: result.trackingNumber,
            trackingUrl: result.trackingUrl,
            items: order.orderItems.map((i) => ({
              title: i.product.title,
              quantity: i.quantity,
            })),
            orderId: order.id,
          });
        }

        shipped++;
        console.log(
          `[sync-orders] Order ${order.orderNumber} marked SHIPPED. Tracking: ${result.trackingNumber}`
        );
      }
    } catch (err) {
      console.error(`[sync-orders] Failed for supplier order ${so.id}:`, err);
      errors++;
    }
  }

  console.log(
    `[sync-orders] Done. Checked: ${orderedItems.length}, Shipped: ${shipped}, Delivered: ${delivered}, Errors: ${errors}`
  );
  return NextResponse.json({ ok: true, checked: orderedItems.length, shipped, delivered, errors });
}
