"use client";

import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { ProductFilters } from "@/components/store/product-filters";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  slug: string;
  _count: { products: number };
}

interface MobileFiltersSheetProps {
  categories: Category[];
  currentCategory?: string;
  currentMinPrice?: string;
  currentMaxPrice?: string;
  currentInStock?: boolean;
  currentParams: Record<string, string>;
}

export function MobileFiltersSheet({
  categories,
  currentCategory,
  currentMinPrice,
  currentMaxPrice,
  currentInStock,
  currentParams,
}: MobileFiltersSheetProps) {
  const [open, setOpen] = useState(false);

  const activeCount = [currentCategory, currentMinPrice || currentMaxPrice, currentInStock].filter(Boolean).length;

  return (
    <>
      {/* Trigger */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors flex-shrink-0"
        aria-label="Open filters"
      >
        <SlidersHorizontal className="h-4 w-4" />
        Filters
        {activeCount > 0 && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--emerald)] text-[10px] font-bold text-white">
            {activeCount}
          </span>
        )}
      </button>

      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity duration-300",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Product filters"
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 max-h-[85dvh] overflow-y-auto rounded-t-2xl bg-background shadow-2xl transition-transform duration-300",
          open ? "translate-y-0" : "translate-y-full"
        )}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-12 rounded-full bg-border" />
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <h3
            className="font-semibold text-base"
            style={{ fontFamily: "var(--font-heading), system-ui, sans-serif" }}
          >
            Filters
          </h3>
          <button
            onClick={() => setOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Close filters"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5">
          <ProductFilters
            categories={categories}
            currentCategory={currentCategory}
            currentMinPrice={currentMinPrice}
            currentMaxPrice={currentMaxPrice}
            currentInStock={currentInStock}
            currentParams={currentParams}
            onClose={() => setOpen(false)}
          />
        </div>
      </div>
    </>
  );
}
