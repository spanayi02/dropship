import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BadgePercent,
  BadgeCheck,
  Headphones,
  LayoutGrid,
  RotateCcw,
  ShieldCheck,
  Star,
  Truck,
} from "lucide-react";
import { db } from "@/lib/db";
import { cn, formatPrice } from "@/lib/utils";
import { getT } from "@/lib/i18n/server";
import { intlLocale, type TFunction, type TKey } from "@/lib/i18n";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/store-config";
import { HeroCarousel, type HeroSlide, type SlideTone } from "@/components/store/home/hero-carousel";
import { CollectionTabs } from "@/components/store/home/collection-tabs";
import { ProductRail } from "@/components/store/home/product-rail";
import { SubscribeForm } from "@/components/store/subscribe-form";

export const dynamic = "force-dynamic";

const FALLBACK_IMAGE = "/demo/products/wireless-noise-canceling-earbuds-pro-1.jpg";

/** "Shop by price" bands, in minor units. */
const PRICE_BANDS = [1500, 2500, 5000] as const;
const BUDGET_TILE_MAX = 2500;

const TINTS: Record<SlideTone, string> = {
  blue: "bg-tint-blue",
  sand: "bg-tint-sand",
  sage: "bg-tint-sage",
  rose: "bg-tint-rose",
  ink: "bg-tint-ink text-tint-ink-foreground",
};

// ─────────────────────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────────────────────

const withRatings = { reviews: { select: { rating: true } } } as const;

function average(reviews: { rating: number }[]) {
  return reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
}

function discountOf(p: { sellingPrice: number; compareAtPrice?: number | null }) {
  return p.compareAtPrice && p.compareAtPrice > p.sellingPrice
    ? Math.round(((p.compareAtPrice - p.sellingPrice) / p.compareAtPrice) * 100)
    : 0;
}

function categoryLabel(t: TFunction, slug: string, name: string) {
  const key = `categories.${slug}`;
  const label = t(key as TKey);
  return label === key ? name : label;
}

