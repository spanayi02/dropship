"use server";

import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { checkoutSchema, type CheckoutInput } from "@/lib/validations/order";
import { generateOrderNumber } from "@/lib/utils";
import { autoSelectSupplierForOrder } from "@/lib/pricing/engine";
import { auth } from "@/lib/auth";
import type { CartItem } from "@/store/cart-store";

const FLAT_SHIPPING_RATE = 499; // cents
const FREE_SHIPPING_THRESHOLD = 5000; // cents

export async function createCheckoutSession(
  formData: CheckoutInput,
  cartItems: CartItem[]
): Promise<{ sessionUrl: string } | { error: string }> {
  try {
    // Validate input
    const parsed = checkoutSchema.safeParse({
      ...formData,
      items: cartItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    });

    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }

    const session = await auth();

    // Verify each cart item against DB prices
    const verifiedItems: Array<{
      cartItem: CartItem;
      dbPrice: number;
    }> = [];

    for (const cartItem of cartItems) {
      const product = await db.product.findUnique({
        where: { id: cartItem.productId, isActive: true },
        select: { id: true, title: true, sellingPrice: true, images: true },
      });

      if (!product) {
        return { error: `Product "${cartItem.title}" is no longer available` };
      }

      verifiedItems.push({ cartItem, dbPrice: product.sellingPrice });
    }

    // Calculate totals using DB prices
    const subtotal = verifiedItems.reduce(
      (sum, { cartItem, dbPrice }) => sum + dbPrice * cartItem.quantity,
      0
    );

    const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING_RATE;
    const total = subtotal + shippingCost;

    // Create Order in DB
    const orderNumber = generateOrderNumber();

    const order = await db.order.create({
      data: {
        orderNumber,
        userId: session?.user?.id ?? null,
        guestEmail: session?.user?.id ? null : formData.email,
        status: "PENDING",
        subtotal,
        shippingCost,
        total,
        shippingAddress: formData.shippingAddress,
        orderItems: {
          create: verifiedItems.map(({ cartItem, dbPrice }) => ({
            productId: cartItem.productId,
            quantity: cartItem.quantity,
            priceAtPurchase: dbPrice,
          })),
        },
      },
      include: { orderItems: true },
    });

    // Auto-select suppliers for each order item
    for (const orderItem of order.orderItems) {
      const supplierResult = await autoSelectSupplierForOrder(orderItem.productId);
      if (supplierResult) {
        await db.orderItem.update({
          where: { id: orderItem.id },
          data: {
            selectedSupplierId: supplierResult.supplierId,
            costAtPurchase: supplierResult.totalCost,
          },
        });
      }
    }

    // Create Stripe Checkout Session
    const lineItems = verifiedItems.map(({ cartItem, dbPrice }) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: cartItem.title,
          images: cartItem.image ? [cartItem.image] : undefined,
        },
        unit_amount: dbPrice,
      },
      quantity: cartItem.quantity,
    }));

    if (shippingCost > 0) {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: "Shipping",
            images: undefined,
          },
          unit_amount: shippingCost,
        },
        quantity: 1,
      });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const stripeSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItems,
      customer_email: formData.email,
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
      },
      success_url: `${baseUrl}/order/${order.id}/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout`,
    });

    // Save Stripe session ID to order
    await db.order.update({
      where: { id: order.id },
      data: { stripeCheckoutSessionId: stripeSession.id },
    });

    if (!stripeSession.url) {
      return { error: "Failed to create payment session" };
    }

    return { sessionUrl: stripeSession.url };
  } catch (err) {
    console.error("[createCheckoutSession]", err);
    return { error: "Something went wrong. Please try again." };
  }
}
