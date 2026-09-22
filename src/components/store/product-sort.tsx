"use client";

import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";

interface ProductSortProps {
  currentSort?: string;
  currentParams: Record<string, string>;
}

export function ProductSort({ currentSort, currentParams }: ProductSortProps) {
  const router = useRouter();
  const { t } = useI18n();

  const SORT_OPTIONS = [
    { value: "", label: t("products.sortDefault") },
    { value: "newest", label: t("products.sortNewest") },
    { value: "price_asc", label: t("products.sortPriceAsc") },
    { value: "price_desc", label: t("products.sortPriceDesc") },
    { value: "best_selling", label: t("products.sortBestSelling") },
    { value: "rating", label: t("products.sortRating") },
  ];

  function handleChange(value: string) {
    const next: Record<string, string | undefined> = { ...currentParams, sort: value || undefined };
    if (!value) delete next.sort;
    delete next.page;
    const qs = new URLSearchParams(
      Object.fromEntries(
        Object.entries(next).filter(([, v]) => v !== undefined) as [string, string][]
      )
    ).toString();
    router.push(`/products${qs ? `?${qs}` : ""}`);
  }

  return (
    <div className="relative flex-shrink-0">
      <select
        value={currentSort ?? ""}
        onChange={(e) => handleChange(e.target.value)}
        aria-label={t("products.sort")}
        className="appearance-none rounded-lg border border-border bg-background pr-8 pl-4 py-2.5 text-sm font-medium outline-none focus:border-ink focus:ring-1 focus:ring-ink/15 dark:focus:border-brand dark:focus:ring-brand/25 transition-all cursor-pointer hover:bg-muted"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
    </div>
  );
}
