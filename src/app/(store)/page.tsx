import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Truck,
  ShieldCheck,
  RotateCcw,
  Headphones,
} from "lucide-react";
import { db } from "@/lib/db";
import { ProductCard, ProductCardSkeleton } from "@/components/store/product-card";
import { SubscribeForm } from "@/components/store/subscribe-form";
import { AnimatedHero } from "@/components/store/animated-hero";
import { FadeInSection } from "@/components/store/fade-in-section";

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
    <div className="flex items-end justify-between mb-6">
      <h2
        className="text-2xl sm:text-3xl font-bold tracking-tight"
        style={{ fontFamily: "var(--font-heading), system-ui, sans-serif" }}
      >
        {title}
      </h2>
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
      <SectionHeader title="Shop by Category" viewAllHref="/products" viewAllLabel="All Categories" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {categories.map((cat, index) => (
          <Link
            key={cat.id}
            href={`/products?category=${cat.slug}`}
            className="group relative flex flex-col items-center rounded-2xl border border-border bg-card overflow-hidden hover:shadow-md transition-shadow duration-200"
          >
            <div className="relative w-full aspect-square overflow-hidden bg-muted">
              <Image
                src={cat.image ?? `https://picsum.photos/seed/${cat.slug}/300/300`}
                alt={cat.name}
                fill
                sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
              <p className="text-sm font-semibold leading-tight">{cat.name}</p>
              <p className="text-xs opacity-80 mt-0.5">{cat._count.products} products</p>
            </div>
          </Link>
        ))}
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
        <SectionHeader title="Trending Now" viewAllHref="/products?sort=best_selling" />
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
      <SectionHeader title="New Arrivals" viewAllHref="/products?sort=newest" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
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
      title: "24/7 Support",
      subtitle: "Always here to help",
    },
  ];

  return (
    <section className="border-y border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          {badges.map((badge) => (
            <div
              key={badge.title}
              className="flex flex-col sm:flex-row items-center sm:items-start gap-3 text-center sm:text-left"
            >
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--emerald)]/10">
                <badge.icon className="h-5 w-5 text-[var(--emerald)]" />
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
// Newsletter
// ─────────────────────────────────────────────────────────────────────────────
function Newsletter() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[var(--emerald)]/15 via-background to-background border border-[var(--emerald)]/20 px-6 py-12 sm:px-12 text-center">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, var(--border) 1px, transparent 1px),
              linear-gradient(to bottom, var(--border) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
            opacity: 0.4,
          }}
        />
        <div className="relative z-10">
          <h2
            className="text-2xl sm:text-3xl font-bold mb-3"
            style={{ fontFamily: "var(--font-heading), system-ui, sans-serif" }}
          >
            Stay in the loop
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto text-sm sm:text-base">
            Get notified about new products, exclusive deals, and early access to sales.
            No spam, ever.
          </p>
          <SubscribeForm />
          <p className="text-xs text-muted-foreground mt-4">
            By subscribing you agree to our{" "}
            <Link href="/privacy" className="underline hover:text-foreground transition-colors">
              privacy policy
            </Link>
            .
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
export default function HomePage() {
  return (
    <div className="min-h-screen">
      <AnimatedHero />

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
        <Newsletter />
      </FadeInSection>
    </div>
  );
}
