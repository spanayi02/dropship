"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  slug: string;
  _count: { products: number };
}

interface ProductFiltersProps {
  categories: Category[];
  currentCategory?: string;
  currentMinPrice?: string;
  currentMaxPrice?: string;
  currentInStock?: boolean;
  currentParams: Record<string, string>;
  onClose?: () => void;
}

export function ProductFilters({
  categories,
  currentCategory,
  currentMinPrice,
  currentMaxPrice,
  currentInStock,
  currentParams,
  onClose,
}: ProductFiltersProps) {
  const router = useRouter();

  const buildUrl = useCallback(
    (overrides: Record<string, string | undefined>) => {
      const next = { ...currentParams, ...overrides };
      // Remove undefined / empty keys
      const cleaned = Object.fromEntries(
        Object.entries(next).filter(([, v]) => v !== undefined && v !== "")
      );
      // Reset to page 1 on filter change
      delete cleaned.page;
      const qs = new URLSearchParams(cleaned as Record<string, string>).toString();
      return `/products${qs ? `?${qs}` : ""}`;
    },
    [currentParams]
  );

  function navigate(url: string) {
    router.push(url);
    onClose?.();
  }

  const hasFilters =
    currentCategory || currentMinPrice || currentMaxPrice || currentInStock;

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3
          className="font-semibold text-sm tracking-wide uppercase text-muted-foreground"
        >
          Filters
        </h3>
        {hasFilters && (
          <button
            onClick={() => navigate("/products")}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
          >
            <X className="h-3 w-3" />
            Clear
          </button>
        )}
      </div>

      {/* Categories */}
      <div>
        <p className="text-sm font-semibold mb-3 text-foreground">Category</p>
        <div className="space-y-1">
          <button
            onClick={() =>
              navigate(buildUrl({ category: undefined }))
            }
            className={cn(
              "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
              !currentCategory
                ? "bg-[var(--emerald)]/10 text-[var(--emerald)] font-medium"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <span>All Categories</span>
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() =>
                navigate(buildUrl({ category: cat.slug }))
              }
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
                currentCategory === cat.slug
                  ? "bg-[var(--emerald)]/10 text-[var(--emerald)] font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <span>{cat.name}</span>
              <span className="text-xs opacity-60">{cat._count.products}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Price range */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          navigate(
            buildUrl({
              minPrice: (fd.get("minPrice") as string) || undefined,
              maxPrice: (fd.get("maxPrice") as string) || undefined,
            })
          );
        }}
      >
        <p className="text-sm font-semibold mb-3 text-foreground">Price Range</p>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              $
            </span>
            <input
              type="number"
              name="minPrice"
              defaultValue={currentMinPrice ?? ""}
              placeholder="Min"
              min={0}
              className="w-full rounded-lg border border-border bg-background pl-5 pr-2 py-2 text-sm outline-none focus:border-[var(--emerald)] focus:ring-2 focus:ring-[var(--emerald)]/20 transition-all"
            />
          </div>
          <span className="text-muted-foreground text-xs">–</span>
          <div className="relative flex-1">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              $
            </span>
            <input
              type="number"
              name="maxPrice"
              defaultValue={currentMaxPrice ?? ""}
              placeholder="Max"
              min={0}
              className="w-full rounded-lg border border-border bg-background pl-5 pr-2 py-2 text-sm outline-none focus:border-[var(--emerald)] focus:ring-2 focus:ring-[var(--emerald)]/20 transition-all"
            />
          </div>
        </div>
        <button
          type="submit"
          className="mt-2.5 w-full rounded-lg border border-border py-2 text-xs font-medium hover:bg-muted transition-colors"
        >
          Apply
        </button>
      </form>

      {/* In Stock */}
      <div>
        <p className="text-sm font-semibold mb-3 text-foreground">Availability</p>
        <label className="flex items-center gap-3 cursor-pointer group">
          <div className="relative">
            <input
              type="checkbox"
              checked={currentInStock ?? false}
              onChange={(e) =>
                navigate(
                  buildUrl({ inStock: e.target.checked ? "true" : undefined })
                )
              }
              className="sr-only peer"
            />
            <div className="h-5 w-5 rounded border border-border bg-background peer-checked:bg-[var(--emerald)] peer-checked:border-[var(--emerald)] transition-colors flex items-center justify-center">
              <svg
                className="h-3 w-3 text-white opacity-0 peer-checked:opacity-100 scale-0 peer-checked:scale-100 transition-all"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <span className="text-sm text-foreground group-hover:text-[var(--emerald)] transition-colors">
            In Stock Only
          </span>
        </label>
      </div>
    </div>
  );
}
