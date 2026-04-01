"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { updateProductSupplierPrice } from "@/app/actions/suppliers";
import { toast } from "sonner";
import { Pencil, X, Check } from "lucide-react";

interface Props {
  productId: string;
  supplierId: string;
  currentCost: number;
  currentShipping: number;
  currentInStock: boolean;
}

export function InlinePriceEditor({
  productId,
  supplierId,
  currentCost,
  currentShipping,
  currentInStock,
}: Props) {
  const [open, setOpen] = useState(false);
  // Dollar inputs (converted from cents)
  const [cost, setCost] = useState((currentCost / 100).toFixed(2));
  const [shipping, setShipping] = useState((currentShipping / 100).toFixed(2));
  const [inStock, setInStock] = useState(currentInStock);
  const [isPending, startTransition] = useTransition();

  function handleOpen() {
    setCost((currentCost / 100).toFixed(2));
    setShipping((currentShipping / 100).toFixed(2));
    setInStock(currentInStock);
    setOpen(true);
  }

  function handleCancel() {
    setOpen(false);
  }

  function handleSave() {
    const costCents = Math.round(parseFloat(cost) * 100);
    const shippingCents = Math.round(parseFloat(shipping) * 100);

    if (isNaN(costCents) || isNaN(shippingCents) || costCents < 0 || shippingCents < 0) {
      toast.error("Invalid price values");
      return;
    }

    startTransition(async () => {
      const result = await updateProductSupplierPrice(
        productId,
        supplierId,
        costCents,
        shippingCents,
        inStock
      );
      if (result.success) {
        toast.success("Price updated");
        setOpen(false);
      } else {
        toast.error(result.error ?? "Failed to update price");
      }
    });
  }

  if (!open) {
    return (
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={handleOpen}
        title="Edit prices"
      >
        <Pencil className="size-3.5" />
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-1.5 justify-end flex-wrap">
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground">Cost $</span>
        <input
          type="number"
          value={cost}
          onChange={(e) => setCost(e.target.value)}
          step="0.01"
          min="0"
          disabled={isPending}
          className="w-20 rounded border bg-background px-1.5 py-0.5 text-xs outline-none focus:ring-1 focus:ring-ring/50 tabular-nums"
        />
      </div>
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground">Ship $</span>
        <input
          type="number"
          value={shipping}
          onChange={(e) => setShipping(e.target.value)}
          step="0.01"
          min="0"
          disabled={isPending}
          className="w-16 rounded border bg-background px-1.5 py-0.5 text-xs outline-none focus:ring-1 focus:ring-ring/50 tabular-nums"
        />
      </div>
      <label className="flex items-center gap-1 text-xs cursor-pointer">
        <input
          type="checkbox"
          checked={inStock}
          onChange={(e) => setInStock(e.target.checked)}
          disabled={isPending}
          className="rounded size-3 accent-primary"
        />
        <span className="text-muted-foreground">Stock</span>
      </label>
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={handleSave}
        disabled={isPending}
        className="text-green-600 hover:text-green-700"
      >
        <Check className="size-3" />
      </Button>
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={handleCancel}
        disabled={isPending}
        className="text-muted-foreground"
      >
        <X className="size-3" />
      </Button>
    </div>
  );
}
