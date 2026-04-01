"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  currentParams: Record<string, string>;
}

function buildPageUrl(page: number, params: Record<string, string>) {
  const next = { ...params, page: page === 1 ? undefined : String(page) };
  if (page === 1) delete next.page;
  const qs = new URLSearchParams(
    Object.fromEntries(
      Object.entries(next).filter(([, v]) => v !== undefined) as [string, string][]
    )
  ).toString();
  return `/products${qs ? `?${qs}` : ""}`;
}

function getPageRange(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | "ellipsis")[] = [1];

  if (current <= 4) {
    pages.push(2, 3, 4, 5, "ellipsis", total);
  } else if (current >= total - 3) {
    pages.push("ellipsis", total - 4, total - 3, total - 2, total - 1, total);
  } else {
    pages.push("ellipsis", current - 1, current, current + 1, "ellipsis", total);
  }

  return pages;
}

export function Pagination({ currentPage, totalPages, currentParams }: PaginationProps) {
  const pages = getPageRange(currentPage, totalPages);

  const prevHref = currentPage > 1 ? buildPageUrl(currentPage - 1, currentParams) : null;
  const nextHref = currentPage < totalPages ? buildPageUrl(currentPage + 1, currentParams) : null;

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1.5 flex-wrap">
      {/* Prev */}
      {prevHref ? (
        <Link
          href={prevHref}
          className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
          Prev
        </Link>
      ) : (
        <span className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium opacity-40 cursor-not-allowed">
          <ChevronLeft className="h-4 w-4" />
          Prev
        </span>
      )}

      {/* Page numbers */}
      {pages.map((page, i) =>
        page === "ellipsis" ? (
          <span
            key={`ellipsis-${i}`}
            className="flex h-9 w-9 items-center justify-center text-muted-foreground"
          >
            <MoreHorizontal className="h-4 w-4" />
          </span>
        ) : (
          <Link
            key={page}
            href={buildPageUrl(page, currentParams)}
            aria-label={`Page ${page}`}
            aria-current={page === currentPage ? "page" : undefined}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-xl border text-sm font-medium transition-colors",
              page === currentPage
                ? "bg-[var(--emerald)] border-[var(--emerald)] text-white shadow-sm shadow-[var(--emerald)]/30"
                : "border-border bg-background hover:bg-muted"
            )}
          >
            {page}
          </Link>
        )
      )}

      {/* Next */}
      {nextHref ? (
        <Link
          href={nextHref}
          className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
          aria-label="Next page"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <span className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium opacity-40 cursor-not-allowed">
          Next
          <ChevronRight className="h-4 w-4" />
        </span>
      )}
    </nav>
  );
}
