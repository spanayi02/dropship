/**
 * CJ Dropshipping tracking webhook
 *
 * Register this URL in your CJ dashboard under Developer → Webhook:
 *   https://yourdomain.com/api/webhooks/cj?secret=YOUR_CJ_WEBHOOK_SECRET
 *
 * CJ sends a POST when an order ships with tracking info.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendShippingNotificationEmail } from "@/lib/email/send";

interface CJTrackingPayload {
  orderId: string;        // CJ's order ID (= SupplierOrder.supplierOrderRef)
  orderStatus: string;    // e.g. "SHIPPED"
  trackNumber?: string;
  logisticUrl?: string;
  shippingTime?: string;
}

export async function POST(req: NextRequest) {
  // Verify secret token
  const secret = req.nextUrl.searchParams.get("secret");
  if (!secret || secret !== process.env.CJ_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: CJTrackingPayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { orderId: cjOrderId, orderStatus, trackNumber, logisticUrl, shippingTime } = payload;

  if (!cjOrderId) {
    return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
  }

  const supplierOrder = await db.supplierOrder.findFirst({
    where: { supplierOrderRef: cjOrderId },
    include: {
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
  });

  if (!supplierOrder) {
    console.warn(`[cj-webhook] No supplier order found for CJ order ${cjOrderId}`);
    return NextResponse.json({ received: true });
  }

  const isShipped =
    orderStatus?.toLowerCase().includes("ship") ||
    orderStatus?.toLowerCase() === "transit";

  if (isShipped && trackNumber) {
    // Update supplier order
    await db.supplierOrder.update({
      where: { id: supplierOrder.id },
      data: {
        status: "SHIPPED",
        trackingNumber: trackNumber,
        trackingUrl: logisticUrl ?? null,
        shippedAt: shippingTime ? new Date(shippingTime) : new Date(),
      },
    });

    const order = supplierOrder.orderItem.order;

    // Update the customer order to SHIPPED
    await db.order.update({
      where: { id: order.id },
      data: { status: "SHIPPED" },
    });

    // Send shipping notification email
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
        trackingNumber: trackNumber,
        trackingUrl: logisticUrl,
        items: order.orderItems.map((i) => ({
          title: i.product.title,
          quantity: i.quantity,
        })),
        orderId: order.id,
      });
    }

    console.log(
      `[cj-webhook] Order ${order.orderNumber} shipped. Tracking: ${trackNumber}`
    );
  }

  if (orderStatus?.toLowerCase() === "delivered") {
    await db.supplierOrder.update({
      where: { id: supplierOrder.id },
      data: { status: "DELIVERED", deliveredAt: new Date() },
    });

    await db.order.update({
      where: { id: supplierOrder.orderItem.order.id },
      data: { status: "DELIVERED" },
    });
  }

  return NextResponse.json({ received: true });
}
