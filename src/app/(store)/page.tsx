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
  Clock3,
  Gift,
  PackageCheck,
  ShoppingBag,
  Sparkles,
  Star,
} from "lucide-react";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import { ProductCard, ProductCardSkeleton } from "@/components/store/product-card";
import { AnimatedHero } from "@/components/store/animated-hero";
import { FadeInSection } from "@/components/store/fade-in-section";
import { StaggerGrid, StaggerItem } from "@/components/store/stagger-grid";
import { Testimonials } from "@/components/store/testimonials";
import { SubscribeForm } from "@/components/store/subscribe-form";

export const dynamic = 'force-dynamic';

// ─────────────────────────────────────────────────────────────────────────────
// Section Wrapper
// ─────────────────────────────────────────────────────────────────────────────
function SectionHeader({
  title,
  viewAllHref,
  viewAllLabel = "View All",
}: {
  title: string;
  viewAllHref: string;
  viewAllLabel?: string;
}) {
  return (
    <div className="flex items-end justify-between mb-8">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-block h-1 w-8 rounded-full bg-[var(--emerald)]" />
          <span className="inline-block h-1 w-3 rounded-full bg-[var(--emerald)]/40" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          {title}
        </h2>
      </div>
      <Link
        href={viewAllHref}
        className="flex items-center gap-1 text-sm font-medium text-[var(--emerald)] hover:underline transition-colors"
      >
        {viewAllLabel}
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Categories Grid
// ─────────────────────────────────────────────────────────────────────────────
async function CategoriesGrid() {
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
      <SectionHeader title="Shop the good stuff" viewAllHref="/products" viewAllLabel="All Categories" />
      <StaggerGrid className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {categories.map((cat) => (
          <StaggerItem key={cat.id}>
            <Link
              href={`/products?category=${cat.slug}`}
              className="group relative flex flex-col items-center overflow-hidden rounded-2xl border border-border bg-card shadow-sm hover:border-[var(--emerald)]/40 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="relative w-full aspect-square overflow-hidden bg-muted">
                <Image
                  src={cat.image ?? `https://picsum.photos/seed/${cat.slug}/300/300`}
                  alt={cat.name}
                  fill
                  sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                {/* Gradient overlay — stronger at bottom */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                {/* Subtle emerald tint on hover */}
                <div className="absolute inset-0 bg-[var(--emerald)]/0 group-hover:bg-[var(--emerald)]/15 transition-colors duration-300" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                <p className="text-sm font-bold leading-tight">{cat.name}</p>
                <span className="inline-block mt-1 rounded-full bg-white/20 backdrop-blur-sm px-2 py-0.5 text-[10px] font-medium text-white/90">
                  {cat._count.products} items
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
// Featured Deal
// ─────────────────────────────────────────────────────────────────────────────
async function FeaturedDeal() {
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

  const image = product.images[0] ?? `https://picsum.photos/seed/${product.id}/700/700`;
  const discount = Math.round(
    ((product.compareAtPrice - product.sellingPrice) / product.compareAtPrice) * 100
  );
  const rating =
    product.reviews.length > 0
      ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
      : 4.8;

  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="grid overflow-hidden rounded-3xl border border-border bg-card lg:grid-cols-[0.92fr_1.08fr]">
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
              <p className="text-xs font-bold uppercase tracking-wide text-white/80">Featured steal</p>
              <p className="mt-1 max-w-sm text-2xl font-extrabold leading-tight">{product.title}</p>
            </div>
            <span className="rounded-md bg-destructive px-3 py-1.5 text-sm font-extrabold text-white">
              Save {discount}%
            </span>
          </div>
        </Link>

        <div className="relative p-7 sm:p-10">
          <span className="mb-5 inline-flex items-center gap-2 rounded-md bg-muted px-3 py-1 text-xs font-extrabold text-muted-foreground">
            <Gift className="h-3.5 w-3.5" />
            Checked against last month&apos;s price
          </span>
          <h2 className="max-w-xl text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            A markdown we&apos;d actually call a markdown.
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
            The struck-through price below is what this sold for four weeks
            ago — not a number invented today to make the badge look bigger.
          </p>

          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-muted p-4">
              <PackageCheck className="mb-3 h-5 w-5 text-foreground" />
              <p className="text-xs font-bold uppercase text-muted-foreground">Price now</p>
              <p className="mt-1 text-xl font-extrabold tabular-nums text-foreground">{formatPrice(product.sellingPrice)}</p>
            </div>
            <div className="rounded-xl bg-muted p-4">
              <BadgePercent className="mb-3 h-5 w-5 text-foreground" />
              <p className="text-xs font-bold uppercase text-muted-foreground">Was</p>
              <p className="mt-1 text-xl font-extrabold tabular-nums text-foreground">{formatPrice(product.compareAtPrice)}</p>
            </div>
            <div className="rounded-xl bg-muted p-4">
              <Star className="mb-3 h-5 w-5 fill-amber-400 text-amber-500" />
              <p className="text-xs font-bold uppercase text-muted-foreground">Rating</p>
              <p className="mt-1 text-xl font-extrabold tabular-nums text-foreground">{rating.toFixed(1)} / 5</p>
            </div>
          </div>

          <Link
            href={`/products/${product.slug}`}
            className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-foreground px-7 py-3.5 text-sm font-extrabold text-background shadow-xl shadow-black/10 transition-all hover:-translate-y-0.5 hover:shadow-2xl sm:w-auto"
          >
            Grab this deal
            <ShoppingBag className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Trending Now — horizontal scroll carousel
// ─────────────────────────────────────────────────────────────────────────────
async function TrendingNow() {
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
        <SectionHeader title="What people are actually buying" viewAllHref="/products?sort=best_selling" />
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
// New Arrivals
// ─────────────────────────────────────────────────────────────────────────────
async function NewArrivals() {
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
      <SectionHeader title="Just landed" viewAllHref="/products?sort=newest" />
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
// Testimonials — pulled from real reviews
// ─────────────────────────────────────────────────────────────────────────────
async function ReviewsSection() {
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
      <SectionHeader title="What customers say" viewAllHref="/products" viewAllLabel="Shop All" />
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
function TrustBadges() {
  const badges = [
    {
      icon: Truck,
      title: "Free Shipping",
      subtitle: "On orders over $50",
    },
    {
      icon: ShieldCheck,
      title: "Secure Payment",
      subtitle: "256-bit SSL encryption",
    },
    {
      icon: RotateCcw,
      title: "Easy Returns",
      subtitle: "30-day return policy",
    },
    {
      icon: Headphones,
      title: "Real Support",
      subtitle: "A person replies, not a bot",
    },
  ];

  return (
    <section className="border-y border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 divide-x divide-y divide-border sm:grid-cols-4 sm:divide-y-0">
          {badges.map((badge) => (
            <div key={badge.title} className="flex items-center gap-3 px-4 py-6 sm:px-6">
              <badge.icon className="h-5 w-5 flex-shrink-0 text-foreground" />
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
// Conversion strip
// ─────────────────────────────────────────────────────────────────────────────
function ConversionStrip() {
  const items = [
    {
      icon: BadgePercent,
      title: "Real savings",
      text: "The percent off is computed from an actual prior price, every time.",
    },
    {
      icon: Clock3,
      title: "Fast decisions",
      text: "Sort by best sellers, newest drops, or category — no infinite scroll.",
    },
    {
      icon: Star,
      title: "Unfiltered reviews",
      text: "We don't hide the 3-star ones. You shouldn't have to dig for them either.",
    },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="grid overflow-hidden rounded-3xl bg-foreground text-background dark:bg-card dark:text-card-foreground lg:grid-cols-[0.9fr_1.1fr]">
        <div className="p-8 sm:p-10">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-background/10 px-3 py-1 text-xs font-bold text-background/80 dark:bg-foreground/10 dark:text-foreground/80">
            <Sparkles className="h-3.5 w-3.5" />
            Built to make checkout easy
          </span>
          <h2 className="max-w-md text-3xl font-extrabold tracking-tight sm:text-4xl">
            Everything you&apos;d want to check before you buy.
          </h2>
          <p className="mt-4 max-w-lg text-sm leading-7 text-background/70 dark:text-muted-foreground sm:text-base">
            No dark patterns, no manufactured urgency timers. Just the honest
            version of the things every store claims to do.
          </p>
        </div>
        <div className="grid gap-px bg-background/10 p-px dark:bg-border sm:grid-cols-3">
          {items.map((item) => (
            <div key={item.title} className="bg-card p-6 text-card-foreground">
              <item.icon className="mb-5 h-5 w-5 text-foreground" />
              <h3 className="text-sm font-extrabold">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Newsletter() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
      <div className="rounded-3xl bg-muted px-6 py-14 text-center text-foreground sm:px-14">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-bold text-foreground mb-5">
          Private deals
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold mb-3 text-foreground">
          Get the good deals before everyone else
        </h2>
        <p className="mb-8 max-w-md mx-auto text-sm text-muted-foreground sm:text-base">
          New drops, price cuts, and giftable finds sent first. No spam, ever.
        </p>
        <SubscribeForm />
        <p className="text-xs mt-4 text-muted-foreground">
          By subscribing you agree to our{" "}
          <Link href="/privacy" className="underline hover:text-foreground transition-colors">
            privacy policy
          </Link>
          .
        </p>
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
        <div key={i} className="rounded-2xl aspect-square bg-muted animate-pulse" />
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
        <TrustBadges />
      </FadeInSection>

      <FadeInSection delay={0.05}>
        <ConversionStrip />
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
        <Newsletter />
      </FadeInSection>
    </div>
  );
}
