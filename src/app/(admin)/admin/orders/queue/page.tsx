import Link from "next/link";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import { ExternalLink, Mail, MessageSquare } from "lucide-react";
import { FulfilmentBadge, StatusBadge, SupplierTypeBadge } from "@/components/admin/badges";
import { MarkOrderedForm } from "./mark-ordered-form";

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Supplier Order Queue",
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
      supplier: (typeof supplierOrders)[number]["supplier"];
      items: typeof supplierOrders;
    }
  >();

  for (const so of supplierOrders) {
    if (!grouped.has(so.supplierId)) {
      grouped.set(so.supplierId, {
        supplierId: so.supplierId,
        supplierName: so.supplier.name,
        supplier: so.supplier,
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
            {supplierOrders.length} line{supplierOrders.length !== 1 ? "s" : ""} waiting. PENDING = you place it with
            the supplier; ORDERED = placed, waiting for tracking.
          </p>
        </div>
      </div>

      {/* Supplier filter */}
      {allSuppliers.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/admin/orders/queue"
            className={`rounded-[3px] px-3 py-1.5 text-xs font-medium transition-colors ${
              !supplierFilter
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            All Suppliers
          </Link>
          {allSuppliers.map((s) => (
            <Link
              key={s.id}
              href={`/admin/orders/queue?supplier=${s.id}`}
              className={`rounded-[3px] px-3 py-1.5 text-xs font-medium transition-colors ${
                supplierFilter === s.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {s.name}
            </Link>
          ))}
        </div>
      )}

      {groups.length === 0 ? (
        <div className="rounded-[4px] border p-12 text-center text-muted-foreground">
          <p className="text-lg font-medium">Queue is empty</p>
          <p className="text-sm mt-1">All supplier orders are up to date.</p>
        </div>
      ) : (
        groups.map((group) => (
          <div key={group.supplierId} className="rounded-[4px] border overflow-hidden">
            {/* Group header */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b bg-muted/40">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-semibold">{group.supplierName}</h2>
                  <SupplierTypeBadge type={group.supplier.apiType} />
                  <FulfilmentBadge apiType={group.supplier.apiType} />
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {group.items.length} line{group.items.length !== 1 ? "s" : ""}
                  {group.supplier.leadTimeDays != null && ` · lead ${group.supplier.leadTimeDays}d`}
                  {group.supplier.avgShippingDays != null && ` · transit ${group.supplier.avgShippingDays}d`}
                  {group.supplier.paymentTerms && ` · ${group.supplier.paymentTerms}`}
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                {group.supplier.website && (
                  <a href={group.supplier.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:underline underline-offset-4">
                    <ExternalLink className="size-3" /> Storefront
                  </a>
                )}
                {group.supplier.contactUrl && (
                  <a href={group.supplier.contactUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:underline underline-offset-4">
                    <MessageSquare className="size-3" /> Contact
                  </a>
                )}
                {group.supplier.contactEmail && (
                  <a href={`mailto:${group.supplier.contactEmail}`} className="inline-flex items-center gap-1 hover:underline underline-offset-4">
                    <Mail className="size-3" /> {group.supplier.contactEmail}
                  </a>
                )}
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
                        <Link
                          href={`/admin/orders/${so.orderItem.order.id}`}
                          className="font-mono text-xs font-medium hover:underline underline-offset-4"
                        >
                          {so.orderItem.order.orderNumber}
                        </Link>
                        <StatusBadge status={so.status} kind="supplierOrder" />
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

                      {/* Listing details: link, SKU, MOQ */}
                      <SupplierListingInfo
                        productId={so.orderItem.productId}
                        supplierId={so.supplierId}
                        quantity={so.orderItem.quantity}
                      />

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

// Server sub-component: the listing the owner needs to order from.
async function SupplierListingInfo({
  productId,
  supplierId,
  quantity,
}: {
  productId: string;
  supplierId: string;
  quantity: number;
}) {
  const ps = await db.productSupplier.findUnique({
    where: { productId_supplierId: { productId, supplierId } },
    select: {
      supplierProductUrl: true,
      supplierSku: true,
      variantId: true,
      moq: true,
      sourceCurrency: true,
      sourceCostPrice: true,
      warehouseCountry: true,
      estimatedDeliveryDays: true,
    },
  });

  if (!ps) return null;
  const belowMoq = ps.moq > 1 && quantity < ps.moq;

  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
      {ps.supplierProductUrl && (
        <a
          href={ps.supplierProductUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-foreground hover:underline underline-offset-4"
        >
          <ExternalLink className="size-3" />
          Open listing
        </a>
      )}
      {ps.supplierSku && <span className="font-mono">SKU {ps.supplierSku}</span>}
      {ps.variantId && <span className="font-mono">vid {ps.variantId}</span>}
      {ps.warehouseCountry && <span>from {ps.warehouseCountry}</span>}
      {ps.estimatedDeliveryDays != null && <span>{ps.estimatedDeliveryDays}d</span>}
      {ps.moq > 1 && (
        <span className={belowMoq ? "label-sign rounded-[2px] bg-signal px-1.5 py-0.5 text-signal-foreground" : ""}>
          MOQ {ps.moq}
          {belowMoq ? ` · order qty ${quantity} is below MOQ` : ""}
        </span>
      )}
      {ps.sourceCostPrice != null && (
        <span>
          quote {ps.sourceCurrency ?? "USD"} {ps.sourceCostPrice.toFixed(2)}
        </span>
      )}
    </div>
  );
}
