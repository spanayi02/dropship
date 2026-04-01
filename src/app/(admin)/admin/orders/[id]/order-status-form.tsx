"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { updateOrderStatus } from "@/app/actions/orders";
import { OrderStatus } from "@prisma/client";
import { toast } from "sonner";

const ORDER_STATUSES: OrderStatus[] = [
  "PENDING",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

interface Props {
  orderId: string;
  currentStatus: OrderStatus;
}

export function OrderStatusForm({ orderId, currentStatus }: Props) {
  const [selected, setSelected] = useState<OrderStatus>(currentStatus);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    if (selected === currentStatus) {
      toast.info("Status unchanged");
      return;
    }

    startTransition(async () => {
      const result = await updateOrderStatus(orderId, selected);
      if (result.success) {
        toast.success(`Order status updated to ${selected.toLowerCase()}`);
      } else {
        toast.error(result.error ?? "Failed to update status");
        setSelected(currentStatus);
      }
    });
  }

  return (
    <div className="space-y-3">
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value as OrderStatus)}
        disabled={isPending}
        className="w-full rounded-lg border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring/50 disabled:opacity-50"
      >
        {ORDER_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s.charAt(0) + s.slice(1).toLowerCase()}
          </option>
        ))}
      </select>
      <Button
        onClick={handleSubmit}
        disabled={isPending || selected === currentStatus}
        size="sm"
        className="w-full"
      >
        {isPending ? "Updating…" : "Update Status"}
      </Button>
    </div>
  );
}
