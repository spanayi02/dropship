"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/client";

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
  const { t } = useI18n();

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
        <h3 className="label-sign text-muted-foreground">{t("products.filters")}</h3>
        {hasFilters && (
          <button
            onClick={() => navigate("/products")}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
          >
            <X className="h-3 w-3" />
            {t("products.clearFilters")}
          </button>
        )}
      </div>

      {/* Categories */}
      <div>
        <p className="text-sm font-semibold mb-3 text-foreground">{t("products.category")}</p>
        <div className="space-y-1">
          <button
            onClick={() =>
              navigate(buildUrl({ category: undefined }))
            }
            className={cn(
              "flex w-full items-center justify-between rounded-[3px] px-3 py-2 text-sm transition-colors",
              !currentCategory
                ? "bg-signal/20 text-ink dark:text-signal font-medium"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <span>{t("products.allCategories")}</span>
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() =>
                navigate(buildUrl({ category: cat.slug }))
              }
              className={cn(
                "flex w-full items-center justify-between rounded-[3px] px-3 py-2 text-sm transition-colors",
                currentCategory === cat.slug
                  ? "bg-signal/20 text-ink dark:text-signal font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <span>{cat.name}</span>
              <span className="text-xs tnum opacity-60">{cat._count.products}</span>
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
        <p className="text-sm font-semibold mb-3 text-foreground">{t("products.price")}</p>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="number"
              name="minPrice"
              defaultValue={currentMinPrice ?? ""}
              placeholder={t("products.priceMin")}
              min={0}
              className="w-full rounded-[3px] border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ink focus:ring-1 focus:ring-ink/15 dark:focus:border-signal dark:focus:ring-signal/20 transition-all"
            />
          </div>
          <span className="text-muted-foreground text-xs">–</span>
          <div className="relative flex-1">
            <input
              type="number"
              name="maxPrice"
              defaultValue={currentMaxPrice ?? ""}
              placeholder={t("products.priceMax")}
              min={0}
              className="w-full rounded-[3px] border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ink focus:ring-1 focus:ring-ink/15 dark:focus:border-signal dark:focus:ring-signal/20 transition-all"
            />
          </div>
        </div>
        <button
          type="submit"
          className="mt-2.5 w-full rounded-[3px] border border-border py-2 text-xs font-semibold hover:bg-muted transition-colors"
        >
          {t("common.apply")}
        </button>
      </form>

      {/* In Stock */}
      <div>
        <p className="text-sm font-semibold mb-3 text-foreground">{t("products.availability")}</p>
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
            <div className="h-5 w-5 rounded-[2px] border border-border bg-background peer-checked:bg-signal peer-checked:border-signal transition-colors flex items-center justify-center">
              <svg
                className="h-3 w-3 text-signal-foreground opacity-0 peer-checked:opacity-100 scale-0 peer-checked:scale-100 transition-all"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <span className="text-sm text-foreground group-hover:text-ink dark:group-hover:text-signal transition-colors">
            {t("products.inStockOnly")}
          </span>
        </label>
      </div>
    </div>
  );
}
