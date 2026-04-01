import { Suspense } from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import { OrderStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  Package,
} from "lucide-react";
import { BulkActionsBar } from "./bulk-actions-bar";

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Orders",
};

const ORDER_STATUSES: OrderStatus[] = [
  "PENDING",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

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

const PAGE_SIZE = 25;

interface PageProps {
  searchParams: Promise<{
    q?: string;
    status?: string;
    page?: string;
  }>;
}

export default async function OrdersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const statusFilter =
    params.status && ORDER_STATUSES.includes(params.status as OrderStatus)
      ? (params.status as OrderStatus)
      : null;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const skip = (page - 1) * PAGE_SIZE;

  const where = {
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(query
      ? {
          OR: [
            { orderNumber: { contains: query, mode: "insensitive" as const } },
            { user: { email: { contains: query, mode: "insensitive" as const } } },
            { guestEmail: { contains: query, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [orders, total] = await Promise.all([
    db.order.findMany({
      where,
      include: {
        user: { select: { email: true, name: true } },
        orderItems: {
          select: {
            id: true,
            costAtPurchase: true,
            quantity: true,
            supplierOrder: { select: { status: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
    }),
    db.order.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  function buildUrl(overrides: Record<string, string | undefined>) {
    const p = new URLSearchParams();
    if (query) p.set("q", query);
    if (statusFilter) p.set("status", statusFilter);
    if (page > 1) p.set("page", String(page));
    for (const [k, v] of Object.entries(overrides)) {
      if (v === undefined) p.delete(k);
      else p.set(k, v);
    }
    const s = p.toString();
    return s ? `?${s}` : "?";
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {total} order{total !== 1 ? "s" : ""} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/orders/queue">
            <Button variant="outline" size="sm">
              <Package className="size-4 mr-1.5" />
              Supplier Queue
            </Button>
          </Link>
          {/* Export stub */}
          <Button variant="outline" size="sm">
            <Download className="size-4 mr-1.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <form className="relative flex-1 max-w-sm" action="/admin/orders">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <input
            name="q"
            defaultValue={query}
            placeholder="Search order # or email…"
            className="w-full rounded-lg border bg-background pl-8 pr-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring/50"
          />
          {statusFilter && (
            <input type="hidden" name="status" value={statusFilter} />
          )}
        </form>

        {/* Status tabs */}
        <div className="flex items-center gap-1 flex-wrap">
          <Link
            href={buildUrl({ status: undefined, page: undefined })}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              !statusFilter
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            All
          </Link>
          {ORDER_STATUSES.map((s) => (
            <Link
              key={s}
              href={buildUrl({ status: s, page: undefined })}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {s.charAt(0) + s.slice(1).toLowerCase()}
            </Link>
          ))}
        </div>
      </div>

      {/* Bulk actions */}
      <Suspense>
        <BulkActionsBar />
      </Suspense>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="w-10 px-4 py-3">
                  <span className="sr-only">Select</span>
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Order #
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Customer
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Date
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                  Items
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                  Total
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                  Profit
                </th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    No orders found
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const totalCost = order.orderItems.reduce(
                    (sum, item) =>
                      sum + (item.costAtPurchase ?? 0) * item.quantity,
                    0
                  );
                  const profit = order.total - totalCost;
                  const customerEmail =
                    order.user?.email ?? order.guestEmail ?? "Guest";
                  const customerName = order.user?.name;

                  return (
                    <tr
                      key={order.id}
                      className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          data-order-id={order.id}
                          data-order-status={order.status}
                          className="rounded border-border size-4 accent-primary cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="font-mono text-xs font-medium text-primary hover:underline"
                        >
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium leading-tight">
                          {customerName ?? customerEmail}
                        </div>
                        {customerName && (
                          <div className="text-xs text-muted-foreground">
                            {customerEmail}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {order.orderItems.length}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium">
                        {formatPrice(order.total)}
                      </td>
                      <td
                        className={`px-4 py-3 text-right tabular-nums font-medium ${
                          profit >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {formatPrice(profit)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[order.status]}`}
                        >
                          {order.status.charAt(0) +
                            order.status.slice(1).toLowerCase()}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            {page > 1 ? (
              <Link href={buildUrl({ page: String(page - 1) })}>
                <Button variant="outline" size="icon-sm">
                  <ChevronLeft className="size-4" />
                </Button>
              </Link>
            ) : (
              <Button variant="outline" size="icon-sm" disabled>
                <ChevronLeft className="size-4" />
              </Button>
            )}
            {page < totalPages ? (
              <Link href={buildUrl({ page: String(page + 1) })}>
                <Button variant="outline" size="icon-sm">
                  <ChevronRight className="size-4" />
                </Button>
              </Link>
            ) : (
              <Button variant="outline" size="icon-sm" disabled>
                <ChevronRight className="size-4" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
