"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { bulkUpdateOrderStatus } from "@/app/actions/orders";
import { toast } from "sonner";

export function BulkActionsBar() {
  const [isPending, startTransition] = useTransition();
  const [count, setCount] = useState(0);

  // This component listens for checkbox changes via event delegation on mount
  // In a real implementation we'd use a proper state manager or URL state
  // For now, expose a simple "select all pending + mark processing" UX
  function getSelectedPendingIds(): string[] {
    if (typeof document === "undefined") return [];
    const checkboxes = document.querySelectorAll<HTMLInputElement>(
      "input[data-order-id][data-order-status='PENDING']:checked"
    );
    return Array.from(checkboxes).map((c) => c.dataset.orderId!);
  }

  function handleMarkProcessing() {
    const ids = getSelectedPendingIds();
    if (ids.length === 0) {
      toast.error("No pending orders selected");
      return;
    }

    startTransition(async () => {
      const result = await bulkUpdateOrderStatus(ids, "PROCESSING");
      if (result.success) {
        toast.success(`${result.count} order(s) marked as Processing`);
        setCount(0);
        // Uncheck all
        document
          .querySelectorAll<HTMLInputElement>("input[data-order-id]:checked")
          .forEach((c) => {
            c.checked = false;
          });
      } else {
        toast.error(result.error ?? "Failed to update orders");
      }
    });
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-2 text-sm">
      <span className="text-muted-foreground">Bulk actions:</span>
      <Button
        variant="outline"
        size="sm"
        onClick={handleMarkProcessing}
        disabled={isPending}
      >
        {isPending ? "Updating…" : "Mark selected as Processing"}
      </Button>
      <span className="text-xs text-muted-foreground">
        (Select pending orders via checkboxes)
      </span>
    </div>
  );
}
