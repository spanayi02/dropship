import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import { SupplierOrderStatus } from "@prisma/client";
import { ExternalLink } from "lucide-react";
import { MarkOrderedForm } from "./mark-ordered-form";

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Supplier Order Queue",
};

const STATUS_STYLES: Record<SupplierOrderStatus, string> = {
  PENDING:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  ORDERED:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  SHIPPED:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  DELIVERED:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
};

interface PageProps {
  searchParams: Promise<{ supplier?: string }>;
}

export default async function SupplierQueuePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const supplierFilter = params.supplier;

  const supplierOrders = await db.supplierOrder.findMany({
    where: {
      status: { in: ["PENDING", "ORDERED"] },
      ...(supplierFilter ? { supplierId: supplierFilter } : {}),
    },
    include: {
      supplier: true,
      orderItem: {
        include: {
          product: { select: { id: true, title: true, images: true } },
          order: {
            select: {
              id: true,
              orderNumber: true,
              createdAt: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  // All suppliers for filter dropdown
  const allSuppliers = await db.supplier.findMany({
    where: {
      supplierOrders: {
        some: { status: { in: ["PENDING", "ORDERED"] } },
      },
    },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  // Group by supplier
  const grouped = new Map<
    string,
    {
      supplierId: string;
      supplierName: string;
      items: typeof supplierOrders;
    }
  >();

  for (const so of supplierOrders) {
    if (!grouped.has(so.supplierId)) {
      grouped.set(so.supplierId, {
        supplierId: so.supplierId,
        supplierName: so.supplier.name,
        items: [],
      });
    }
    grouped.get(so.supplierId)!.items.push(so);
  }

  const groups = Array.from(grouped.values()).sort((a, b) =>
    a.supplierName.localeCompare(b.supplierName)
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Supplier Order Queue
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {supplierOrders.length} item{supplierOrders.length !== 1 ? "s" : ""}{" "}
            pending action
          </p>
        </div>
      </div>

      {/* Supplier filter */}
      {allSuppliers.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          <a
            href="/admin/orders/queue"
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              !supplierFilter
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            All Suppliers
          </a>
          {allSuppliers.map((s) => (
            <a
              key={s.id}
              href={`/admin/orders/queue?supplier=${s.id}`}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                supplierFilter === s.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {s.name}
            </a>
          ))}
        </div>
      )}

      {groups.length === 0 ? (
        <div className="rounded-xl border p-12 text-center text-muted-foreground">
          <p className="text-lg font-medium">Queue is empty</p>
          <p className="text-sm mt-1">All supplier orders are up to date.</p>
        </div>
      ) : (
        groups.map((group) => (
          <div key={group.supplierId} className="rounded-xl border overflow-hidden">
            {/* Group header */}
            <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/40">
              <div>
                <h2 className="font-semibold">{group.supplierName}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {group.items.length} item{group.items.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            {/* Items */}
            <div className="divide-y">
              {group.items.map((so) => (
                <div key={so.id} className="p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    {/* Left: order info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <a
                          href={`/admin/orders/${so.orderItem.order.id}`}
                          className="font-mono text-xs font-medium text-primary hover:underline"
                        >
                          {so.orderItem.order.orderNumber}
                        </a>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[so.status]}`}
                        >
                          {so.status.charAt(0) + so.status.slice(1).toLowerCase()}
                        </span>
                        {so.orderedAt && (
                          <span className="text-xs text-muted-foreground">
                            Ordered{" "}
                            {new Date(so.orderedAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        )}
                      </div>

                      <div className="mt-2">
                        <p className="font-medium text-sm leading-tight">
                          {so.orderItem.product.title}
                        </p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          <span>Qty: {so.orderItem.quantity}</span>
                          <span>
                            Cost:{" "}
                            {so.orderItem.costAtPurchase != null
                              ? formatPrice(so.orderItem.costAtPurchase)
                              : "—"}
                          </span>
                        </div>
                      </div>

                      {/* Supplier URL */}
                      {so.orderItem.selectedSupplierId && (
                        <SupplierProductLink
                          productId={so.orderItem.productId}
                          supplierId={so.orderItem.selectedSupplierId}
                        />
                      )}

                      {/* Existing tracking info */}
                      {so.supplierOrderRef && (
                        <div className="mt-2 text-xs text-muted-foreground space-y-0.5">
                          <p>Ref: <span className="font-mono">{so.supplierOrderRef}</span></p>
                          {so.trackingNumber && (
                            <p>
                              Tracking:{" "}
                              <span className="font-mono">{so.trackingNumber}</span>
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Right: action */}
                    {so.status === "PENDING" && (
                      <div className="shrink-0 w-full sm:w-72">
                        <MarkOrderedForm supplierOrderId={so.id} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// Server sub-component to fetch supplier URL
async function SupplierProductLink({
  productId,
  supplierId,
}: {
  productId: string;
  supplierId: string;
}) {
  const ps = await db.productSupplier.findUnique({
    where: { productId_supplierId: { productId, supplierId } },
    select: { supplierProductUrl: true },
  });

  if (!ps?.supplierProductUrl) return null;

  return (
    <a
      href={ps.supplierProductUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 mt-1.5 text-xs text-primary hover:underline"
    >
      <ExternalLink className="size-3" />
      View on supplier site
    </a>
  );
}
