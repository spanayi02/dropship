"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Star, Truck, RotateCcw, ShieldCheck } from "lucide-react";
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
  show: { transition: { staggerChildren: 0.07 } },
};

const item = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  },
};

const FALLBACK_IMAGES = [
  "/demo/products/mechanical-keyboard-rgb-backlit-tkl-1.jpg",
  "/demo/products/wireless-noise-canceling-earbuds-pro-1.jpg",
  "/demo/products/insulated-water-bottle-32oz-stainless-1.jpg",
];

export function AnimatedHero({
  products,
  avgRating,
  reviewCount,
  productCount,
}: AnimatedHeroProps) {
  const { t, intl } = useI18n();
  const images = [0, 1, 2].map((i) => products[i]?.images[0] ?? FALLBACK_IMAGES[i]);
  const mainProduct = products[0];
  const productHref = mainProduct ? `/products/${mainProduct.slug}` : "/products";
  const freeShipAmount = formatPrice(FREE_SHIPPING_THRESHOLD, undefined, intl);

  return (
    <section className="border-b border-hairline bg-background">
      <div className="container-store py-12 sm:py-16 lg:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Copy */}
          <motion.div variants={container} initial="hidden" animate="show">
            <motion.p
              variants={item}
              className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
              {t("home.boardSubtitle")}
            </motion.p>

            <motion.h1
              variants={item}
              className="mb-5 text-4xl leading-[1.08] text-foreground sm:text-5xl lg:text-6xl"
            >
              {t("home.headline1")}{" "}
              <span className="text-muted-foreground">{t("home.headline2")}</span>
            </motion.h1>

            <motion.p
              variants={item}
              className="mb-8 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg"
            >
              {t("home.intro")}
            </motion.p>

            <motion.div variants={item} className="mb-10 flex flex-wrap items-center gap-3">
              <Link
                href="/products"
                className="inline-flex h-12 items-center gap-2 rounded-lg bg-primary px-7 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 active:translate-y-px"
              >
                {t("home.ctaPrimary")}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/products?sort=price_asc"
                className="inline-flex h-12 items-center gap-2 rounded-lg border border-border-strong px-7 text-sm font-medium text-foreground transition-colors hover:bg-muted active:translate-y-px"
              >
                {t("home.ctaSecondary")}
              </Link>
            </motion.div>

            {/* Trust row */}
            <motion.ul
              variants={item}
              className="grid gap-x-6 gap-y-3 border-t border-hairline pt-6 text-sm text-muted-foreground sm:grid-cols-2"
            >
              <li className="flex items-center gap-2">
                <Truck className="h-4 w-4 flex-shrink-0 text-foreground" />
                {t("home.proofShipping", { amount: freeShipAmount })}
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 flex-shrink-0 text-foreground" />
                {t("footer.securePayment")}
              </li>
              <li className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4 flex-shrink-0 text-foreground" />
                {t("footer.returnsDays")}
              </li>
              {reviewCount > 0 ? (
                <li className="flex items-center gap-2 tabular-nums">
                  <Star className="h-4 w-4 flex-shrink-0 fill-warning text-warning" />
                  {t("home.proofReviews", {
                    rating: avgRating.toFixed(1),
                    count: reviewCount,
                  })}
                </li>
              ) : (
                <li className="flex items-center gap-2 tabular-nums">
                  <Star className="h-4 w-4 flex-shrink-0 text-foreground" />
                  {t("home.proofProducts", { count: productCount })}
                </li>
              )}
            </motion.ul>
          </motion.div>

          {/* Imagery */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="grid grid-cols-2 gap-3 sm:gap-4"
          >
            <Link
              href={productHref}
              className="media-frame group col-span-2 aspect-[16/10] sm:aspect-[16/9]"
            >
              <Image
                src={images[0]}
                alt={mainProduct?.title ?? t("home.ctaPrimary")}
                fill
                priority
                sizes="(min-width: 1024px) 45vw, 100vw"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
            </Link>
            {[1, 2].map((i) => (
              <Link
                key={i}
                href={products[i] ? `/products/${products[i].slug}` : "/products"}
                className="media-frame group aspect-square"
              >
                <Image
                  src={images[i]}
                  alt={products[i]?.title ?? ""}
                  fill
                  sizes="(min-width: 1024px) 22vw, 50vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </Link>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
