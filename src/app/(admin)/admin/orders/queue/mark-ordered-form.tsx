"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { markSupplierOrderOrdered } from "@/app/actions/orders";
import { toast } from "sonner";
import { ChevronDown, ChevronUp } from "lucide-react";

interface Props {
  supplierOrderId: string;
}

export function MarkOrderedForm({ supplierOrderId }: Props) {
  const [open, setOpen] = useState(false);
  const [ref, setRef] = useState("");
  const [tracking, setTracking] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ref.trim()) {
      toast.error("Supplier order reference is required");
      return;
    }

    startTransition(async () => {
      const result = await markSupplierOrderOrdered(
        supplierOrderId,
        ref.trim(),
        tracking.trim() || undefined
      );

      if (result.success) {
        toast.success("Marked as ordered");
        setOpen(false);
        setRef("");
        setTracking("");
      } else {
        toast.error(result.error ?? "Failed to update");
      }
    });
  }

  if (!open) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="w-full"
      >
        <ChevronDown className="size-3.5 mr-1.5" />
        Mark as Ordered
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2.5">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-medium">Mark as Ordered</p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-muted-foreground hover:text-foreground"
        >
          <ChevronUp className="size-4" />
        </button>
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">
          Supplier Order Ref <span className="text-destructive">*</span>
        </label>
        <input
          value={ref}
          onChange={(e) => setRef(e.target.value)}
          placeholder="e.g. AE-123456789"
          required
          disabled={isPending}
          className="w-full rounded-lg border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring/50 disabled:opacity-50"
        />
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">
          Tracking Number (optional)
        </label>
        <input
          value={tracking}
          onChange={(e) => setTracking(e.target.value)}
          placeholder="e.g. LY123456789CN"
          disabled={isPending}
          className="w-full rounded-lg border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring/50 disabled:opacity-50"
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending} className="flex-1">
          {isPending ? "Saving…" : "Save"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setOpen(false)}
          disabled={isPending}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
