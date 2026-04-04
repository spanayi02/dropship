import { redirect } from "next/navigation";
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

export default async function AccountOverviewPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login?callbackUrl=/account");

  const [recentOrders, addresses] = await Promise.all([
    db.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: {
        orderItems: { select: { id: true } },
      },
    }),
    db.address.findMany({
      where: { userId },
      take: 2,
      orderBy: [{ isDefault: "desc" }, { id: "asc" }],
    }),
  ]);

  const firstName = session!.user!.name?.split(" ")[0] ?? "there";

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h1 className="text-xl font-semibold">Welcome back, {firstName}!</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here&apos;s a summary of your account activity.
        </p>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Orders", href: "/account/orders", icon: "📦" },
          { label: "Addresses", href: "/account/addresses", icon: "📍" },
          { label: "Wishlist", href: "/account/wishlist", icon: "❤️" },
          { label: "Settings", href: "/account/settings", icon: "⚙️" },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 text-center hover:bg-muted transition-colors"
          >
            <span className="text-2xl">{link.icon}</span>
            <span className="text-sm font-medium">{link.label}</span>
          </Link>
        ))}
      </div>

      {/* Recent orders */}
      <section className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-base font-semibold">Recent orders</h2>
          <Link href="/account/orders" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
            View all
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm text-muted-foreground">No orders yet.</p>
            <Link href="/products" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-4")}>
              Start shopping
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {recentOrders.map((order) => (
              <Link
                key={order.id}
                href={`/account/orders/${order.id}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-muted/50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium font-mono">{order.orderNumber}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {order.createdAt.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}{" "}
                    · {order.orderItems.length} item{order.orderItems.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={[
                      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                      STATUS_STYLES[order.status],
                    ].join(" ")}
                  >
                    {STATUS_LABELS[order.status]}
                  </span>
                  <span className="text-sm font-semibold tabular-nums">
                    {formatPrice(order.total)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Saved addresses */}
      <section className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-base font-semibold">Saved addresses</h2>
          <Link href="/account/addresses" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
            Manage
          </Link>
        </div>

        {addresses.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm text-muted-foreground">No saved addresses.</p>
            <Link href="/account/addresses" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-4")}>
              Add an address
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {addresses.map((addr) => (
              <div key={addr.id} className="px-6 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="text-sm space-y-0.5">
                    <p className="font-medium">
                      {addr.firstName} {addr.lastName}
                      {addr.isDefault && (
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          (default)
                        </span>
                      )}
                    </p>
                    <p className="text-muted-foreground">{addr.street}</p>
                    <p className="text-muted-foreground">
                      {addr.city}, {addr.state} {addr.postalCode}, {addr.country}
                    </p>
                  </div>
                  {addr.label && (
                    <span className="text-xs text-muted-foreground bg-muted rounded px-1.5 py-0.5">
                      {addr.label}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
