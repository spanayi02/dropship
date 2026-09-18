import { Suspense } from "react";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/store-config";
import { getT } from "@/lib/i18n/server";
import type { TFunction } from "@/lib/i18n";
import { ProductCard, ProductCardSkeleton } from "@/components/store/product-card";
import { ProductFilters } from "@/components/store/product-filters";
import { ProductSort } from "@/components/store/product-sort";
import { MobileFiltersSheet } from "@/components/store/mobile-filters-sheet";
import { Pagination } from "@/components/store/pagination";
import { BadgePercent, PackageCheck, Search, ShieldCheck, Sparkles, Truck } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "The board | WishlistAZ",
  description: "Every listing here passed a supplier and price check before it went live. Filter by category, price, and rating.",
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

  // Price filter (params are in the store's major currency unit; DB uses minor units)
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
  t,
  total,
  page,
  pageSize,
}: {
  t: TFunction;
  total: number;
  page: number;
  pageSize: number;
}) {
  const start = Math.min((page - 1) * pageSize + 1, total);
  const end = Math.min(page * pageSize, total);
  if (total === 0) return <p className="text-sm text-muted-foreground">{t("products.noResults")}</p>;
  return (
    <p className="text-sm tnum text-muted-foreground">
      {t("products.showing", { start, end, total })}
    </p>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Search bar (URL-sync — uses standard form GET)
// ─────────────────────────────────────────────────────────────────────────────
function SearchBar({
  t,
  currentSearch,
  currentParams,
}: {
  t: TFunction;
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
          placeholder={t("common.searchPlaceholder")}
          className="w-full rounded-[3px] border border-border bg-background pl-10 pr-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:border-ink focus:ring-1 focus:ring-ink/15 dark:focus:border-signal dark:focus:ring-signal/20 transition-all"
        />
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────────────────────────────────────
function EmptyState({ t }: { t: TFunction }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
      <div className="h-16 w-16 rounded-[4px] bg-muted flex items-center justify-center">
        <Search className="h-7 w-7 text-muted-foreground" />
      </div>
      <div>
        <p className="font-board text-lg font-bold uppercase">{t("products.noResults")}</p>
        <p className="mt-1 text-sm text-muted-foreground max-w-xs">{t("products.noResultsText")}</p>
      </div>
      <Link
        href="/products"
        className="mt-2 inline-flex items-center gap-2 rounded-[3px] bg-signal px-5 py-2.5 text-sm font-bold text-signal-foreground hover:bg-signal-deep transition-colors"
      >
        {t("products.clearFilters")}
      </Link>
    </div>
  );
}

function CatalogHero({
  t,
  categories,
  freeShipAmount,
}: {
  t: TFunction;
  categories: Awaited<ReturnType<typeof fetchCategories>>;
  freeShipAmount: string;
}) {
  const featured = categories.slice(0, 5);

  return (
    <section className="mb-10 overflow-hidden rounded-[4px] border border-ink/10 bg-ink text-ink-foreground">
      <div className="grid lg:grid-cols-[1fr_0.72fr]">
        <div className="relative p-7 sm:p-10">
          <span className="label-sign mb-5 inline-flex items-center gap-2 rounded-[2px] bg-signal px-3 py-1 text-signal-foreground">
            <Sparkles className="h-3.5 w-3.5" />
            {t("home.boardTitle")}
          </span>
          <h1 className="font-board max-w-2xl text-3xl font-bold uppercase tracking-tight sm:text-5xl">
            {t("products.title")}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-ink-foreground/70 sm:text-base">
            {t("home.intro")}
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              href="/products?sort=best_selling"
              className="label-sign inline-flex items-center gap-2 rounded-[2px] bg-signal px-4 py-2 text-signal-foreground transition-transform hover:-translate-y-0.5"
            >
              {t("products.sortBestSelling")}
            </Link>
            <Link
              href="/products?sort=newest"
              className="label-sign inline-flex items-center gap-2 rounded-[2px] bg-ink-foreground/10 px-4 py-2 text-ink-foreground ring-1 ring-ink-foreground/15 transition-transform hover:-translate-y-0.5"
            >
              {t("products.sortNewest")}
            </Link>
            <Link
              href="/products?sort=price_asc"
              className="label-sign inline-flex items-center gap-2 rounded-[2px] bg-ink-foreground/10 px-4 py-2 text-ink-foreground ring-1 ring-ink-foreground/15 transition-transform hover:-translate-y-0.5"
            >
              {t("products.sortPriceAsc")}
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-px bg-ink-foreground/10 sm:grid-cols-4 lg:grid-cols-2">
          {[
            { icon: Truck, label: t("home.trustShipping", { amount: freeShipAmount }), text: t("home.trustShippingSub") },
            { icon: ShieldCheck, label: t("home.trustSecure"), text: t("home.trustSecureSub") },
            { icon: PackageCheck, label: t("home.trustReturns"), text: t("home.trustReturnsSub") },
            { icon: BadgePercent, label: t("home.featuredDeal"), text: t("checkout.vatNote") },
          ].map(({ icon: Icon, label, text }) => (
            <div key={label} className="bg-ink p-5">
              <Icon className="mb-4 h-5 w-5 text-signal" />
              <p className="text-sm font-bold text-ink-foreground">{label}</p>
              <p className="mt-1 text-xs text-ink-foreground/60">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {featured.length > 0 && (
        <div className="flex gap-2 overflow-x-auto border-t border-ink-foreground/10 p-4 scrollbar-none">
          {featured.map((category) => (
            <Link
              key={category.id}
              href={`/products?category=${category.slug}`}
              className="inline-flex flex-none items-center gap-2 rounded-[3px] border border-ink-foreground/15 bg-ink-foreground/5 px-4 py-2 text-sm font-bold text-ink-foreground transition-colors hover:border-signal/50 hover:bg-signal/15 hover:text-signal"
            >
              {category.name}
              <span className="tnum rounded-[2px] bg-ink-foreground/10 px-2 py-0.5 text-[11px] text-ink-foreground/70">
                {category._count.products}
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
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

  const [{ products, total, page, totalPages }, categories, { t, locale }] = await Promise.all([
    fetchProducts(params),
    fetchCategories(),
    getT(),
  ]);

  const currentParamsRecord: Record<string, string> = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined) as [string, string][]
  );
  const freeShipAmount = formatPrice(FREE_SHIPPING_THRESHOLD, undefined, locale === "el" ? "el-GR" : "en-IE");

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <CatalogHero t={t} categories={categories} freeShipAmount={freeShipAmount} />

      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-board text-2xl font-bold uppercase tracking-tight sm:text-3xl">
            {params.search ? t("products.titleSearch", { query: params.search }) : t("products.title")}
          </h2>
          {params.category && (
            <p className="mt-1 text-muted-foreground capitalize">
              {t("products.category")}: <span className="font-medium text-foreground">{params.category.replace(/-/g, " ")}</span>
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-8">
        {/* ── Desktop sidebar ───────────────────────────────────────────── */}
        <aside className="hidden lg:block w-60 flex-shrink-0">
          <Suspense fallback={<div className="h-96 rounded-[4px] bg-muted animate-pulse" />}>
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
              t={t}
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
            <ResultsCount t={t} total={total} page={page} pageSize={PAGE_SIZE} />
          </div>

          {/* Grid */}
          <Suspense fallback={<ProductGridSkeleton />}>
            {products.length === 0 ? (
              <EmptyState t={t} />
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
