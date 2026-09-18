"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Truck, Star } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { formatPrice } from "@/lib/utils";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/store-config";

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
  "/demo/products/mechanical-keyboard-rgb-backlit-tkl-1.jpg",
  "/demo/products/wireless-noise-canceling-earbuds-pro-1.jpg",
  "/demo/products/insulated-water-bottle-32oz-stainless-1.jpg",
];

export function AnimatedHero({ products, avgRating, reviewCount, productCount }: AnimatedHeroProps) {
  const { t, intl } = useI18n();
  const images = [0, 1, 2].map((i) => products[i]?.images[0] ?? FALLBACK_IMAGES[i]);
  const mainProduct = products[0];
  const productHref = mainProduct ? `/products/${mainProduct.slug}` : "/products";
  const freeShipAmount = formatPrice(FREE_SHIPPING_THRESHOLD, undefined, intl);

  return (
    <section className="relative overflow-hidden bg-background border-b border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          {/* Copy column */}
          <motion.div variants={container} initial="hidden" animate="show">
            <motion.div
              variants={item}
              className="mb-6 inline-flex items-center gap-2 rounded-[3px] bg-signal px-2.5 py-1.5 label-sign text-signal-foreground"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-ink animate-led" aria-hidden="true" />
              {t("home.boardSubtitle")}
            </motion.div>

            <motion.h1
              variants={item}
              className="font-board text-4xl sm:text-5xl lg:text-[3.75rem] font-bold uppercase tracking-tight leading-[1.05] mb-6 text-foreground"
            >
              {t("home.headline1")}
              <br />
              {t("home.headline2")}
            </motion.h1>

            <motion.p
              variants={item}
              className="max-w-md text-base sm:text-lg text-muted-foreground mb-8 leading-relaxed"
            >
              {t("home.intro")}
            </motion.p>

            <motion.div variants={item} className="flex flex-wrap items-center gap-3 mb-10">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 rounded-[3px] bg-signal px-6 py-3 text-sm font-bold text-signal-foreground transition-all hover:-translate-y-0.5 hover:bg-signal-deep"
              >
                {t("home.ctaPrimary")}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/products?sort=price_asc"
                className="inline-flex items-center gap-2 rounded-[3px] border border-border px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
              >
                {t("home.ctaSecondary")}
              </Link>
            </motion.div>

            <motion.div
              variants={item}
              className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-border pt-6 text-sm text-muted-foreground tnum"
            >
              <span className="font-semibold text-foreground">
                {t("home.proofProducts", { count: productCount })}
              </span>
              {reviewCount > 0 && (
                <span className="flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5 fill-signal-deep text-signal-deep" />
                  <span className="font-semibold text-foreground">
                    {t("home.proofReviews", { rating: avgRating.toFixed(1), count: reviewCount })}
                  </span>
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Truck className="h-3.5 w-3.5" />
                {t("home.proofShipping", { amount: freeShipAmount })}
              </span>
            </motion.div>
          </motion.div>

          {/* Image collage — luggage tags dropped on the counter */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto w-full max-w-sm lg:max-w-none"
          >
            <Link
              href={productHref}
              className="relative block aspect-[4/5] w-full overflow-hidden rounded-[4px] border-2 border-ink bg-muted shadow-[0_20px_50px_-25px_oklch(0_0_0/0.35)]"
            >
              <Image
                src={images[0]}
                alt={mainProduct?.title ?? "Featured product"}
                fill
                priority
                sizes="(min-width: 1024px) 40vw, 80vw"
                className="object-cover"
              />
              <span className="absolute left-3 top-3 rounded-[2px] bg-signal px-2 py-1 label-sign text-signal-foreground shadow-sm">
                {t("home.nowBoarding")}
              </span>
            </Link>

            <div className="tag-punch absolute -left-6 -bottom-8 h-28 w-28 sm:h-32 sm:w-32 overflow-hidden rounded-[3px] border-4 border-background bg-muted shadow-[0_12px_30px_-12px_oklch(0_0_0/0.4)] rotate-[-6deg] animate-tag-drop">
              <Image
                src={images[1]}
                alt={products[1]?.title ?? "Product"}
                fill
                sizes="128px"
                className="object-cover"
              />
            </div>
            <div className="tag-punch absolute -right-4 top-10 h-24 w-24 sm:h-28 sm:w-28 overflow-hidden rounded-[3px] border-4 border-background bg-muted shadow-[0_12px_30px_-12px_oklch(0_0_0/0.4)] rotate-[5deg] hidden sm:block animate-tag-drop">
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