async function getLandingData() {
  const active = { isActive: true };
  const onSale = { ...active, compareAtPrice: { gt: db.product.fields.sellingPrice } };

  const [
    bestSellers,
    newest,
    deals,
    reviewed,
    categories,
    budgetPick,
    bandCounts,
    saleCount,
    reviewAgg,
    ratingGroups,
    reviews,
  ] = await Promise.all([
    db.product.findMany({
      where: active,
      include: withRatings,
      orderBy: { orderItems: { _count: "desc" } },
      take: 8,
    }),
    db.product.findMany({
      where: active,
      include: withRatings,
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    db.product.findMany({
      where: onSale,
      include: withRatings,
      orderBy: { updatedAt: "desc" },
      take: 12,
    }),
    db.product.findMany({
      where: { ...active, reviews: { some: {} } },
      include: withRatings,
      take: 40,
    }),
    db.category.findMany({
      include: {
        _count: { select: { products: { where: active } } },
        products: {
          where: { ...active, images: { isEmpty: false } },
          select: { images: true },
          orderBy: { orderItems: { _count: "desc" } },
          take: 1,
        },
      },
      orderBy: { name: "asc" },
    }),
    db.product.findFirst({
      where: { ...active, sellingPrice: { lte: BUDGET_TILE_MAX }, images: { isEmpty: false } },
      orderBy: { orderItems: { _count: "desc" } },
      select: { images: true, title: true },
    }),
    Promise.all(
      PRICE_BANDS.map((max) => db.product.count({ where: { ...active, sellingPrice: { lte: max } } }))
    ),
    db.product.count({ where: onSale }),
    db.review.aggregate({ _avg: { rating: true }, _count: { rating: true } }),
    db.review.groupBy({ by: ["rating"], _count: { rating: true } }),
    db.review.findMany({
      where: { rating: { gte: 4 }, comment: { not: null } },
      orderBy: [{ isVerified: "desc" }, { createdAt: "desc" }],
      take: 10,
      include: {
        user: { select: { name: true } },
        product: { select: { title: true, slug: true, images: true } },
      },
    }),
  ]);

  const topRated = reviewed
    .map((p) => ({ p, score: average(p.reviews), n: p.reviews.length }))
    .sort((a, b) => b.score - a.score || b.n - a.n)
    .slice(0, 8)
    .map(({ p }) => p);

  const sortedDeals = [...deals].sort((a, b) => discountOf(b) - discountOf(a));

  return {
    bestSellers,
    newest,
    deals: sortedDeals,
    topRated,
    categories,
    budgetPick,
    bandCounts,
    saleCount,
    avgRating: reviewAgg._avg.rating ?? 0,
    reviewCount: reviewAgg._count.rating,
    ratingGroups,
    reviews,
  };
}

type LandingData = Awaited<ReturnType<typeof getLandingData>>;

// ─────────────────────────────────────────────────────────────────────────────
// Hero: campaign slider + two promo tiles
// ─────────────────────────────────────────────────────────────────────────────

function buildSlides(data: LandingData, t: TFunction, intl: string): HeroSlide[] {
  const slides: HeroSlide[] = [];
  const used = new Set<string>();
  const imageOf = (p?: { images: string[] }) => p?.images[0] ?? FALLBACK_IMAGE;

  const topDeal = data.deals[0];
  if (topDeal?.compareAtPrice) {
    const maxDiscount = discountOf(topDeal);
    used.add(topDeal.id);
    slides.push({
      id: "deals",
      eyebrow: t("landing.dealsEyebrow"),
      title: t("landing.dealsTitle", { percent: maxDiscount }),
      text: t("landing.dealsText"),
      cta: t("landing.dealsCta"),
      href: "/products?sale=true",
      image: imageOf(topDeal),
      imageAlt: topDeal.title,
      tone: "rose",
      priceNow: formatPrice(topDeal.sellingPrice, undefined, intl),
      priceWas: formatPrice(topDeal.compareAtPrice, undefined, intl),
    });
  }

  const fresh = data.newest.find((p) => !used.has(p.id) && p.images.length > 0);
  if (fresh) {
    used.add(fresh.id);
    slides.push({
      id: "new",
      eyebrow: t("landing.newEyebrow"),
      title: t("landing.newTitle"),
      text: t("landing.newText"),
      cta: t("landing.newCta"),
      href: "/products?sort=newest",
      image: imageOf(fresh),
      imageAlt: fresh.title,
      tone: "blue",
      priceNow: formatPrice(fresh.sellingPrice, undefined, intl),
    });
  }

  const spotlight = [...data.categories].sort((a, b) => b._count.products - a._count.products)[0];
  if (spotlight && spotlight._count.products > 0) {
    slides.push({
      id: "category",
      eyebrow: t("landing.categoryEyebrow"),
      title: categoryLabel(t, spotlight.slug, spotlight.name),
      text: t("landing.categoryText", { count: spotlight._count.products }),
      cta: t("landing.categoryCta"),
      href: `/products?category=${spotlight.slug}`,
      image: spotlight.products[0]?.images[0] ?? spotlight.image ?? FALLBACK_IMAGE,
      imageAlt: spotlight.name,
      tone: "sage",
    });
  }

  if (slides.length === 0) {
    slides.push({
      id: "fallback",
      eyebrow: t("common.storeName"),
      title: t("landing.fallbackTitle"),
      text: t("landing.fallbackText"),
      cta: t("landing.fallbackCta"),
      href: "/products",
      image: FALLBACK_IMAGE,
      imageAlt: "",
      tone: "sand",
    });
  }

  return slides;
}

function PromoTile({
  href,
  title,
  text,
  cta,
  image,
  imageAlt,
  tone,
}: {
  href: string;
  title: string;
  text: string;
  cta: string;
  image: string;
  imageAlt: string;
  tone: SlideTone;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex min-h-[168px] overflow-hidden rounded-2xl p-5 sm:p-6 lg:min-h-0",
        TINTS[tone]
      )}
    >
      <div className="relative z-10 flex flex-col pr-36 lg:pr-44">
        <h3 className="text-xl leading-tight sm:text-2xl">{title}</h3>
        <p
          className={cn(
            "mt-1.5 text-sm",
            tone === "ink" ? "text-tint-ink-foreground/70" : "text-muted-foreground"
          )}
        >
          {text}
        </p>
        <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-semibold">
          {cta}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
      <div className="absolute bottom-5 right-5 h-32 w-32 overflow-hidden rounded-xl bg-background shadow-[0_16px_32px_-16px_rgb(0_0_0/0.3)] lg:bottom-6 lg:right-6 lg:h-40 lg:w-40">
        <Image
          src={image}
          alt={imageAlt}
          fill
          sizes="160px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
    </Link>
  );
}

