"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { refreshListingFromSupplier, updateProductSupplierPrice } from "@/app/actions/suppliers";
import { splitPrice } from "@/lib/utils";
import { toast } from "sonner";
import { Pencil, X, Check, RefreshCw } from "lucide-react";

interface Props {
  productId: string;
  supplierId: string;
  currentCost: number;
  currentShipping: number;
  currentInStock: boolean;
  currentMoq?: number;
  currentLeadTimeDays?: number | null;
  currentSourceCurrency?: string | null;
  currentSourceCostPrice?: number | null;
  /** Show the MOQ / quote fields (B2B suppliers). */
  b2b?: boolean;
  /** Show a "refresh from API" button (CJ). */
  live?: boolean;
}

const symbol = splitPrice(0).symbol;
const smallInput =
  "rounded-[3px] border bg-background px-1.5 py-0.5 text-xs outline-none focus:ring-1 focus:ring-ring/50 tabular-nums";

export function InlinePriceEditor({
  productId,
  supplierId,
  currentCost,
  currentShipping,
  currentInStock,
  currentMoq = 1,
  currentLeadTimeDays,
  currentSourceCurrency,
  currentSourceCostPrice,
  b2b = false,
  live = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [cost, setCost] = useState((currentCost / 100).toFixed(2));
  const [shipping, setShipping] = useState((currentShipping / 100).toFixed(2));
  const [inStock, setInStock] = useState(currentInStock);
  const [moq, setMoq] = useState(String(currentMoq));
  const [lead, setLead] = useState(currentLeadTimeDays != null ? String(currentLeadTimeDays) : "");
  const [srcCurrency, setSrcCurrency] = useState(currentSourceCurrency ?? "USD");
  const [srcCost, setSrcCost] = useState(currentSourceCostPrice != null ? String(currentSourceCostPrice) : "");
  const [isPending, startTransition] = useTransition();

  function handleOpen() {
    setCost((currentCost / 100).toFixed(2));
    setShipping((currentShipping / 100).toFixed(2));
    setInStock(currentInStock);
    setMoq(String(currentMoq));
    setLead(currentLeadTimeDays != null ? String(currentLeadTimeDays) : "");
    setSrcCurrency(currentSourceCurrency ?? "USD");
    setSrcCost(currentSourceCostPrice != null ? String(currentSourceCostPrice) : "");
    setOpen(true);
  }

  function handleRefresh() {
    startTransition(async () => {
      const result = await refreshListingFromSupplier(productId, supplierId);
      if (result.success) toast.success("Quote refreshed from supplier");
      else toast.error(result.error ?? "Refresh failed");
    });
  }

  function handleSave() {
    const costCents = Math.round(parseFloat(cost) * 100);
    const shippingCents = Math.round(parseFloat(shipping) * 100);
    const moqNum = b2b ? parseInt(moq, 10) : undefined;
    const leadNum = b2b && lead !== "" ? parseInt(lead, 10) : undefined;
    const srcCostNum = b2b && srcCost !== "" ? parseFloat(srcCost) : undefined;

    if (isNaN(costCents) || isNaN(shippingCents) || costCents < 0 || shippingCents < 0) {
      toast.error("Invalid price values");
      return;
    }
    if (moqNum !== undefined && (isNaN(moqNum) || moqNum < 1)) {
      toast.error("MOQ must be at least 1");
      return;
    }

    startTransition(async () => {
      const result = await updateProductSupplierPrice(productId, supplierId, costCents, shippingCents, inStock, {
        moq: moqNum,
        leadTimeDays: leadNum,
        sourceCurrency: b2b ? srcCurrency.toUpperCase() : undefined,
        sourceCostPrice: srcCostNum,
      });
      if (result.success) {
        toast.success("Listing updated");
        setOpen(false);
      } else {
        toast.error(result.error ?? "Failed to update listing");
      }
    });
  }

  if (!open) {
    return (
      <div className="inline-flex items-center gap-0.5">
        {live && (
          <Button variant="ghost" size="icon-sm" onClick={handleRefresh} disabled={isPending} title="Refresh quote from supplier API">
            <RefreshCw className={`size-3.5 ${isPending ? "animate-spin" : ""}`} />
          </Button>
        )}
        <Button variant="ghost" size="icon-sm" onClick={handleOpen} title="Edit listing">
          <Pencil className="size-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 justify-end flex-wrap max-w-[420px]">
      <label className="flex items-center gap-1 text-xs text-muted-foreground">
        Cost {symbol}
        <input type="number" value={cost} onChange={(e) => setCost(e.target.value)} step="0.01" min="0" disabled={isPending} className={`w-20 ${smallInput}`} />
      </label>
      <label className="flex items-center gap-1 text-xs text-muted-foreground">
        Ship {symbol}
        <input type="number" value={shipping} onChange={(e) => setShipping(e.target.value)} step="0.01" min="0" disabled={isPending} className={`w-16 ${smallInput}`} />
      </label>
      {b2b && (
        <>
          <label className="flex items-center gap-1 text-xs text-muted-foreground">
            MOQ
            <input type="number" value={moq} onChange={(e) => setMoq(e.target.value)} step="1" min="1" disabled={isPending} className={`w-14 ${smallInput}`} />
          </label>
          <label className="flex items-center gap-1 text-xs text-muted-foreground">
            Lead d
            <input type="number" value={lead} onChange={(e) => setLead(e.target.value)} step="1" min="0" disabled={isPending} className={`w-12 ${smallInput}`} />
          </label>
          <label className="flex items-center gap-1 text-xs text-muted-foreground">
            Quote
            <input type="text" value={srcCurrency} onChange={(e) => setSrcCurrency(e.target.value)} maxLength={3} disabled={isPending} className={`w-12 uppercase ${smallInput}`} />
            <input type="number" value={srcCost} onChange={(e) => setSrcCost(e.target.value)} step="0.01" min="0" disabled={isPending} className={`w-16 ${smallInput}`} />
          </label>
        </>
      )}
      <label className="flex items-center gap-1 text-xs cursor-pointer">
        <input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)} disabled={isPending} className="size-3 accent-[var(--signal-deep)]" />
        <span className="text-muted-foreground">Stock</span>
      </label>
      <Button variant="ghost" size="icon-xs" onClick={handleSave} disabled={isPending} className="text-go hover:text-go">
        <Check className="size-3" />
      </Button>
      <Button variant="ghost" size="icon-xs" onClick={() => setOpen(false)} disabled={isPending} className="text-muted-foreground">
        <X className="size-3" />
      </Button>
    </div>
  );
}
