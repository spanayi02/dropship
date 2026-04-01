import { Suspense } from "react";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { ProductCard, ProductCardSkeleton } from "@/components/store/product-card";
import { ProductFilters } from "@/components/store/product-filters";
import { ProductSort } from "@/components/store/product-sort";
import { MobileFiltersSheet } from "@/components/store/mobile-filters-sheet";
import { Pagination } from "@/components/store/pagination";
import { SlidersHorizontal, Search } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Products | DropShip",
  description: "Browse our full catalog of top-quality products.",
};

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface PageProps {
  searchParams: Promise<{
    category?: string;
    minPrice?: string;
    maxPrice?: string;
    inStock?: string;
    sort?: string;
    search?: string;
    page?: string;
  }>;
}

type SortOption =
  | "price_asc"
  | "price_desc"
  | "newest"
  | "best_selling"
  | "rating"
  | undefined;

const PAGE_SIZE = 16;

// ─────────────────────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────────────────────
async function fetchProducts(params: Awaited<PageProps["searchParams"]>) {
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const skip = (page - 1) * PAGE_SIZE;

  // Price filter (params are in dollars; DB uses cents)
  const minCents = params.minPrice ? Math.round(parseFloat(params.minPrice) * 100) : undefined;
  const maxCents = params.maxPrice ? Math.round(parseFloat(params.maxPrice) * 100) : undefined;

  // Category filter: look up by slug
  let categoryId: string | undefined;
  if (params.category) {
    const cat = await db.category.findUnique({ where: { slug: params.category } });
    categoryId = cat?.id;
  }

  const where = {
    isActive: true,
    ...(categoryId ? { categoryId } : {}),
    ...(params.inStock === "true" ? { suppliers: { some: { inStock: true } } } : {}),
    ...(params.search
      ? {
          title: {
            contains: params.search,
            mode: "insensitive" as const,
          },
        }
      : {}),
    ...((minCents !== undefined || maxCents !== undefined)
      ? {
          sellingPrice: {
            ...(minCents !== undefined ? { gte: minCents } : {}),
            ...(maxCents !== undefined ? { lte: maxCents } : {}),
          },
        }
      : {}),
  };

  const sort = params.sort as SortOption;

  const orderBy = (() => {
    switch (sort) {
      case "price_asc":
        return { sellingPrice: "asc" as const };
      case "price_desc":
        return { sellingPrice: "desc" as const };
      case "newest":
        return { createdAt: "desc" as const };
      case "best_selling":
        return { orderItems: { _count: "desc" as const } };
      default:
        return { createdAt: "desc" as const };
    }
  })();

  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      include: {
        reviews: { select: { rating: true } },
      },
      orderBy,
      skip,
      take: PAGE_SIZE,
    }),
    db.product.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  return { products, total, page, totalPages };
}

async function fetchCategories() {
  return db.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Results count
// ─────────────────────────────────────────────────────────────────────────────
function ResultsCount({
  total,
  page,
  pageSize,
}: {
  total: number;
  page: number;
  pageSize: number;
}) {
  const start = Math.min((page - 1) * pageSize + 1, total);
  const end = Math.min(page * pageSize, total);
  if (total === 0) return <p className="text-sm text-muted-foreground">No products found.</p>;
  return (
    <p className="text-sm text-muted-foreground">
      Showing <span className="font-medium text-foreground">{start}–{end}</span> of{" "}
      <span className="font-medium text-foreground">{total}</span> products
    </p>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Search bar (URL-sync — uses standard form GET)
// ─────────────────────────────────────────────────────────────────────────────
function SearchBar({
  currentSearch,
  currentParams,
}: {
  currentSearch?: string;
  currentParams: Record<string, string>;
}) {
  // Build hidden inputs for all current params except search/page
  const preserved = Object.entries(currentParams).filter(
    ([k]) => k !== "search" && k !== "page"
  );
  return (
    <form method="GET" className="relative flex-1">
      {preserved.map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <div className="relative flex items-center">
        <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="search"
          name="search"
          defaultValue={currentSearch ?? ""}
          placeholder="Search products…"
          className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:border-[var(--emerald)] focus:ring-2 focus:ring-[var(--emerald)]/20 transition-all"
        />
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
        <Search className="h-7 w-7 text-muted-foreground" />
      </div>
      <div>
        <p
          className="text-lg font-semibold"
          style={{ fontFamily: "var(--font-heading), system-ui, sans-serif" }}
        >
          No products found
        </p>
        <p className="mt-1 text-sm text-muted-foreground max-w-xs">
          Try adjusting your filters or search query.
        </p>
      </div>
      <Link
        href="/products"
        className="mt-2 inline-flex items-center gap-2 rounded-xl bg-[var(--emerald)] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
      >
        Clear all filters
      </Link>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Product grid skeleton
// ─────────────────────────────────────────────────────────────────────────────
function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
      {Array.from({ length: PAGE_SIZE }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────
export default async function ProductsPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const [{ products, total, page, totalPages }, categories] = await Promise.all([
    fetchProducts(params),
    fetchCategories(),
  ]);

  const currentParamsRecord: Record<string, string> = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined) as [string, string][]
  );

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Page heading */}
      <div className="mb-8">
        <h1
          className="text-3xl sm:text-4xl font-bold tracking-tight"
          style={{ fontFamily: "var(--font-heading), system-ui, sans-serif" }}
        >
          {params.search ? `Results for "${params.search}"` : "All Products"}
        </h1>
        {params.category && (
          <p className="mt-1 text-muted-foreground capitalize">
            Browsing: <span className="font-medium text-foreground">{params.category.replace(/-/g, " ")}</span>
          </p>
        )}
      </div>

      <div className="flex gap-8">
        {/* ── Desktop sidebar ───────────────────────────────────────────── */}
        <aside className="hidden lg:block w-60 flex-shrink-0">
          <Suspense fallback={<div className="h-96 rounded-xl bg-muted animate-pulse" />}>
            <ProductFilters
              categories={categories}
              currentCategory={params.category}
              currentMinPrice={params.minPrice}
              currentMaxPrice={params.maxPrice}
              currentInStock={params.inStock === "true"}
              currentParams={currentParamsRecord}
            />
          </Suspense>
        </aside>

        {/* ── Main area ─────────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            {/* Mobile filter trigger */}
            <MobileFiltersSheet
              categories={categories}
              currentCategory={params.category}
              currentMinPrice={params.minPrice}
              currentMaxPrice={params.maxPrice}
              currentInStock={params.inStock === "true"}
              currentParams={currentParamsRecord}
            />

            {/* Search */}
            <SearchBar
              currentSearch={params.search}
              currentParams={currentParamsRecord}
            />

            {/* Sort */}
            <ProductSort
              currentSort={params.sort}
              currentParams={currentParamsRecord}
            />
          </div>

          {/* Results count */}
          <div className="mb-5">
            <ResultsCount total={total} page={page} pageSize={PAGE_SIZE} />
          </div>

          {/* Grid */}
          <Suspense fallback={<ProductGridSkeleton />}>
            {products.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </Suspense>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-10">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                currentParams={currentParamsRecord}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