function Hero({ data, t, intl }: { data: LandingData; t: TFunction; intl: string }) {
  const slides = buildSlides(data, t, intl);
  const best = data.bestSellers.find((p) => p.images.length > 0);

  return (
    <section className="container-store pt-4 sm:pt-6">
      <div className="grid gap-4 lg:h-[480px] lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="h-[560px] sm:h-[420px] lg:h-full">
          <HeroCarousel slides={slides} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 lg:grid-rows-2">
          {best && (
            <PromoTile
              href="/products?sort=best_selling"
              title={t("landing.tileBestTitle")}
              text={t("landing.tileBestText")}
              cta={t("landing.shopNow")}
              image={best.images[0]}
              imageAlt={best.title}
              tone="sand"
            />
          )}
          {data.budgetPick && (
            <PromoTile
              href={`/products?maxPrice=${BUDGET_TILE_MAX / 100}&sort=price_asc`}
              title={t("landing.tileBudgetTitle", {
                price: formatPrice(BUDGET_TILE_MAX, undefined, intl).replace(/[.,]00(?=\D*$)/, ""),
              })}
              text={t("landing.tileBudgetText")}
              cta={t("landing.shopNow")}
              image={data.budgetPick.images[0]}
              imageAlt={data.budgetPick.title}
              tone="ink"
            />
          )}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Service strip
// ─────────────────────────────────────────────────────────────────────────────

function ServiceStrip({ t, intl }: { t: TFunction; intl: string }) {
  const items = [
    {
      icon: Truck,
      title: t("home.trustShipping", { amount: formatPrice(FREE_SHIPPING_THRESHOLD, undefined, intl) }),
      text: t("home.trustShippingSub"),
    },
    { icon: RotateCcw, title: t("home.trustReturns"), text: t("home.trustReturnsSub") },
    { icon: ShieldCheck, title: t("home.trustSecure"), text: t("home.trustSecureSub") },
    { icon: Headphones, title: t("home.trustSupport"), text: t("home.trustSupportSub") },
  ];

  return (
    <section className="container-store pt-4 sm:pt-6">
      <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline lg:grid-cols-4">
        {items.map((item) => (
          <li key={item.title} className="flex items-center gap-3 bg-background px-4 py-4 sm:px-5">
            <item.icon className="h-5 w-5 flex-none text-foreground" strokeWidth={1.75} />
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-snug">{item.title}</p>
              <p className="hidden text-xs text-muted-foreground sm:block">{item.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section header
// ─────────────────────────────────────────────────────────────────────────────

function SectionHead({
  title,
  text,
  href,
  linkLabel,
}: {
  title: string;
  text?: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4 sm:mb-8">
      <div>
        <h2 className="text-2xl sm:text-3xl">{title}</h2>
        {text && <p className="mt-1.5 text-sm text-muted-foreground sm:text-base">{text}</p>}
      </div>
      {href && linkLabel && (
        <Link
          href={href}
          className="inline-flex flex-none items-center gap-1 text-sm font-semibold underline-offset-4 hover:underline"
        >
          {linkLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Category circles
// ─────────────────────────────────────────────────────────────────────────────

function CategoryCircles({ data, t }: { data: LandingData; t: TFunction }) {
  const categories = data.categories.filter((c) => c._count.products > 0);
  if (categories.length === 0) return null;

  const circle =
    "relative mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-full ring-1 ring-hairline transition-all duration-300 group-hover:ring-2 group-hover:ring-foreground sm:h-28 sm:w-28";

  return (
    <section className="container-store py-12 sm:py-16">
      <SectionHead
        title={t("landing.categoriesTitle")}
        href="/products"
        linkLabel={t("common.viewAll")}
      />
      <ul className="scrollbar-none -mx-4 flex gap-4 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-[repeat(auto-fit,minmax(120px,1fr))] sm:gap-6 sm:px-0">
        {categories.map((cat) => {
          const label = categoryLabel(t, cat.slug, cat.name);
          return (
            <li key={cat.id} className="w-20 flex-none sm:w-auto">
              <Link href={`/products?category=${cat.slug}`} className="group block text-center">
                <span className={cn(circle, "bg-canvas-soft")}>
                  <Image
                    src={cat.products[0]?.images[0] ?? cat.image ?? FALLBACK_IMAGE}
                    alt=""
                    fill
                    sizes="112px"
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </span>
                <span className="mt-3 block text-xs font-medium leading-snug sm:text-sm">{label}</span>
              </Link>
            </li>
          );
        })}
        {data.saleCount > 0 && (
          <li className="w-20 flex-none sm:w-auto">
            <Link href="/products?sale=true" className="group block text-center">
              <span className={cn(circle, "bg-sale-soft text-sale")}>
                <BadgePercent className="h-8 w-8 sm:h-10 sm:w-10" strokeWidth={1.5} />
              </span>
              <span className="mt-3 block text-xs font-medium leading-snug text-sale sm:text-sm">
                {t("landing.deals")}
              </span>
            </Link>
          </li>
        )}
        <li className="w-20 flex-none sm:w-auto">
          <Link href="/products" className="group block text-center">
            <span className={cn(circle, "bg-muted")}>
              <LayoutGrid className="h-8 w-8 sm:h-10 sm:w-10" strokeWidth={1.5} />
            </span>
            <span className="mt-3 block text-xs font-medium leading-snug sm:text-sm">
              {t("landing.allProducts")}
            </span>
          </Link>
        </li>
      </ul>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Deals band
// ─────────────────────────────────────────────────────────────────────────────

function DealsBand({ data, t }: { data: LandingData; t: TFunction }) {
  if (data.deals.length === 0) return null;
  const maxDiscount = discountOf(data.deals[0]);

  return (
    <section className="bg-tint-rose py-12 sm:py-16">
      <div className="container-store">
        <div className="mb-6 flex items-end justify-between gap-4 sm:mb-8">
          <div>
            <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-sale px-3 py-1 text-xs font-semibold text-white">
              <BadgePercent className="h-3.5 w-3.5" />
              {t("landing.dealsTitle", { percent: maxDiscount })}
            </span>
            <h2 className="text-2xl sm:text-3xl">{t("landing.dealsRowTitle")}</h2>
            <p className="mt-1.5 text-sm text-muted-foreground sm:text-base">
              {t("landing.dealsRowText")}
            </p>
          </div>
          <Link
            href="/products?sale=true"
            className="inline-flex flex-none items-center gap-1 text-sm font-semibold underline-offset-4 hover:underline"
          >
            {t("common.viewAll")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <ProductRail products={data.deals} />
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Editorial category banners
// ─────────────────────────────────────────────────────────────────────────────

function CategoryBanners({ data, t }: { data: LandingData; t: TFunction }) {
  const picks = [...data.categories]
    .filter((c) => c._count.products > 0)
    .sort((a, b) => b._count.products - a._count.products)
    .slice(1, 3);
  if (picks.length < 2) return null;

  return (
    <section className="container-store py-12 sm:py-16">
      <div className="grid gap-4 md:grid-cols-2">
        {picks.map((cat) => (
          <Link
            key={cat.id}
            href={`/products?category=${cat.slug}`}
            className="group relative block aspect-[4/3] overflow-hidden rounded-2xl bg-muted sm:aspect-[16/10]"
          >
            <Image
              src={cat.products[0]?.images[0] ?? cat.image ?? FALLBACK_IMAGE}
              alt=""
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-6 text-white sm:p-8">
              <div>
                <p className="text-sm text-white/80">
                  {t("landing.priceCount", { count: cat._count.products })}
                </p>
                <h3 className="mt-1 text-2xl text-white sm:text-3xl">
                  {categoryLabel(t, cat.slug, cat.name)}
                </h3>
              </div>
              <span className="inline-flex h-11 w-11 flex-none items-center justify-center gap-2 rounded-full bg-white text-sm font-semibold text-black transition-transform group-hover:translate-x-0.5 sm:w-auto sm:px-5">
                <span className="hidden sm:inline">{t("landing.spotlightCta")}</span>
                <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shop by price
// ─────────────────────────────────────────────────────────────────────────────

function ShopByPrice({ data, t, intl }: { data: LandingData; t: TFunction; intl: string }) {
  const whole = (cents: number) =>
    formatPrice(cents, undefined, intl).replace(/[.,]00(?=\D*$)/, "");
  const tones: SlideTone[] = ["blue", "sand", "sage"];

  const tiles = [
    ...PRICE_BANDS.map((max, i) => ({
      key: `under-${max}`,
      href: `/products?maxPrice=${max / 100}&sort=price_asc`,
      title: t("landing.priceUnder", { price: whole(max) }),
      count: data.bandCounts[i],
      className: TINTS[tones[i]],
      muted: "text-muted-foreground",
    })),
    {
      key: "sale",
      href: "/products?sale=true",
      title: t("landing.priceDeals"),
      count: data.saleCount,
      className: "bg-sale text-white",
      muted: "text-white/80",
    },
  ].filter((tile) => tile.count > 0);

  if (tiles.length === 0) return null;

  return (
    <section className="container-store pb-12 sm:pb-16">
      <SectionHead title={t("landing.priceTitle")} />
      <div
        className={cn(
          "grid grid-cols-2 gap-3 sm:gap-4",
          tiles.length === 4 ? "lg:grid-cols-4" : tiles.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2"
        )}
      >
        {tiles.map((tile) => (
          <Link
            key={tile.key}
            href={tile.href}
            className={cn(
              "group flex min-h-[132px] flex-col justify-between rounded-2xl p-5 transition-transform hover:-translate-y-0.5 sm:min-h-[160px] sm:p-6",
              "[&:last-child:nth-child(odd)]:col-span-2 lg:[&:last-child:nth-child(odd)]:col-span-1",
              tile.className
            )}
          >
            <p className="font-display text-xl font-semibold leading-tight sm:text-3xl">{tile.title}</p>
            <p className={cn("flex items-center justify-between text-sm", tile.muted)}>
              {t("landing.priceCount", { count: tile.count })}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Reviews: rating summary + review cards
// ─────────────────────────────────────────────────────────────────────────────

function Stars({ rating, className }: { rating: number; className?: string }) {
  return (
    <div className={cn("flex items-center gap-0.5", className)} aria-label={`${rating.toFixed(1)} / 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "h-4 w-4",
            i < Math.round(rating) ? "fill-warning text-warning" : "fill-muted text-muted-foreground/25"
          )}
        />
      ))}
    </div>
  );
}

function ReviewsBlock({ data, t, intl }: { data: LandingData; t: TFunction; intl: string }) {
  if (data.reviewCount === 0 || data.reviews.length === 0) return null;

  const byStars = new Map(data.ratingGroups.map((g) => [g.rating, g._count.rating]));
  const score = data.avgRating.toLocaleString(intl, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

  return (
    <section className="border-t border-hairline bg-canvas-soft py-12 sm:py-16">
      <div className="container-store">
        <SectionHead title={t("landing.reviewsTitle")} />
        <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-8">
          {/* Summary */}
          <div className="rounded-2xl bg-background p-6 ring-1 ring-hairline">
            <p className="font-display text-5xl font-semibold tabular-nums">{score}</p>
            <Stars rating={data.avgRating} className="mt-2" />
            <p className="mt-2 text-sm text-muted-foreground">
              {t("landing.reviewsBased", { count: data.reviewCount })}
            </p>
            <ul className="mt-6 space-y-2">
              {[5, 4, 3, 2, 1].map((n) => {
                const c = byStars.get(n) ?? 0;
                const pct = data.reviewCount ? (c / data.reviewCount) * 100 : 0;
                return (
                  <li key={n} className="flex items-center gap-3 text-xs">
                    <span className="w-3 tabular-nums text-muted-foreground" aria-label={t("landing.reviewsStars", { n })}>
                      {n}
                    </span>
                    <Star className="h-3 w-3 fill-warning text-warning" aria-hidden="true" />
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <span className="block h-full rounded-full bg-foreground" style={{ width: `${pct}%` }} />
                    </span>
                    <span className="w-6 text-right tabular-nums text-muted-foreground">{c}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Cards */}
          <ul className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-2 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:scroll-px-0 lg:px-0">
            {data.reviews.map((r) => (
              <li
                key={r.id}
                className="flex w-[82%] flex-none snap-start flex-col rounded-2xl bg-background p-5 ring-1 ring-hairline sm:w-[320px]"
              >
                <Stars rating={r.rating} />
                {r.title && <p className="mt-3 font-semibold leading-snug">{r.title}</p>}
                {r.comment && (
                  <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-muted-foreground">
                    {r.comment}
                  </p>
                )}
                <p className="mb-4 mt-4 flex items-center gap-1.5 text-sm font-medium">
                  {r.user.name ?? t("landing.customer")}
                  {r.isVerified && (
                    <span className="inline-flex items-center gap-1 text-xs font-normal text-success">
                      <BadgeCheck className="h-3.5 w-3.5" />
                      {t("home.verified")}
                    </span>
                  )}
                </p>
                <Link
                  href={`/products/${r.product.slug}`}
                  className="mt-auto flex items-center gap-3 border-t border-hairline pt-4 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <span className="relative h-10 w-10 flex-none overflow-hidden rounded-lg bg-muted">
                    {r.product.images[0] && (
                      <Image src={r.product.images[0]} alt="" fill sizes="40px" className="object-cover" />
                    )}
                  </span>
                  <span className="line-clamp-1">{r.product.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Newsletter
// ─────────────────────────────────────────────────────────────────────────────

function Newsletter({ t }: { t: TFunction }) {
  return (
    <section className="bg-tint-ink text-tint-ink-foreground">
      <div className="container-store grid items-center gap-8 py-14 sm:py-16 lg:grid-cols-2 lg:gap-16">
        <div>
          <h2 className="text-3xl text-tint-ink-foreground sm:text-4xl">{t("home.newsletterTitle")}</h2>
          <p className="mt-3 max-w-md text-tint-ink-foreground/70">{t("home.newsletterText")}</p>
        </div>
        <div>
          <SubscribeForm />
          <p className="mt-3 text-xs text-tint-ink-foreground/60">{t("home.newsletterLegal")}</p>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const [{ t, locale }, data] = await Promise.all([getT(), getLandingData()]);
  const intl = intlLocale(locale);

  const tabs = [
    { id: "best", label: t("landing.tabBest"), href: "/products?sort=best_selling", products: data.bestSellers },
    { id: "new", label: t("landing.tabNew"), href: "/products?sort=newest", products: data.newest },
    { id: "rated", label: t("landing.tabRated"), href: "/products?sort=rating", products: data.topRated },
  ];

  return (
    <div>
      <Hero data={data} t={t} intl={intl} />
      <ServiceStrip t={t} intl={intl} />
      <CategoryCircles data={data} t={t} />

      <section className="container-store pb-12 sm:pb-16">
        <CollectionTabs
          title={t("landing.collectionTitle")}
          tabs={tabs}
          viewAllLabel={t("common.viewAll")}
        />
      </section>

      <DealsBand data={data} t={t} />
      <CategoryBanners data={data} t={t} />
      <ShopByPrice data={data} t={t} intl={intl} />
      <ReviewsBlock data={data} t={t} intl={intl} />
      <Newsletter t={t} />
    </div>
  );
}
