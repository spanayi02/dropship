import { resend, FROM_EMAIL, STORE_NAME } from "./resend";
import { OrderConfirmationEmail } from "./templates/order-confirmation";
import { ShippingNotificationEmail } from "./templates/shipping-notification";
import { WelcomeEmail } from "./templates/welcome";
import { ReviewRequestEmail } from "./templates/review-request";
import { createElement } from "react";

export async function sendOrderConfirmationEmail(params: {
  to: string;
  orderNumber: string;
  customerName: string;
  items: { title: string; quantity: number; price: number; image?: string }[];
  subtotal: number;
  shippingCost: number;
  total: number;
  shippingAddress: {
    firstName: string;
    lastName: string;
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  orderId: string;
}) {
  const orderUrl = `${process.env.NEXT_PUBLIC_APP_URL}/account/orders/${params.orderId}`;
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: `Order Confirmed — ${params.orderNumber}`,
      react: createElement(OrderConfirmationEmail, { ...params, orderUrl }),
    });
  } catch (err) {
    console.error("[email] Failed to send order confirmation:", err);
  }
}

export async function sendShippingNotificationEmail(params: {
  to: string;
  orderNumber: string;
  customerName: string;
  trackingNumber: string;
  trackingUrl?: string;
  items: { title: string; quantity: number }[];
  orderId: string;
}) {
  const orderUrl = `${process.env.NEXT_PUBLIC_APP_URL}/account/orders/${params.orderId}`;
  const estimatedDelivery = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000
  ).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: `Your order ${params.orderNumber} has shipped!`,
      react: createElement(ShippingNotificationEmail, {
        ...params,
        estimatedDelivery,
        orderUrl,
      }),
    });
  } catch (err) {
    console.error("[email] Failed to send shipping notification:", err);
  }
}

export async function sendReviewRequestEmail(params: {
  to: string;
  customerName: string;
  orderNumber: string;
  items: { title: string; productId: string; image?: string }[];
}) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: `How was your order ${params.orderNumber}? ⭐`,
      react: createElement(ReviewRequestEmail, {
        customerName: params.customerName,
        orderNumber: params.orderNumber,
        items: params.items,
      }),
    });
  } catch (err) {
    console.error("[email] Failed to send review request:", err);
  }
}

export async function sendWelcomeEmail(params: { to: string; name: string }) {
  const shopUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: `Welcome to ${STORE_NAME}!`,
      react: createElement(WelcomeEmail, {
        name: params.name,
        shopUrl,
      }),
    });
  } catch (err) {
    console.error("[email] Failed to send welcome email:", err);
  }
}
