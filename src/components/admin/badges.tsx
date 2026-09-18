import type { OrderStatus, SupplierApiType, SupplierOrderStatus } from "@prisma/client";
import { cn } from "@/lib/utils";

/**
 * Admin badges in the departure-board vocabulary: signal = needs a human,
 * ink = in motion, go = done, stop = problem. One place, so every admin table
 * says the same thing with the same colour.
 */

const ORDER_STATUS_STYLES: Record<OrderStatus, string> = {
  PENDING: "bg-signal text-signal-foreground",
  PROCESSING: "bg-ink text-ink-foreground",
  SHIPPED: "border border-ink/40 text-foreground",
  DELIVERED: "bg-go/15 text-foreground",
  CANCELLED: "bg-stop/10 text-stop",
};

const SUPPLIER_ORDER_STATUS_STYLES: Record<SupplierOrderStatus, string> = {
  PENDING: "bg-signal text-signal-foreground",
  ORDERED: "bg-ink text-ink-foreground",
  SHIPPED: "border border-ink/40 text-foreground",
  DELIVERED: "bg-go/15 text-foreground",
};

export function StatusBadge({
  status,
  kind = "order",
  className,
}: {
  status: string;
  kind?: "order" | "supplierOrder";
  className?: string;
}) {
  const styles =
    kind === "order"
      ? ORDER_STATUS_STYLES[status as OrderStatus]
      : SUPPLIER_ORDER_STATUS_STYLES[status as SupplierOrderStatus];
  return (
    <span
      className={cn(
        "label-sign inline-flex items-center rounded-[2px] px-2 py-1",
        styles ?? "bg-muted text-muted-foreground",
        className
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

export const SUPPLIER_TYPE_LABELS: Record<SupplierApiType, string> = {
  MANUAL: "Manual",
  CJ: "CJ Dropshipping",
  ALIEXPRESS: "AliExpress",
  ALIBABA: "Alibaba",
  MADE_IN_CHINA: "Made-in-China",
  CUSTOM: "Custom",
};

const SUPPLIER_TYPE_STYLES: Record<SupplierApiType, string> = {
  CJ: "bg-ink text-ink-foreground",
  ALIEXPRESS: "bg-signal text-signal-foreground",
  ALIBABA: "border border-ink/40 text-foreground",
  MADE_IN_CHINA: "border border-ink/40 text-foreground",
  MANUAL: "bg-muted text-foreground",
  CUSTOM: "bg-muted text-foreground",
};

export function SupplierTypeBadge({ type, className }: { type: SupplierApiType; className?: string }) {
  return (
    <span
      className={cn(
        "label-sign inline-flex items-center rounded-[2px] px-2 py-1",
        SUPPLIER_TYPE_STYLES[type] ?? SUPPLIER_TYPE_STYLES.MANUAL,
        className
      )}
    >
      {SUPPLIER_TYPE_LABELS[type] ?? type}
    </span>
  );
}

/** "API" for suppliers that order themselves, "manual" for the queue. */
export function FulfilmentBadge({ apiType }: { apiType: SupplierApiType }) {
  const api = apiType === "CJ";
  return (
    <span
      className={cn(
        "label-sign inline-flex items-center gap-1.5 rounded-[2px] px-2 py-1",
        api ? "bg-go/15 text-foreground" : "bg-muted text-muted-foreground"
      )}
    >
      <span className={cn("size-1.5 rounded-full", api ? "bg-go" : "bg-muted-foreground/60")} />
      {api ? "Auto-order" : "Manual order"}
    </span>
  );
}
