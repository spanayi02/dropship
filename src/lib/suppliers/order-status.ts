/**
 * Apply a supplier's order status to our SupplierOrder / Order rows and
 * notify the customer. Shared by the CJ webhook and the sync-orders cron so
 * both paths behave identically and a webhook + poll for the same event
 * cannot double-email.
 */
import { db } from "@/lib/db";
import { sendShippingNotificationEmail } from "@/lib/email/send";
import type { SupplierOrderStatus } from "./types";

export type StatusOutcome = "shipped" | "delivered" | "cancelled" | "unchanged";

export async function applySupplierOrderStatus(
  supplierOrderId: string,
  status: SupplierOrderStatus,
  source: string
): Promise<StatusOutcome> {
  const so = await db.supplierOrder.findUnique({
    where: { id: supplierOrderId },
    include: {
      orderItem: {
        include: {
          order: {
            include: {
              user: { select: { email: true, name: true } },
              orderItems: { include: { product: { select: { title: true } } } },
            },
          },
        },
      },
    },
  });
  if (!so) return "unchanged";
  const order = so.orderItem.order;

  if (status.normalized === "delivered") {
    if (so.status === "DELIVERED") return "unchanged";
    await db.supplierOrder.update({
      where: { id: so.id },
      data: {
        status: "DELIVERED",
        deliveredAt: status.deliveredAt ? new Date(status.deliveredAt) : new Date(),
        ...(status.trackingNumber ? { trackingNumber: status.trackingNumber } : {}),
        ...(status.trackingUrl ? { trackingUrl: status.trackingUrl } : {}),
        ...(so.shippedAt ? {} : { shippedAt: status.shippedAt ? new Date(status.shippedAt) : new Date() }),
      },
    });
    await promoteOrderStatus(order.id, "DELIVERED");
    console.log(`[${source}] ${order.orderNumber}: supplier order ${so.supplierOrderRef} delivered`);
    return "delivered";
  }

  if (status.normalized === "shipped") {
    if (so.status === "SHIPPED" || so.status === "DELIVERED") {
      // Already shipped: only backfill tracking if we did not have it.
      if (!so.trackingNumber && status.trackingNumber) {
        await db.supplierOrder.update({
          where: { id: so.id },
          data: { trackingNumber: status.trackingNumber, trackingUrl: status.trackingUrl ?? so.trackingUrl },
        });
      }
      return "unchanged";
    }
    await db.supplierOrder.update({
      where: { id: so.id },
      data: {
        status: "SHIPPED",
        trackingNumber: status.trackingNumber ?? null,
        trackingUrl: status.trackingUrl ?? null,
        shippedAt: status.shippedAt ? new Date(status.shippedAt) : new Date(),
      },
    });
    await promoteOrderStatus(order.id, "SHIPPED");

    const toEmail = order.user?.email ?? order.guestEmail;
    if (toEmail) {
      const customerName =
        order.user?.name ?? (order.shippingAddress as { firstName?: string } | null)?.firstName ?? toEmail;
      void sendShippingNotificationEmail({
        to: toEmail,
        orderNumber: order.orderNumber,
        customerName,
        trackingNumber: status.trackingNumber ?? "",
        trackingUrl: status.trackingUrl,
        items: order.orderItems.map((i) => ({ title: i.product.title, quantity: i.quantity })),
        orderId: order.id,
      });
    }
    console.log(`[${source}] ${order.orderNumber}: shipped, tracking ${status.trackingNumber ?? "n/a"}`);
    return "shipped";
  }

  if (status.normalized === "cancelled") {
    // We have no CANCELLED supplier-order state; surface it for the owner instead.
    console.warn(
      `[${source}] ${order.orderNumber}: supplier cancelled order ${so.supplierOrderRef}. Needs manual follow-up.`
    );
    return "cancelled";
  }

  return "unchanged";
}

/** Move the customer order forward, never backwards (a delivered order stays delivered). */
async function promoteOrderStatus(orderId: string, next: "SHIPPED" | "DELIVERED") {
  const rank = { PENDING: 0, PROCESSING: 1, SHIPPED: 2, DELIVERED: 3, CANCELLED: 99 } as const;
  const order = await db.order.findUnique({ where: { id: orderId }, select: { status: true } });
  if (!order || order.status === "CANCELLED") return;
  if (rank[order.status] >= rank[next]) return;
  await db.order.update({ where: { id: orderId }, data: { status: next } });
}
