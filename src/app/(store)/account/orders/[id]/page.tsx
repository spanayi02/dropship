import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatPrice, cn } from "@/lib/utils";
import { buttonVariants } from "@/lib/button-variants";
import type { OrderStatus, SupplierOrderStatus } from "@prisma/client";

export const dynamic = 'force-dynamic';

interface OrderDetailPageProps {
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

const SUPPLIER_STATUS_LABELS: Record<SupplierOrderStatus, string> = {
  PENDING: "Pending supplier",
  ORDERED: "Ordered from supplier",
  SHIPPED: "Shipped by supplier",
  DELIVERED: "Delivered",
};

const TIMELINE_STEPS: OrderStatus[] = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED"];

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;
  const session = await auth();
  const userId = session!.user!.id!;

  const order = await db.order.findUnique({
    where: { id },
    include: {
      orderItems: {
        include: {
          product: {
            select: { title: true, images: true, slug: true },
          },
          supplierOrder: {
            include: {
              supplier: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  if (!order || order.userId !== userId) notFound();

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

  const currentStepIndex =
    order.status === "CANCELLED"
      ? -1
      : TIMELINE_STEPS.indexOf(order.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/account/orders"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2")}
            >
              <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Orders
            </Link>
          </div>
          <h1 className="text-xl font-semibold font-mono">{order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Placed on{" "}
            {order.createdAt.toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
        <span
          className={[
            "inline-flex items-center rounded-full px-3 py-1 text-sm font-medium",
            STATUS_STYLES[order.status],
          ].join(" ")}
        >
          {STATUS_LABELS[order.status]}
        </span>
      </div>

      {/* Timeline */}
      {order.status !== "CANCELLED" && (
        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-5 text-sm font-semibold">Order status</h2>
          <div className="relative flex items-center">
            {/* Background line */}
            <div className="absolute top-4 left-4 right-4 h-0.5 bg-border" />
            {/* Progress line */}
            {currentStepIndex > 0 && (
              <div
                className="absolute top-4 left-4 h-0.5 bg-primary transition-all"
                style={{
                  width: `${(currentStepIndex / (TIMELINE_STEPS.length - 1)) * (100 - (8 / TIMELINE_STEPS.length) * 100)}%`,
                  maxWidth: "calc(100% - 2rem)",
                }}
              />
            )}
            {TIMELINE_STEPS.map((s, idx) => {
              const isDone = idx <= currentStepIndex;
              const isActive = idx === currentStepIndex;
              return (
                <div key={s} className="relative flex flex-1 flex-col items-center gap-2">
                  <div
                    className={[
                      "relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors",
                      isDone
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground",
                    ].join(" ")}
                  >
                    {isDone ? (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className="text-xs">{idx + 1}</span>
                    )}
                  </div>
                  <span
                    className={[
                      "text-center text-xs",
                      isActive ? "font-semibold text-foreground" : isDone ? "text-foreground" : "text-muted-foreground",
                    ].join(" ")}
                  >
                    {STATUS_LABELS[s]}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Items */}
      <section className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold">Items</h2>
        </div>
        <div className="divide-y divide-border">
          {order.orderItems.map((item) => (
            <div key={item.id} className="px-6 py-4 space-y-3">
              <div className="flex items-center gap-4">
                <div className="relative h-16 w-16 flex-none overflow-hidden rounded-lg border border-border bg-muted">
                  {item.product.images[0] ? (
                    <Image
                      src={item.product.images[0]}
                      alt={item.product.title}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground text-xs">
                      No img
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/products/${item.product.slug}`}
                    className="text-sm font-medium hover:underline underline-offset-4"
                  >
                    {item.product.title}
                  </Link>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Qty: {item.quantity} · {formatPrice(item.priceAtPurchase)} each
                  </p>
                </div>
                <p className="text-sm font-semibold tabular-nums">
                  {formatPrice(item.priceAtPurchase * item.quantity)}
                </p>
              </div>

              {/* Supplier tracking */}
              {item.supplierOrder && (
                <div className="ml-20 rounded-lg bg-muted/50 border border-border p-3 text-xs space-y-1">
                  <p className="font-medium">
                    {SUPPLIER_STATUS_LABELS[item.supplierOrder.status]}
                    {item.supplierOrder.supplier && (
                      <span className="text-muted-foreground font-normal ml-1">
                        via {item.supplierOrder.supplier.name}
                      </span>
                    )}
                  </p>
                  {item.supplierOrder.trackingNumber && (
                    <p className="text-muted-foreground">
                      Tracking:{" "}
                      {item.supplierOrder.trackingUrl ? (
                        <a
                          href={item.supplierOrder.trackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline underline-offset-2"
                        >
                          {item.supplierOrder.trackingNumber}
                        </a>
                      ) : (
                        <span className="font-mono">{item.supplierOrder.trackingNumber}</span>
                      )}
                    </p>
                  )}
                  {item.supplierOrder.shippedAt && (
                    <p className="text-muted-foreground">
                      Shipped:{" "}
                      {item.supplierOrder.shippedAt.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  )}
                </div>
              )}
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
      </section>

      {/* Shipping address */}
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Shipped to
        </h2>
        <address className="not-italic text-sm space-y-0.5">
          <p className="font-medium">
            {shippingAddress.firstName} {shippingAddress.lastName}
          </p>
          <p className="text-muted-foreground">{shippingAddress.street}</p>
          <p className="text-muted-foreground">
            {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}
          </p>
          <p className="text-muted-foreground">{shippingAddress.country}</p>
          {shippingAddress.phone && (
            <p className="text-muted-foreground">{shippingAddress.phone}</p>
          )}
        </address>
      </section>
    </div>
  );
}
