import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import Stripe from "stripe";
import { sendOrderConfirmationEmail } from "@/lib/email/send";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[stripe-webhook] STRIPE_WEBHOOK_SECRET not set");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Signature verification failed";
    console.error("[stripe-webhook] Signature verification failed:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentIntentFailed(paymentIntent);
        break;
      }

      default:
        // Acknowledge but ignore other event types
        break;
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Webhook handler error";
    console.error("[stripe-webhook] Handler error:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
) {
  const sessionId = session.id;
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;

  // Find the order by stripe checkout session ID
  let order = await db.order.findFirst({
    where: { stripeCheckoutSessionId: sessionId },
    include: {
      orderItems: { include: { product: true } },
      user: true,
    },
  });

  if (!order) {
    // Try by payment intent as fallback
    if (paymentIntentId) {
      const orderByPI = await db.order.findFirst({
        where: { stripePaymentIntentId: paymentIntentId },
        include: {
          orderItems: { include: { product: true } },
          user: true,
        },
      });
      if (orderByPI) {
        await db.order.update({
          where: { id: orderByPI.id },
          data: {
            status: "PROCESSING",
            stripeCheckoutSessionId: sessionId,
          },
        });
        await clearCartForSession(session);
        void sendOrderConfirmationForOrder(orderByPI, session);
        return;
      }
    }
    console.warn(
      `[stripe-webhook] No order found for session ${sessionId}`
    );
    return;
  }

  await db.order.update({
    where: { id: order.id },
    data: { status: "PROCESSING" },
  });

  await clearCartForSession(session);
  void sendOrderConfirmationForOrder(order, session);
}

type OrderWithItemsAndUser = Awaited<
  ReturnType<typeof db.order.findFirst<{
    include: { orderItems: { include: { product: true } }; user: true };
  }>>
>;

async function sendOrderConfirmationForOrder(
  order: NonNullable<OrderWithItemsAndUser>,
  session: Stripe.Checkout.Session
) {
  try {
    // Resolve recipient email: authenticated user → guest email → stripe session email
    const toEmail =
      order.user?.email ??
      order.guestEmail ??
      session.customer_email;

    if (!toEmail) {
      console.warn(
        `[stripe-webhook] No email address found for order ${order.orderNumber}, skipping confirmation email`
      );
      return;
    }

    const customerName =
      order.user?.name ??
      (order.shippingAddress as { firstName?: string; lastName?: string } | null)
        ?.firstName ??
      toEmail;

    const shippingAddr = order.shippingAddress as {
      firstName: string;
      lastName: string;
      street: string;
      city: string;
      state: string;
      country: string;
      postalCode: string;
    };

    await sendOrderConfirmationEmail({
      to: toEmail,
      orderNumber: order.orderNumber,
      customerName,
      items: order.orderItems.map((item) => ({
        title: item.product.title,
        quantity: item.quantity,
        price: item.priceAtPurchase,
        image: item.product.images[0],
      })),
      subtotal: order.subtotal,
      shippingCost: order.shippingCost,
      total: order.total,
      shippingAddress: shippingAddr,
      orderId: order.id,
    });
  } catch (err) {
    console.error(
      `[stripe-webhook] Failed to send order confirmation for ${order.orderNumber}:`,
      err
    );
  }
}

async function clearCartForSession(session: Stripe.Checkout.Session) {
  // Attempt to clear cart by userId (from metadata) or sessionId
  const userId = session.metadata?.userId;
  const cartSessionId = session.metadata?.cartSessionId;

  if (userId) {
    await db.cartItem.deleteMany({ where: { userId } });
  } else if (cartSessionId) {
    await db.cartItem.deleteMany({ where: { sessionId: cartSessionId } });
  } else if (session.customer_email) {
    // Last resort: find user by email and clear their cart
    const user = await db.user.findUnique({
      where: { email: session.customer_email },
      select: { id: true },
    });
    if (user) {
      await db.cartItem.deleteMany({ where: { userId: user.id } });
    }
  }
}

async function handlePaymentIntentFailed(
  paymentIntent: Stripe.PaymentIntent
) {
  const paymentIntentId = paymentIntent.id;

  const order = await db.order.findFirst({
    where: { stripePaymentIntentId: paymentIntentId },
  });

  if (!order) {
    console.warn(
      `[stripe-webhook] No order found for payment_intent ${paymentIntentId}`
    );
    return;
  }

  // Only cancel if the order is still pending — don't overwrite a further status
  if (order.status === "PENDING") {
    await db.order.update({
      where: { id: order.id },
      data: { status: "CANCELLED" },
    });
  }
}
