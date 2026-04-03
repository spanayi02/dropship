/**
 * Review request cron
 *
 * Finds orders delivered 7+ days ago with no review request sent yet,
 * emails the customer asking them to leave a review, and marks the order.
 *
 * On Vercel, add to vercel.json:
 *   { "crons": [{ "path": "/api/cron/review-requests", "schedule": "0 10 * * *" }] }
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendReviewRequestEmail } from "@/lib/email/send";

export const dynamic = "force-dynamic";

const DAYS_AFTER_DELIVERY = 7;

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - DAYS_AFTER_DELIVERY * 24 * 60 * 60 * 1000);

  const orders = await db.order.findMany({
    where: {
      status: "DELIVERED",
      reviewRequestSentAt: null,
      updatedAt: { lte: cutoff },
    },
    include: {
      user: true,
      orderItems: { include: { product: true } },
    },
    take: 50, // process in batches to stay within cron timeout
  });

  let sent = 0;

  for (const order of orders) {
    const toEmail = order.user?.email ?? order.guestEmail;
    if (!toEmail) continue;

    const customerName =
      order.user?.name ??
      (order.shippingAddress as { firstName?: string })?.firstName ??
      toEmail;

    try {
      await sendReviewRequestEmail({
        to: toEmail,
        customerName,
        orderNumber: order.orderNumber,
        items: order.orderItems.map((i) => ({
          title: i.product.title,
          productId: i.productId,
          image: i.product.images[0],
        })),
      });

      await db.order.update({
        where: { id: order.id },
        data: { reviewRequestSentAt: new Date() },
      });

      sent++;
    } catch (err) {
      console.error(`[review-requests] Failed for order ${order.orderNumber}:`, err);
    }
  }

  console.log(`[review-requests] Sent ${sent} review request emails`);
  return NextResponse.json({ ok: true, sent });
}
