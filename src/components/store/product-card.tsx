"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Star, Check, Zap } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";

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

function StarRating({ rating, count }: { rating: number; count: number }) {
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
                    ? "fill-amber-400 text-amber-400"
                    : "fill-muted text-muted-foreground/30"
                )}
              />
              {partial && (
                <span
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${(rating - Math.floor(rating)) * 100}%` }}
                >
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                </span>
              )}
            </span>
          );
        })}
      </div>
      <span className="text-xs text-muted-foreground">({count})</span>
    </div>
  );
}

export function ProductCard({ product, className }: ProductCardProps) {
  const { addItem, openCart } = useCartStore();
  const [added, setAdded] = useState(false);
  const [imageHovered, setImageHovered] = useState(false);
  const [now] = useState(() => Date.now());

  const avgRating =
    product.reviews.length > 0
      ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
      : 0;

  const primaryImage =
    product.images[0] ?? `https://picsum.photos/seed/${product.id}/400/400`;

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
      image: primaryImage,
      slug: product.slug,
    });
    openCart();
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  return (
    <article
      className={cn(
        "group relative flex flex-col rounded-2xl border border-border bg-card overflow-hidden",
        "transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-[var(--emerald)]/30",
        className
      )}
    >
      {/* Badges */}
      <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1.5">
        {isSale && (
          <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold bg-rose-500 text-white shadow-sm shadow-rose-500/30">
            <Zap className="h-2.5 w-2.5" />
            -{discount}%
          </span>
        )}
        {isNew && !isSale && (
          <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold bg-[var(--emerald)] text-white shadow-sm shadow-[var(--emerald)]/30">
            New
          </span>
        )}
      </div>

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
            src={primaryImage}
            alt={product.title}
            fill
            sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500"
            style={{ transform: imageHovered ? "scale(1.08)" : "scale(1)" }}
          />
        </Link>

        {/* Quick-add overlay */}
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 flex items-center justify-center pb-3 transition-all duration-300",
            imageHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          )}
        >
          <button
            onClick={handleAddToCart}
            aria-label={`Add ${product.title} to cart`}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-lg transition-all duration-200",
              "backdrop-blur-sm",
              added
                ? "bg-[var(--emerald)] scale-105"
                : "bg-black/70 hover:bg-[var(--emerald)]"
            )}
          >
            {added ? (
              <>
                <Check className="h-3.5 w-3.5" />
                Added!
              </>
            ) : (
              <>
                <ShoppingCart className="h-3.5 w-3.5" />
                Quick Add
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
          className="text-sm font-semibold leading-snug line-clamp-2 hover:text-[var(--emerald)] transition-colors"
        >
          {product.title}
        </Link>

        {/* Rating */}
        {product.reviews.length > 0 ? (
          <StarRating rating={avgRating} count={product.reviews.length} />
        ) : (
          <span className="text-xs text-muted-foreground">No reviews yet</span>
        )}

        {/* Price row */}
        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <div className="flex items-baseline gap-1.5">
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
            aria-label={`Add ${product.title} to cart`}
            className={cn(
              "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-all duration-200",
              added
                ? "bg-[var(--emerald)] text-white scale-110"
                : "bg-[var(--emerald)]/10 text-[var(--emerald)] hover:bg-[var(--emerald)] hover:text-white"
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
        "flex flex-col rounded-2xl border border-border bg-card overflow-hidden animate-pulse",
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
          <div className="h-8 w-8 rounded-lg bg-muted" />
        </div>
      </div>
    </div>
  );
}
