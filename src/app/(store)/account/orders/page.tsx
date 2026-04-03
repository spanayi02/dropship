import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatPrice, cn } from "@/lib/utils";
import { buttonVariants } from "@/lib/button-variants";
import type { OrderStatus } from "@prisma/client";

export const dynamic = 'force-dynamic';

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

export default async function OrdersPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const orders = await db.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      orderItems: {
        select: { id: true },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Orders</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {orders.length > 0
            ? `${orders.length} order${orders.length !== 1 ? "s" : ""} total`
            : "Your order history will appear here."}
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h2 className="text-base font-semibold">No orders yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            When you place an order, it will appear here.
          </p>
          <Link href="/products" className={cn(buttonVariants(), "mt-6")}>
            Browse products
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {/* Table header — desktop */}
          <div className="hidden sm:grid sm:grid-cols-[auto_1fr_auto_auto_auto] gap-4 px-6 py-3 border-b border-border bg-muted/30 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            <span className="w-32">Order #</span>
            <span>Date</span>
            <span className="text-right">Items</span>
            <span className="text-right">Total</span>
            <span className="text-right">Status</span>
          </div>

          <div className="divide-y divide-border">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/account/orders/${order.id}`}
                className="flex flex-col gap-2 px-6 py-4 hover:bg-muted/50 transition-colors sm:grid sm:grid-cols-[auto_1fr_auto_auto_auto] sm:items-center sm:gap-4"
              >
                <span className="w-32 text-sm font-mono font-medium text-foreground truncate">
                  {order.orderNumber}
                </span>
                <span className="text-sm text-muted-foreground">
                  {order.createdAt.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                <span className="text-sm text-right tabular-nums">
                  {order.orderItems.length} item{order.orderItems.length !== 1 ? "s" : ""}
                </span>
                <span className="text-sm font-semibold text-right tabular-nums">
                  {formatPrice(order.total)}
                </span>
                <div className="flex sm:justify-end">
                  <span
                    className={[
                      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                      STATUS_STYLES[order.status],
                    ].join(" ")}
                  >
                    {STATUS_LABELS[order.status]}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
