import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import { OrderStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { OrderStatusForm } from "./order-status-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await db.order.findUnique({
    where: { id },
    select: { orderNumber: true },
  });
  return { title: order ? `Order ${order.orderNumber}` : "Order Not Found" };
}

const STATUS_STYLES: Record<OrderStatus, string> = {
  PENDING:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  PROCESSING:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  SHIPPED:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  DELIVERED:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  CANCELLED:
    "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: PageProps) {
  const { id } = await params;

  const order = await db.order.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, email: true, name: true } },
      orderItems: {
        include: {
          product: {
            select: {
              id: true,
              title: true,
              images: true,
              slug: true,
            },
          },
          supplierOrder: {
            include: {
              supplier: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
  });

  if (!order) notFound();

  const shippingAddress = order.shippingAddress as {
    firstName?: string;
    lastName?: string;
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    phone?: string;
  };

  const subtotalRevenue = order.orderItems.reduce(
    (sum, item) => sum + item.priceAtPurchase * item.quantity,
    0
  );
  const totalCost = order.orderItems.reduce(
    (sum, item) => sum + (item.costAtPurchase ?? 0) * item.quantity,
    0
  );
  const profit = order.total - totalCost;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Back + header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/orders">
            <Button variant="ghost" size="icon-sm">
              <ChevronLeft className="size-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-semibold tracking-tight font-mono">
              {order.orderNumber}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Placed{" "}
              {new Date(order.createdAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${STATUS_STYLES[order.status]}`}
        >
          {order.status.charAt(0) + order.status.slice(1).toLowerCase()}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column — items + breakdown */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items table */}
          <div className="rounded-xl border">
            <div className="px-4 py-3 border-b">
              <h2 className="font-semibold text-sm">
                Order Items ({order.orderItems.length})
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                      Product
                    </th>
                    <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">
                      Qty
                    </th>
                    <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">
                      Sell Price
                    </th>
                    <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">
                      Cost
                    </th>
                    <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">
                      Profit
                    </th>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                      Supplier
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {order.orderItems.map((item) => {
                    const itemProfit =
                      (item.priceAtPurchase - (item.costAtPurchase ?? 0)) *
                      item.quantity;
                    return (
                      <tr
                        key={item.id}
                        className="border-b last:border-0 hover:bg-muted/20"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {item.product.images[0] ? (
                              <div className="relative size-10 rounded-md overflow-hidden border shrink-0">
                                <Image
                                  src={item.product.images[0]}
                                  alt={item.product.title}
                                  fill
                                  className="object-cover"
                                  sizes="40px"
                                />
                              </div>
                            ) : (
                              <div className="size-10 rounded-md border bg-muted shrink-0" />
                            )}
                            <span className="font-medium leading-tight line-clamp-2">
                              {item.product.title}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {formatPrice(item.priceAtPurchase)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                          {item.costAtPurchase != null
                            ? formatPrice(item.costAtPurchase)
                            : "—"}
                        </td>
                        <td
                          className={`px-4 py-3 text-right tabular-nums font-medium ${
                            itemProfit >= 0
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {formatPrice(itemProfit)}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {item.supplierOrder?.supplier?.name ?? "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial breakdown */}
          <div className="rounded-xl border">
            <div className="px-4 py-3 border-b">
              <h2 className="font-semibold text-sm">Financial Breakdown</h2>
            </div>
            <div className="px-4 py-4 space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal (revenue)</span>
                <span className="tabular-nums">{formatPrice(subtotalRevenue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping charged</span>
                <span className="tabular-nums">{formatPrice(order.shippingCost)}</span>
              </div>
              <div className="flex justify-between font-medium border-t pt-2.5">
                <span>Total Revenue</span>
                <span className="tabular-nums">{formatPrice(order.total)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Total Cost (supplier)</span>
                <span className="tabular-nums">{formatPrice(totalCost)}</span>
              </div>
              <div
                className={`flex justify-between font-semibold text-base border-t pt-2.5 ${
                  profit >= 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                <span>Profit</span>
                <span className="tabular-nums">{formatPrice(profit)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right column — customer, address, status change */}
        <div className="space-y-6">
          {/* Customer info */}
          <div className="rounded-xl border">
            <div className="px-4 py-3 border-b">
              <h2 className="font-semibold text-sm">Customer</h2>
            </div>
            <div className="px-4 py-4 text-sm space-y-1.5">
              {order.user ? (
                <>
                  <p className="font-medium">{order.user.name ?? "—"}</p>
                  <p className="text-muted-foreground">{order.user.email}</p>
                  <Link
                    href={`/admin/users/${order.user.id}`}
                    className="text-primary text-xs hover:underline"
                  >
                    View customer profile →
                  </Link>
                </>
              ) : (
                <>
                  <p className="font-medium">Guest checkout</p>
                  <p className="text-muted-foreground">
                    {order.guestEmail ?? "—"}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Shipping address */}
          <div className="rounded-xl border">
            <div className="px-4 py-3 border-b">
              <h2 className="font-semibold text-sm">Shipping Address</h2>
            </div>
            <div className="px-4 py-4 text-sm space-y-0.5 text-muted-foreground">
              {shippingAddress.firstName || shippingAddress.lastName ? (
                <p className="font-medium text-foreground">
                  {[shippingAddress.firstName, shippingAddress.lastName]
                    .filter(Boolean)
                    .join(" ")}
                </p>
              ) : null}
              {shippingAddress.street && <p>{shippingAddress.street}</p>}
              {(shippingAddress.city ||
                shippingAddress.state ||
                shippingAddress.postalCode) && (
                <p>
                  {[
                    shippingAddress.city,
                    shippingAddress.state,
                    shippingAddress.postalCode,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              )}
              {shippingAddress.country && <p>{shippingAddress.country}</p>}
              {shippingAddress.phone && (
                <p className="mt-1">{shippingAddress.phone}</p>
              )}
            </div>
          </div>

          {/* Status change */}
          <div className="rounded-xl border">
            <div className="px-4 py-3 border-b">
              <h2 className="font-semibold text-sm">Update Status</h2>
            </div>
            <div className="px-4 py-4">
              <OrderStatusForm orderId={order.id} currentStatus={order.status} />
            </div>
          </div>

          {/* Stripe info */}
          {(order.stripePaymentIntentId || order.stripeCheckoutSessionId) && (
            <div className="rounded-xl border">
              <div className="px-4 py-3 border-b">
                <h2 className="font-semibold text-sm">Payment</h2>
              </div>
              <div className="px-4 py-4 text-xs space-y-1.5 text-muted-foreground font-mono break-all">
                {order.stripePaymentIntentId && (
                  <p>PI: {order.stripePaymentIntentId}</p>
                )}
                {order.stripeCheckoutSessionId && (
                  <p>CS: {order.stripeCheckoutSessionId}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
