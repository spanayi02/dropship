"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Truck, Star } from "lucide-react";

export interface HeroProduct {
  id: string;
  title: string;
  slug: string;
  images: string[];
}

interface AnimatedHeroProps {
  products: HeroProduct[];
  avgRating: number;
  reviewCount: number;
  productCount: number;
}

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

const FALLBACK_IMAGES = [
  "https://picsum.photos/seed/hero-main/800/1000",
  "https://picsum.photos/seed/hero-sub1/600/600",
  "https://picsum.photos/seed/hero-sub2/600/600",
];

export function AnimatedHero({ products, avgRating, reviewCount, productCount }: AnimatedHeroProps) {
  const images = [0, 1, 2].map(
    (i) => products[i]?.images[0] ?? FALLBACK_IMAGES[i]
  );
  const mainProduct = products[0];
  const productHref = mainProduct ? `/products/${mainProduct.slug}` : "/products";

  return (
    <section className="relative overflow-hidden bg-background border-b border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          {/* Copy column */}
          <motion.div variants={container} initial="hidden" animate="show">
            <motion.div variants={item} className="flex items-center gap-2.5 mb-6">
              <span className="h-px w-8 bg-[var(--emerald)]" aria-hidden="true" />
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                WishlistAZ
              </span>
            </motion.div>

            <motion.h1
              variants={item}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05] mb-6 text-foreground"
              style={{ fontFamily: "var(--font-heading), system-ui, sans-serif" }}
            >
              Good finds,
              <br />
              <span className="italic font-medium">without the search.</span>
            </motion.h1>

            <motion.p
              variants={item}
              className="max-w-md text-base sm:text-lg text-muted-foreground mb-8 leading-relaxed"
            >
              We sort through the noise so you don&apos;t have to — a tight
              selection of quality products, priced fairly and shipped fast.
            </motion.p>

            <motion.div variants={item} className="flex flex-wrap items-center gap-3 mb-10">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--emerald)] px-6 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                Shop the collection
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/products?sort=price_asc"
                className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
              >
                Browse deals
              </Link>
            </motion.div>

            <motion.div
              variants={item}
              className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-border pt-6 text-sm text-muted-foreground"
            >
              <span className="font-medium text-foreground">{productCount}+ products</span>
              {reviewCount > 0 && (
                <span className="flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-medium text-foreground">{avgRating.toFixed(1)}</span>
                  from {reviewCount} reviews
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Truck className="h-3.5 w-3.5" />
                Free shipping over $50
              </span>
            </motion.div>
          </motion.div>

          {/* Image collage */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto w-full max-w-sm lg:max-w-none"
          >
            <Link
              href={productHref}
              className="relative block aspect-[4/5] w-full overflow-hidden rounded-2xl border border-border bg-muted shadow-sm"
            >
              <Image
                src={images[0]}
                alt={mainProduct?.title ?? "Featured product"}
                fill
                priority
                sizes="(min-width: 1024px) 40vw, 80vw"
                className="object-cover"
              />
            </Link>

            <div className="absolute -left-6 -bottom-8 h-28 w-28 sm:h-32 sm:w-32 overflow-hidden rounded-xl border-4 border-background shadow-lg rotate-[-6deg]">
              <Image
                src={images[1]}
                alt={products[1]?.title ?? "Product"}
                fill
                sizes="128px"
                className="object-cover"
              />
            </div>
            <div className="absolute -right-4 top-10 h-24 w-24 sm:h-28 sm:w-28 overflow-hidden rounded-xl border-4 border-background shadow-lg rotate-[5deg] hidden sm:block">
              <Image
                src={images[2]}
                alt={products[2]?.title ?? "Product"}
                fill
                sizes="112px"
                className="object-cover"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
