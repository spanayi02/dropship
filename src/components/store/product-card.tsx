"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Star, Check } from "lucide-react";
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

  const avgRating =
    product.reviews.length > 0
      ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
      : 0;

  const primaryImage =
    product.images[0] ?? `https://picsum.photos/seed/${product.id}/400/400`;

  const isNew =
    product.createdAt != null &&
    Date.now() - new Date(product.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000;

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
        "group relative flex flex-col rounded-xl border border-border bg-card overflow-hidden",
        "transition-shadow duration-200 hover:shadow-md",
        className
      )}
    >
      {/* Badges */}
      <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1">
        {isNew && (
          <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold bg-[var(--emerald)] text-white shadow-sm">
            New
          </span>
        )}
        {isSale && (
          <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold bg-rose-500 text-white shadow-sm">
            -{discount}%
          </span>
        )}
      </div>

      {/* Image */}
      <Link
        href={`/products/${product.slug}`}
        className="relative block aspect-square overflow-hidden bg-muted"
        tabIndex={-1}
        aria-hidden="true"
      >
        <Image
          src={primaryImage}
          alt={product.title}
          fill
          sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </Link>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-2 p-3">
        {/* Title */}
        <Link
          href={`/products/${product.slug}`}
          className="text-sm font-medium leading-snug line-clamp-2 hover:text-[var(--emerald)] transition-colors"
        >
          {product.title}
        </Link>

        {/* Rating */}
        {product.reviews.length > 0 ? (
          <StarRating rating={avgRating} count={product.reviews.length} />
        ) : (
          <span className="text-xs text-muted-foreground">No reviews yet</span>
        )}

        {/* Price */}
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

          {/* Add to Cart */}
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
        "flex flex-col rounded-xl border border-border bg-card overflow-hidden animate-pulse",
        className
      )}
    >
      {/* Image placeholder */}
      <div className="aspect-square bg-muted" />
      {/* Body placeholder */}
      <div className="flex flex-col gap-2.5 p-3">
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
