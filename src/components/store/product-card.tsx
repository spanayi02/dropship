"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Star, Check, ChevronLeft, ChevronRight, Zap } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";
import { WishlistButton } from "@/components/store/wishlist-button";
import { useI18n } from "@/lib/i18n/client";

export interface ProductCardProduct {
  id: string;
  title: string;
  slug: string;
  images: string[];
  sellingPrice: number;
  compareAtPrice?: number | null;
  createdAt?: Date | string;
  reviews: { rating: number }[];
  categoryId: string;
}

interface ProductCardProps {
  product: ProductCardProduct;
  className?: string;
}

function StarRating({ rating, count, noReviewsLabel }: { rating: number; count: number; noReviewsLabel: string }) {
  if (count === 0) {
    return <span className="text-xs text-muted-foreground">{noReviewsLabel}</span>;
  }
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
        {Array.from({ length: 5 }).map((_, i) => {
          const filled = i < Math.floor(rating);
          const partial = !filled && i < rating;
          return (
            <span key={i} className="relative inline-block">
              <Star
                className={cn(
                  "h-3 w-3",
                  filled
                    ? "fill-signal-deep text-signal-deep"
                    : "fill-muted text-muted-foreground/30"
                )}
              />
              {partial && (
                <span
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${(rating - Math.floor(rating)) * 100}%` }}
                >
                  <Star className="h-3 w-3 fill-signal-deep text-signal-deep" />
                </span>
              )}
            </span>
          );
        })}
      </div>
      <span className="text-xs tnum text-muted-foreground">({count})</span>
    </div>
  );
}

const FALLBACK_IMAGE = "/demo/products/mechanical-keyboard-rgb-backlit-tkl-1.jpg";

export function ProductCard({ product, className }: ProductCardProps) {
  const { addItem, openCart } = useCartStore();
  const { t } = useI18n();
  const [added, setAdded] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const [imageHovered, setImageHovered] = useState(false);
  const [now] = useState(() => Date.now());

  const avgRating =
    product.reviews.length > 0
      ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
      : 0;

  const images = product.images.length > 0 ? product.images : [FALLBACK_IMAGE];
  const activeImage = images[imageIndex];

  function showPrevImage(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setImageIndex((i) => (i - 1 + images.length) % images.length);
  }

  function showNextImage(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setImageIndex((i) => (i + 1) % images.length);
  }

  const isNew =
    product.createdAt != null &&
    now - new Date(product.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000;

  const isSale =
    product.compareAtPrice != null && product.compareAtPrice > product.sellingPrice;

  const discount =
    isSale && product.compareAtPrice
      ? Math.round(((product.compareAtPrice - product.sellingPrice) / product.compareAtPrice) * 100)
      : 0;

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      id: crypto.randomUUID(),
      productId: product.id,
      title: product.title,
      price: product.sellingPrice,
      image: images[0],
      slug: product.slug,
    });
    openCart();
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-[4px] border border-border bg-card",
        "transition-all duration-300 hover:-translate-y-1 hover:border-ink/30 hover:shadow-[0_20px_40px_-22px_oklch(0_0_0/0.3)] dark:hover:border-signal/30",
        className
      )}
    >
      {/* Badges */}
      <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1.5">
        {isSale && (
          <span className="label-sign inline-flex items-center gap-1 rounded-[2px] px-2 py-1 bg-stop text-white shadow-sm">
            <Zap className="h-2.5 w-2.5" />
            {t("product.save", { percent: discount })}
          </span>
        )}
        {isNew && !isSale && (
          <span className="label-sign inline-flex items-center rounded-[2px] px-2 py-1 bg-signal text-signal-foreground shadow-sm">
            {t("common.new")}
          </span>
        )}
      </div>

      {/* Wishlist */}
      <WishlistButton
        productId={product.id}
        className="absolute top-2 right-2 z-10 h-8 w-8 rounded-[3px] bg-background/90 backdrop-blur-sm border-transparent shadow-sm"
      />

      {/* Image */}
      <div
        className="relative block aspect-square overflow-hidden bg-muted"
        onMouseEnter={() => setImageHovered(true)}
        onMouseLeave={() => setImageHovered(false)}
      >
        <Link
          href={`/products/${product.slug}`}
          tabIndex={-1}
          aria-hidden="true"
          className="relative block h-full w-full"
        >
          <Image
            src={activeImage}
            alt={product.title}
            fill
            sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </Link>

        {images.length > 1 && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-between p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={showPrevImage}
              aria-label="Previous image"
              className="pointer-events-auto flex h-6 w-6 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={showNextImage}
              aria-label="Next image"
              className="pointer-events-auto flex h-6 w-6 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Quick-add overlay */}
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 flex items-center justify-center bg-gradient-to-t from-black/55 via-black/15 to-transparent pb-3 pt-10 transition-all duration-300",
            imageHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          )}
        >
          <button
            onClick={handleAddToCart}
            aria-label={`${t("product.addToCart")} — ${product.title}`}
            className={cn(
              "flex items-center gap-2 rounded-[3px] px-4 py-2 text-xs font-bold shadow-lg transition-all duration-200",
              "backdrop-blur-sm",
              added
                ? "bg-go text-white scale-105"
                : "bg-signal text-signal-foreground hover:bg-signal-deep"
            )}
          >
            {added ? (
              <>
                <Check className="h-3.5 w-3.5" />
                {t("products.added")}
              </>
            ) : (
              <>
                <ShoppingCart className="h-3.5 w-3.5" />
                {t("products.quickAdd")}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-2 p-3.5">
        {/* Title */}
        <Link
          href={`/products/${product.slug}`}
          className="text-sm font-bold leading-snug line-clamp-2 hover:text-ink dark:hover:text-signal transition-colors"
        >
          {product.title}
        </Link>

        {/* Rating */}
        <StarRating rating={avgRating} count={product.reviews.length} noReviewsLabel={t("products.noReviews")} />

        {/* Price row */}
        <div className="mt-auto flex items-center justify-between gap-2 pt-1 border-t border-dashed border-border/70">
          <div className="flex items-baseline gap-1.5 pt-1.5 tnum">
            <span className="text-base font-bold text-foreground">
              {formatPrice(product.sellingPrice)}
            </span>
            {isSale && product.compareAtPrice && (
              <span className="text-xs text-muted-foreground line-through">
                {formatPrice(product.compareAtPrice)}
              </span>
            )}
          </div>

          {/* Corner add-to-cart */}
          <button
            onClick={handleAddToCart}
            aria-label={`${t("product.addToCart")} — ${product.title}`}
            className={cn(
              "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[3px] transition-all duration-200",
              added
                ? "bg-go text-white scale-110"
                : "bg-ink/8 text-ink hover:bg-ink hover:text-ink-foreground dark:bg-signal/15 dark:text-signal dark:hover:bg-signal dark:hover:text-signal-foreground"
            )}
          >
            {added ? (
              <Check className="h-4 w-4" />
            ) : (
              <ShoppingCart className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </article>
  );
}

export function ProductCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-[4px] border border-border bg-card overflow-hidden animate-pulse",
        className
      )}
    >
      <div className="aspect-square bg-muted" />
      <div className="flex flex-col gap-2.5 p-3.5">
        <div className="h-4 w-full rounded bg-muted" />
        <div className="h-4 w-3/4 rounded bg-muted" />
        <div className="h-3 w-1/2 rounded bg-muted" />
        <div className="flex items-center justify-between pt-1">
          <div className="h-5 w-16 rounded bg-muted" />
          <div className="h-8 w-8 rounded-[3px] bg-muted" />
        </div>
      </div>
    </div>
  );
}
