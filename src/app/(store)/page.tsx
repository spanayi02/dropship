import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Truck,
  ShieldCheck,
  RotateCcw,
  Headphones,
  BadgePercent,
  Star,
  Gift,
  PackageCheck,
  ShoppingBag,
} from "lucide-react";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import { getT } from "@/lib/i18n/server";
import type { TFunction } from "@/lib/i18n";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/store-config";
import { ProductCard, ProductCardSkeleton } from "@/components/store/product-card";
import { AnimatedHero } from "@/components/store/animated-hero";
import { FadeInSection } from "@/components/store/fade-in-section";
import { StaggerGrid, StaggerItem } from "@/components/store/stagger-grid";
import { Testimonials } from "@/components/store/testimonials";
import { SubscribeForm } from "@/components/store/subscribe-form";

export const dynamic = 'force-dynamic';

const CATEGORY_FALLBACK_IMAGE = "/demo/categories/electronics.jpg";
const PRODUCT_FALLBACK_IMAGE = "/demo/products/mechanical-keyboard-rgb-backlit-tkl-1.jpg";

// ─────────────────────────────────────────────────────────────────────────────
// Section header: rule, title, and an optional "view all" link
// ─────────────────────────────────────────────────────────────────────────────
function SectionHeader({
  title,
  subtitle,
  viewAllHref,
  viewAllLabel,
}: {
  title: string;
  subtitle?: string;
  viewAllHref: string;
  viewAllLabel: string;
}) {
  return (
    <div className="flex items-end justify-between mb-8 gap-4">
      <div>
        <span className="mb-2 inline-flex h-1 w-10 rounded-full bg-primary" aria-hidden="true" />
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          {title}
        </h2>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      <Link
        href={viewAllHref}
        className="flex flex-shrink-0 items-center gap-1 text-sm font-semibold text-foreground hover:underline transition-colors"
      >
        {viewAllLabel}
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Categories Grid — "Gates"
// ─────────────────────────────────────────────────────────────────────────────
async function CategoriesGrid() {
  const { t } = await getT();
  const categories = await db.category.findMany({
    include: {
      _count: { select: { products: true } },
    },
    orderBy: { name: "asc" },
    take: 5,
  });

  if (categories.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
      <SectionHeader
        title={t("home.gates")}
        subtitle={t("home.gatesSubtitle")}
        viewAllHref="/products"
        viewAllLabel={t("common.viewAll")}
      />
      <StaggerGrid className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {categories.map((cat, index) => (
          <StaggerItem key={cat.id}>
            <Link
              href={`/products?category=${cat.slug}`}
              className="group relative flex flex-col items-center overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-ink/40 hover:border-border-strong"
            >
              <div className="relative w-full aspect-square overflow-hidden bg-muted">
                <Image
                  src={cat.image ?? CATEGORY_FALLBACK_IMAGE}
                  alt={cat.name}
                  fill
                  sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
                <span className="label-sign absolute left-2 top-2 rounded-md bg-ink px-1.5 py-0.5 text-ink-foreground">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                <p className="text-sm font-bold leading-tight">{cat.name}</p>
                <span className="tnum inline-block mt-1 rounded-md bg-white/15 backdrop-blur-sm px-2 py-0.5 text-[10px] font-medium text-white/90">
                  {cat._count.products} {t("common.items")}
                </span>
              </div>
            </Link>
          </StaggerItem>
        ))}
      </StaggerGrid>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Featured Deal — "Price drop"
// ─────────────────────────────────────────────────────────────────────────────
async function FeaturedDeal() {
  const { t } = await getT();
  const saleProducts = await db.product.findMany({
    where: {
      isActive: true,
      compareAtPrice: { not: null },
    },
    include: {
      reviews: { select: { rating: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  const product = saleProducts.find(
    (item) => item.compareAtPrice != null && item.compareAtPrice > item.sellingPrice
  );

  if (!product || !product.compareAtPrice) return null;

  const image = product.images[0] ?? PRODUCT_FALLBACK_IMAGE;
  const discount = Math.round(
    ((product.compareAtPrice - product.sellingPrice) / product.compareAtPrice) * 100
  );
  const rating =
    product.reviews.length > 0
      ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
      : 4.8;

  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="grid overflow-hidden rounded-xl border border-border bg-card lg:grid-cols-[0.92fr_1.08fr]">
        <Link href={`/products/${product.slug}`} className="group relative min-h-[360px] overflow-hidden bg-muted">
          <Image
            src={image}
            alt={product.title}
            fill
            sizes="(min-width: 1024px) 45vw, 100vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
          <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4 text-white">
            <div>
              <p className="label-sign text-white/80">{t("home.featuredDeal")}</p>
              <p className="mt-1 max-w-sm text-2xl font-extrabold leading-tight">{product.title}</p>
            </div>
            <span className="label-sign rounded-md bg-stop px-3 py-1.5 text-white shadow-lg">
              {t("product.save", { percent: discount })}
            </span>
          </div>
        </Link>

        <div className="relative p-7 sm:p-10">
          <span className="mb-5 inline-flex items-center gap-2 rounded-md bg-muted px-3 py-1 label-sign text-muted-foreground">
            <Gift className="h-3.5 w-3.5" />
            {t("home.featuredDeal")}
          </span>
          <h2 className="max-w-xl text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t("home.featuredDealTitle")}
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
            {t("home.featuredDealText")}
          </p>

          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-secondary p-4">
              <PackageCheck className="mb-3 h-5 w-5 text-foreground" />
              <p className="label-sign text-muted-foreground">{t("home.priceNow")}</p>
              <p className="mt-1 text-xl font-extrabold tnum text-foreground">{formatPrice(product.sellingPrice)}</p>
            </div>
            <div className="rounded-lg bg-muted p-4">
              <BadgePercent className="mb-3 h-5 w-5 text-muted-foreground" />
              <p className="label-sign text-muted-foreground">{t("home.priceWas")}</p>
              <p className="mt-1 text-xl font-extrabold tnum text-foreground">{formatPrice(product.compareAtPrice)}</p>
            </div>
            <div className="rounded-lg bg-muted p-4">
              <Star className="mb-3 h-5 w-5 fill-warning text-warning" />
              <p className="label-sign text-muted-foreground">{t("home.rating")}</p>
              <p className="mt-1 text-xl font-extrabold tnum text-foreground">{rating.toFixed(1)} / 5</p>
            </div>
          </div>

          <Link
            href={`/products/${product.slug}`}
            className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-ink px-7 py-3.5 text-sm font-bold text-ink-foreground transition-all hover:-translate-y-0.5 dark:bg-primary dark:text-primary-foreground sm:w-auto"
          >
            {t("home.grabDeal")}
            <ShoppingBag className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Trending Now — "Now boarding", horizontal scroll carousel
// ─────────────────────────────────────────────────────────────────────────────
async function TrendingNow() {
  const { t } = await getT();
  const products = await db.product.findMany({
    where: { isActive: true },
    include: {
      reviews: { select: { rating: true } },
      _count: { select: { orderItems: true } },
    },
    orderBy: { orderItems: { _count: "desc" } },
    take: 8,
  });

  if (products.length === 0) return null;

  return (
    <section className="py-14 bg-muted/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title={t("home.nowBoarding")}
          subtitle={t("home.nowBoardingSubtitle")}
          viewAllHref="/products?sort=best_selling"
          viewAllLabel={t("common.viewAll")}
        />
      </div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-none -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          {products.map((product) => (
            <div
              key={product.id}
              className="flex-none w-56 sm:w-64 snap-start"
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// New Arrivals — "Just landed"
// ─────────────────────────────────────────────────────────────────────────────
async function NewArrivals() {
  const { t } = await getT();
  const products = await db.product.findMany({
    where: { isActive: true },
    include: {
      reviews: { select: { rating: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  if (products.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
      <SectionHeader
        title={t("home.justLanded")}
        subtitle={t("home.justLandedSubtitle")}
        viewAllHref="/products?sort=newest"
        viewAllLabel={t("common.viewAll")}
      />
      <StaggerGrid className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
        {products.map((product) => (
          <StaggerItem key={product.id}>
            <ProductCard product={product} />
          </StaggerItem>
        ))}
      </StaggerGrid>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Reviews — "From the arrivals hall", pulled from real reviews
// ─────────────────────────────────────────────────────────────────────────────
async function ReviewsSection() {
  const { t } = await getT();
  const reviews = await db.review.findMany({
    where: { rating: { gte: 4 }, comment: { not: null } },
    orderBy: [{ isVerified: "desc" }, { createdAt: "desc" }],
    take: 6,
    include: {
      user: { select: { name: true } },
      product: { select: { title: true, slug: true } },
    },
  });

  if (reviews.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
      <SectionHeader
        title={t("home.reviewsTitle")}
        subtitle={t("home.reviewsSubtitle")}
        viewAllHref="/products"
        viewAllLabel={t("common.viewAll")}
      />
      <Testimonials
        reviews={reviews.map((r) => ({
          id: r.id,
          rating: r.rating,
          title: r.title,
          comment: r.comment,
          isVerified: r.isVerified,
          authorName: r.user.name ?? "Verified buyer",
          productTitle: r.product.title,
          productSlug: r.product.slug,
        }))}
      />
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Trust Badges
// ─────────────────────────────────────────────────────────────────────────────
async function TrustBadges() {
  const { t, locale } = await getT();
  const freeShipAmount = formatPrice(FREE_SHIPPING_THRESHOLD, undefined, locale === "el" ? "el-GR" : "en-IE");

  const badges = [
    { icon: Truck, title: t("home.trustShipping", { amount: freeShipAmount }), subtitle: t("home.trustShippingSub") },
    { icon: ShieldCheck, title: t("home.trustSecure"), subtitle: t("home.trustSecureSub") },
    { icon: RotateCcw, title: t("home.trustReturns"), subtitle: t("home.trustReturnsSub") },
    { icon: Headphones, title: t("home.trustSupport"), subtitle: t("home.trustSupportSub") },
  ];

  return (
    <section className="border-y border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          {badges.map((badge) => (
            <div
              key={badge.title}
              className="flex flex-col sm:flex-row items-center sm:items-start gap-3 text-center sm:text-left"
            >
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-secondary">
                <badge.icon className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{badge.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{badge.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// How an order travels
// ─────────────────────────────────────────────────────────────────────────────
function orderSteps(t: TFunction) {
  return [
    { icon: ShoppingBag, title: t("home.how1Title"), text: t("home.how1Text") },
    { icon: PackageCheck, title: t("home.how2Title"), text: t("home.how2Text") },
    { icon: Truck, title: t("home.how3Title"), text: t("home.how3Text") },
    { icon: Star, title: t("home.how4Title"), text: t("home.how4Text") },
  ];
}

async function ConversionStrip() {
  const { t } = await getT();
  const steps = orderSteps(t);

  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="grid overflow-hidden rounded-xl border border-ink/10 bg-ink text-ink-foreground dark:border-border">
        <div className="p-8 sm:p-10 pb-0 sm:pb-0">
          <span className="label-sign mb-4 inline-flex items-center gap-2 rounded-md bg-secondary px-3 py-1 text-foreground">
            {t("home.boardTitle")}
          </span>
          <h2 className="max-w-xl text-3xl font-bold tracking-tight sm:text-4xl">
            {t("home.howTitle")}
          </h2>
        </div>
        <div className="grid gap-px bg-ink-foreground/10 p-px sm:grid-cols-2 lg:grid-cols-4 mt-8">
          {steps.map((stepItem, i) => (
            <div key={stepItem.title} className="bg-ink p-6">
              <div className="mb-5 flex items-center gap-2">
                <span className="label-sign flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground tnum">
                  {i + 1}
                </span>
                <stepItem.icon className="h-5 w-5 text-board-text" />
              </div>
              <h3 className="text-sm font-bold">{stepItem.title}</h3>
              <p className="mt-2 text-sm leading-6 text-ink-foreground/70">{stepItem.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

async function Newsletter() {
  const { t } = await getT();
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
      <div className="board-surface relative overflow-hidden rounded-xl px-6 py-14 text-center shadow-xl sm:px-14">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 opacity-40"
          style={{
            backgroundImage: `repeating-linear-gradient(to bottom, transparent 0px, transparent 47px, var(--board-line) 47px, var(--board-line) 48px)`,
          }}
        />
        <div className="relative z-10">
          <span className="label-sign inline-flex items-center gap-1.5 rounded-md bg-secondary px-3 py-1 text-foreground mb-5">
            <span className="h-1.5 w-1.5 rounded-full bg-ink animate-led" aria-hidden="true" />
            {t("home.boardTitle")}
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-board-text">
            {t("home.newsletterTitle")}
          </h2>
          <p className="mb-8 max-w-md mx-auto text-sm text-board-dim sm:text-base">
            {t("home.newsletterText")}
          </p>
          <SubscribeForm />
          <p className="text-xs mt-4 text-board-dim">
            {t("home.newsletterLegal")}
          </p>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton fallbacks
// ─────────────────────────────────────────────────────────────────────────────
function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

function CarouselSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="flex gap-4 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex-none w-56 sm:w-64">
          <ProductCardSkeleton />
        </div>
      ))}
    </div>
  );
}

function TestimonialsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-3">
          <div className="h-4 w-24 rounded bg-muted animate-pulse" />
          <div className="h-4 w-full rounded bg-muted animate-pulse" />
          <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
        </div>
      ))}
    </div>
  );
}

function CategorySkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-xl aspect-square bg-muted animate-pulse" />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────
async function getHeroData() {
  const [heroProducts, reviewAgg, productCount] = await Promise.all([
    db.product.findMany({
      where: { isActive: true, images: { isEmpty: false } },
      orderBy: { orderItems: { _count: "desc" } },
      take: 3,
      select: { id: true, title: true, slug: true, images: true },
    }),
    db.review.aggregate({ _avg: { rating: true }, _count: { rating: true } }),
    db.product.count({ where: { isActive: true } }),
  ]);

  return {
    heroProducts,
    avgRating: reviewAgg._avg.rating ?? 0,
    reviewCount: reviewAgg._count.rating,
    productCount,
  };
}

export default async function HomePage() {
  const { heroProducts, avgRating, reviewCount, productCount } = await getHeroData();

  return (
    <div className="min-h-screen">
      <AnimatedHero
        products={heroProducts}
        avgRating={avgRating}
        reviewCount={reviewCount}
        productCount={productCount}
      />

      <FadeInSection delay={0.03}>
        <Suspense fallback={null}>
          <FeaturedDeal />
        </Suspense>
      </FadeInSection>

      <FadeInSection>
        <Suspense
          fallback={
            <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
              <div className="h-8 w-48 rounded bg-muted animate-pulse mb-6" />
              <CategorySkeleton />
            </section>
          }
        >
          <CategoriesGrid />
        </Suspense>
      </FadeInSection>

      <FadeInSection delay={0.05}>
        <Suspense
          fallback={
            <section className="py-14 bg-muted/40">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="h-8 w-48 rounded bg-muted animate-pulse mb-6" />
                <CarouselSkeleton />
              </div>
            </section>
          }
        >
          <TrendingNow />
        </Suspense>
      </FadeInSection>

      <FadeInSection delay={0.05}>
        <Suspense fallback={null}>
          <TrustBadges />
        </Suspense>
      </FadeInSection>

      <FadeInSection delay={0.05}>
        <Suspense fallback={null}>
          <ConversionStrip />
        </Suspense>
      </FadeInSection>

      <FadeInSection delay={0.05}>
        <Suspense
          fallback={
            <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
              <div className="h-8 w-48 rounded bg-muted animate-pulse mb-6" />
              <ProductGridSkeleton count={8} />
            </section>
          }
        >
          <NewArrivals />
        </Suspense>
      </FadeInSection>

      <FadeInSection delay={0.05}>
        <Suspense
          fallback={
            <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
              <div className="h-8 w-48 rounded bg-muted animate-pulse mb-6" />
              <TestimonialsSkeleton />
            </section>
          }
        >
          <ReviewsSection />
        </Suspense>
      </FadeInSection>

      <FadeInSection delay={0.05}>
        <Suspense fallback={null}>
          <Newsletter />
        </Suspense>
      </FadeInSection>
    </div>
  );
}
