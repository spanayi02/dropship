"use client";

import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";

const SORT_OPTIONS = [
  { value: "", label: "Default" },
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
  { value: "best_selling", label: "Best Selling" },
  { value: "rating", label: "Top Rated" },
];

interface ProductSortProps {
  currentSort?: string;
  currentParams: Record<string, string>;
}

export function ProductSort({ currentSort, currentParams }: ProductSortProps) {
  const router = useRouter();

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
        aria-label="Sort products"
        className="appearance-none rounded-xl border border-border bg-background pr-8 pl-4 py-2.5 text-sm font-medium outline-none focus:border-[var(--emerald)] focus:ring-2 focus:ring-[var(--emerald)]/20 transition-all cursor-pointer hover:bg-muted"
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
