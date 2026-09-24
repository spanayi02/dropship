"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductCard, type ProductCardProduct } from "@/components/store/product-card";

export interface CollectionTab {
  id: string;
  label: string;
  href: string;
  products: ProductCardProduct[];
}

/**
 * "Best sellers / New in / Top rated" switcher over a product grid — the
 * featured-collection block most storefront themes open their catalogue with.
 */
export function CollectionTabs({
  title,
  tabs,
  viewAllLabel,
}: {
  title: string;
  tabs: CollectionTab[];
  viewAllLabel: string;
}) {
  const visible = tabs.filter((tab) => tab.products.length > 0);
  const [active, setActive] = useState(visible[0]?.id);
  const baseId = useId();

  if (visible.length === 0) return null;
  const current = visible.find((tab) => tab.id === active) ?? visible[0];

  function onKeyDown(e: React.KeyboardEvent<HTMLButtonElement>, i: number) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = visible[(i + (e.key === "ArrowRight" ? 1 : -1) + visible.length) % visible.length];
    setActive(next.id);
    document.getElementById(`${baseId}-tab-${next.id}`)?.focus();
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="text-2xl sm:text-3xl">{title}</h2>
        <div
          role="tablist"
          aria-label={title}
          className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0"
        >
          {visible.map((tab, i) => {
            const selected = tab.id === current.id;
            return (
              <button
                key={tab.id}
                id={`${baseId}-tab-${tab.id}`}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={`${baseId}-panel`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActive(tab.id)}
                onKeyDown={(e) => onKeyDown(e, i)}
                className={cn(
                  "h-10 flex-none rounded-full px-5 text-sm font-medium transition-colors",
                  selected
                    ? "bg-primary text-primary-foreground"
                    : "border border-border-strong text-foreground hover:bg-muted"
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div
        id={`${baseId}-panel`}
        role="tabpanel"
        aria-labelledby={`${baseId}-tab-${current.id}`}
        className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4"
      >
        {current.products.slice(0, 8).map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      <div className="mt-10 flex justify-center">
        <Link
          href={current.href}
          className="inline-flex h-11 items-center gap-2 rounded-full border border-border-strong px-6 text-sm font-medium transition-colors hover:bg-muted"
        >
          {viewAllLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
