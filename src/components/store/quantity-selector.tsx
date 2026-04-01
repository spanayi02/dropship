"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";

interface QuantitySelectorProps {
  min?: number;
  max?: number;
  defaultValue?: number;
  onChange?: (qty: number) => void;
}

export function QuantitySelector({
  min = 1,
  max = 10,
  defaultValue = 1,
  onChange,
}: QuantitySelectorProps) {
  const [qty, setQty] = useState(defaultValue);

  function update(next: number) {
    const clamped = Math.min(max, Math.max(min, next));
    setQty(clamped);
    onChange?.(clamped);
  }

  return (
    <div
      className="flex items-center rounded-xl border border-border overflow-hidden"
      role="group"
      aria-label="Quantity selector"
    >
      <button
        type="button"
        onClick={() => update(qty - 1)}
        disabled={qty <= min}
        className="flex h-11 w-11 items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:pointer-events-none"
        aria-label="Decrease quantity"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span
        className="flex h-11 w-12 items-center justify-center border-x border-border text-sm font-semibold tabular-nums"
        aria-live="polite"
        aria-atomic="true"
      >
        {qty}
      </span>
      <button
        type="button"
        onClick={() => update(qty + 1)}
        disabled={qty >= max}
        className="flex h-11 w-11 items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:pointer-events-none"
        aria-label="Increase quantity"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
