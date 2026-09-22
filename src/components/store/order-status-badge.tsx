import type { OrderStatus } from "@prisma/client";
import { cn } from "@/lib/utils";
import { getT } from "@/lib/i18n/server";
import type { TKey } from "@/lib/i18n";

/**
 * Order status, in the store's status palette: amber while it is waiting on
 * someone, ink while it is moving, green when it has landed, red when it is
 * off. Used on the confirmation page and throughout the account area.
 */
const STYLES: Record<OrderStatus, string> = {
  PENDING: "bg-warning-soft text-warning",
  PROCESSING: "bg-secondary text-foreground",
  SHIPPED: "bg-brand-soft text-brand",
  DELIVERED: "bg-success-soft text-success",
  CANCELLED: "bg-sale-soft text-sale",
};

const KEYS: Record<OrderStatus, TKey> = {
  PENDING: "order.statusPending",
  PROCESSING: "order.statusProcessing",
  SHIPPED: "order.statusShipped",
  DELIVERED: "order.statusDelivered",
  CANCELLED: "order.statusCancelled",
};

export async function OrderStatusBadge({
  status,
  className,
}: {
  status: OrderStatus;
  className?: string;
}) {
  const { t } = await getT();
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        STYLES[status],
        className
      )}
    >
      {t(KEYS[status])}
    </span>
  );
}
