"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Star, Check } from "lucide-react";
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

function StarRating({
  rating,
  count,
  noReviewsLabel,
  intl,
}: {
  rating: number;
  count: number;
  noReviewsLabel: string;
  intl: string;
}) {
  if (count === 0) {
    return <span className="text-xs text-muted-foreground">{noReviewsLabel}</span>;
  }
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="flex items-center gap-px"
        aria-label={`${rating.toFixed(1)} / 5`}
      >
        {Array.from({ length: 5 }).map((_, i) => {
          const filled = i < Math.floor(rating);
          const partial = !filled && i < rating;
          return (
            <span key={i} className="relative inline-block">
              <Star
                className={cn(
                  "h-3 w-3",
                  filled ? "fill-warning text-warning" : "fill-muted text-muted-foreground/25"
                )}
              />
              {partial && (
                <span
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${(rating - Math.floor(rating)) * 100}%` }}
                >
                  <Star className="h-3 w-3 fill-warning text-warning" />
                </span>
              )}
            </span>
          );
        })}
      </div>
      <span className="text-xs tabular-nums text-muted-foreground">
        {new Intl.NumberFormat(intl).format(count)}
      </span>
    </div>
  );
}

const FALLBACK_IMAGE = "/demo/products/mechanical-keyboard-rgb-backlit-tkl-1.jpg";

export function ProductCard({ product, className }: ProductCardProps) {
  const { addItem, openCart } = useCartStore();
  const { t, intl } = useI18n();
  const [added, setAdded] = useState(false);
  const [now] = useState(() => Date.now());

  const avgRating =
    product.reviews.length > 0
      ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
      : 0;

  const images = product.images.length > 0 ? product.images : [FALLBACK_IMAGE];
  const primaryImage = images[0];
  const secondaryImage = images[1];

  const isNew =
    product.createdAt != null &&
    now - new Date(product.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000;

  const isSale =
    product.compareAtPrice != null && product.compareAtPrice > product.sellingPrice;

  const discount =
    isSale && product.compareAtPrice
      ? Math.round(
          ((product.compareAtPrice - product.sellingPrice) / product.compareAtPrice) * 100
        )
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
    <article className={cn("group flex flex-col", className)}>
      {/* Image */}
      <div className="media-frame relative aspect-square">
        <Link
          href={`/products/${product.slug}`}
          className="block h-full w-full"
          aria-label={product.title}
        >
          <Image
            src={primaryImage}
            alt={product.title}
            fill
            sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className={cn(
              "object-cover transition-opacity duration-300",
              secondaryImage && "group-hover:opacity-0"
            )}
          />
          {secondaryImage && (
            <Image
              src={secondaryImage}
              alt=""
              aria-hidden="true"
              fill
              sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            />
          )}
        </Link>

        {/* Badges */}
        <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {isSale && (
            <span className="rounded-md bg-sale px-2 py-1 text-[11px] font-semibold leading-none text-white">
              {t("product.save", { percent: discount })}
            </span>
          )}
          {isNew && !isSale && (
            <span className="rounded-md bg-ink px-2 py-1 text-[11px] font-semibold leading-none text-ink-foreground">
              {t("common.new")}
            </span>
          )}
        </div>

        <WishlistButton
          productId={product.id}
          className="absolute right-2.5 top-2.5 h-9 w-9 rounded-full border-transparent bg-background/85 shadow-sm backdrop-blur-sm hover:bg-background"
        />
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-2 pt-3">
        <Link
          href={`/products/${product.slug}`}
          className="line-clamp-2 text-sm font-medium leading-snug decoration-1 underline-offset-2 hover:underline"
        >
          {product.title}
        </Link>

        <StarRating
          rating={avgRating}
          count={product.reviews.length}
          noReviewsLabel={t("products.noReviews")}
          intl={intl}
        />

        <div className="mt-auto flex flex-wrap items-baseline gap-x-2 gap-y-0.5 pt-0.5 tabular-nums">
          <span
            className={cn(
              "text-base font-semibold",
              isSale ? "text-sale" : "text-foreground"
            )}
          >
            {formatPrice(product.sellingPrice, undefined, intl)}
          </span>
          {isSale && product.compareAtPrice && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(product.compareAtPrice, undefined, intl)}
            </span>
          )}
        </div>

        <button
          onClick={handleAddToCart}
          aria-label={`${t("product.addToCart")} — ${product.title}`}
          className={cn(
            "mt-1.5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border text-sm font-medium",
            "transition-colors duration-200 active:translate-y-px",
            added
              ? "border-success bg-success-soft text-success"
              : "border-border-strong bg-background text-foreground hover:border-ink hover:bg-ink hover:text-ink-foreground"
          )}
        >
          {added ? (
            <>
              <Check className="h-4 w-4" />
              {t("products.added")}
            </>
          ) : (
            <>
              <ShoppingCart className="h-4 w-4" />
              {t("product.addToCart")}
            </>
          )}
        </button>
      </div>
    </article>
  );
}

export function ProductCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex animate-pulse flex-col", className)}>
      <div className="aspect-square rounded-lg bg-muted" />
      <div className="flex flex-col gap-2.5 pt-3">
        <div className="h-4 w-full rounded bg-muted" />
        <div className="h-4 w-2/3 rounded bg-muted" />
        <div className="h-3 w-1/3 rounded bg-muted" />
        <div className="h-5 w-20 rounded bg-muted" />
        <div className="mt-1.5 h-10 w-full rounded-lg bg-muted" />
      </div>
    </div>
  );
}
