import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { OrderStatus } from "@prisma/client";

interface ConfirmationPageProps {
  params: Promise<{ id: string }>;
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Pending",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const STATUS_STYLES: Record<OrderStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  PROCESSING: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  SHIPPED: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  DELIVERED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export default async function OrderConfirmationPage({ params }: ConfirmationPageProps) {
  const { id } = await params;

  const order = await db.order.findUnique({
    where: { id },
    include: {
      orderItems: {
        include: {
          product: {
            select: { title: true, images: true, slug: true },
          },
        },
      },
    },
  });

  if (!order) notFound();

  const shippingAddress = order.shippingAddress as {
    firstName: string;
    lastName: string;
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    phone?: string;
  };

  const estimatedFrom = addDays(order.createdAt, 7);
  const estimatedTo = addDays(order.createdAt, 15);

  const formatDate = (date: Date) =>
    date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Checkmark animation */}
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="relative mb-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <svg
              className="h-10 w-10 text-green-600 dark:text-green-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
              style={{ animation: "checkmark-draw 0.6s ease-out forwards" }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          {/* Ripple rings */}
          <div className="absolute inset-0 rounded-full animate-ping bg-green-200 dark:bg-green-800 opacity-30" style={{ animationDuration: "1.5s", animationIterationCount: "2" }} />
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Order confirmed!
        </h1>
        <p className="mt-2 text-muted-foreground">
          Thank you for your purchase. We&apos;ll send you a confirmation email shortly.
        </p>
      </div>

      {/* Order meta */}
      <div className="rounded-xl border border-border bg-card overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-border flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Order number</p>
            <p className="text-sm font-semibold font-mono">{order.orderNumber}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Order date</p>
            <p className="text-sm font-medium">{formatDate(order.createdAt)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Est. delivery</p>
            <p className="text-sm font-medium">
              {formatDate(estimatedFrom)} – {formatDate(estimatedTo)}
            </p>
          </div>
          <span
            className={[
              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
              STATUS_STYLES[order.status],
            ].join(" ")}
          >
            {STATUS_LABELS[order.status]}
          </span>
        </div>

        {/* Items */}
        <div className="divide-y divide-border">
          {order.orderItems.map((item) => (
            <div key={item.id} className="flex items-center gap-4 px-6 py-4">
              <div className="relative h-14 w-14 flex-none overflow-hidden rounded-lg border border-border bg-muted">
                {item.product.images[0] ? (
                  <Image
                    src={item.product.images[0]}
                    alt={item.product.title}
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground text-xs">
                    No img
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium">{item.product.title}</p>
                <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
              </div>
              <p className="text-sm font-semibold tabular-nums">
                {formatPrice(item.priceAtPurchase * item.quantity)}
              </p>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="px-6 py-4 border-t border-border bg-muted/30 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="tabular-nums">{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Shipping</span>
            <span className="tabular-nums">
              {order.shippingCost === 0 ? (
                <span className="text-green-600 font-medium">Free</span>
              ) : (
                formatPrice(order.shippingCost)
              )}
            </span>
          </div>
          <div className="flex justify-between font-semibold border-t border-border pt-2">
            <span>Total</span>
            <span className="tabular-nums">{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Shipping address */}
      <div className="rounded-xl border border-border bg-card p-6 mb-6">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Shipping address
        </h2>
        <address className="not-italic text-sm space-y-0.5 text-foreground">
          <p className="font-medium">
            {shippingAddress.firstName} {shippingAddress.lastName}
          </p>
          <p>{shippingAddress.street}</p>
          <p>
            {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}
          </p>
          <p>{shippingAddress.country}</p>
          {shippingAddress.phone && <p className="text-muted-foreground">{shippingAddress.phone}</p>}
        </address>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link href={`/account/orders/${order.id}`} className="flex-1">
          <Button className="w-full h-10">Track Order</Button>
        </Link>
        <Link href="/products" className="flex-1">
          <Button variant="outline" className="w-full h-10">Continue Shopping</Button>
        </Link>
      </div>
    </div>
  );
}
