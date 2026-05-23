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
    <div className="flex items-end justify-between mb-8">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-block h-1 w-8 rounded-full bg-[var(--emerald)]" />
          <span className="inline-block h-1 w-3 rounded-full bg-[var(--emerald)]/40" />
        </div>
        <h2
          className="text-2xl sm:text-3xl font-extrabold tracking-tight"
          style={{ fontFamily: "var(--font-heading), system-ui, sans-serif" }}
        >
          {title}
        </h2>
      </div>
      <Link
        href={viewAllHref}
        className="flex items-center gap-1.5 text-sm font-semibold text-[var(--emerald)] border border-[var(--emerald)]/30 rounded-lg px-3 py-1.5 hover:bg-[var(--emerald)]/10 transition-colors"
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
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/products?category=${cat.slug}`}
            className="group relative flex flex-col items-center rounded-2xl overflow-hidden border border-border hover:border-[var(--emerald)]/40 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
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
    <section className="py-14" style={{ background: "linear-gradient(180deg, var(--muted) 0%, transparent 100%)" }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader title="Trending Now 🔥" viewAllHref="/products?sort=best_selling" />
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
      iconBg: "bg-sky-500/10",
      iconColor: "text-sky-500",
    },
    {
      icon: ShieldCheck,
      title: "Secure Payment",
      subtitle: "256-bit SSL encryption",
      iconBg: "bg-[var(--emerald)]/10",
      iconColor: "text-[var(--emerald)]",
    },
    {
      icon: RotateCcw,
      title: "Easy Returns",
      subtitle: "30-day return policy",
      iconBg: "bg-amber-500/10",
      iconColor: "text-amber-500",
    },
    {
      icon: Headphones,
      title: "24/7 Support",
      subtitle: "Always here to help",
      iconBg: "bg-violet-500/10",
      iconColor: "text-violet-500",
    },
  ];

  return (
    <section className="border-y border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          {badges.map((badge) => (
            <div
              key={badge.title}
              className="flex flex-col sm:flex-row items-center sm:items-start gap-3 text-center sm:text-left"
            >
              <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl ${badge.iconBg}`}>
                <badge.icon className={`h-5 w-5 ${badge.iconColor}`} />
              </div>
              <div className="pt-0.5">
                <p className="text-sm font-bold text-foreground">{badge.title}</p>
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
      <div
        className="relative rounded-3xl overflow-hidden px-6 py-14 sm:px-14 text-center text-white"
        style={{ background: "oklch(0.12 0.04 155)" }}
      >
        {/* Background grid */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, oklch(1 0 0 / 6%) 1px, transparent 1px),
              linear-gradient(to bottom, oklch(1 0 0 / 6%) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
          }}
        />
        {/* Glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full blur-[80px]"
          style={{ background: "oklch(0.55 0.20 155 / 40%)" }}
        />
        <div className="relative z-10">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/8 px-3 py-1 text-xs font-semibold text-white/80 mb-5"
            style={{ backgroundColor: "oklch(1 0 0 / 8%)" }}>
            Exclusive offers
          </span>
          <h2
            className="text-2xl sm:text-3xl font-extrabold mb-3 text-white"
            style={{ fontFamily: "var(--font-heading), system-ui, sans-serif" }}
          >
            Get deals before everyone else
          </h2>
          <p className="mb-8 max-w-md mx-auto text-sm sm:text-base" style={{ color: "oklch(0.80 0 0)" }}>
            Join 50,000+ shoppers. Get exclusive deals, new arrivals, and early access to sales.
            No spam, ever.
          </p>
          <SubscribeForm />
          <p className="text-xs mt-4" style={{ color: "oklch(0.60 0 0)" }}>
            By subscribing you agree to our{" "}
            <Link href="/privacy" className="underline hover:text-white transition-colors">
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
