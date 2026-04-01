import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import { ProductCard, ProductCardSkeleton } from "@/components/store/product-card";
import { ImageGallery } from "@/components/store/image-gallery";
import { AddToCartButton } from "@/components/store/add-to-cart-button";
import { QuantitySelector } from "@/components/store/quantity-selector";
import { WishlistButton } from "@/components/store/wishlist-button";
import { DescriptionToggle } from "@/components/store/description-toggle";
import { ProductTabs } from "@/components/store/product-tabs";
import { ShieldCheck, RotateCcw, Star, Truck, ChevronRight, BadgeCheck } from "lucide-react";
import Link from "next/link";

// ─────────────────────────────────────────────────────────────────────────────
// Data fetching
// ─────────────────────────────────────────────────────────────────────────────
async function getProduct(slug: string) {
  return db.product.findUnique({
    where: { slug },
    include: {
      category: true,
      reviews: {
        include: { user: { select: { name: true, image: true } } },
        orderBy: { createdAt: "desc" },
      },
      suppliers: {
        include: { supplier: true },
        where: { inStock: true },
        take: 1,
      },
    },
  });
}

async function getRelatedProducts(categoryId: string, excludeId: string) {
  return db.product.findMany({
    where: {
      categoryId,
      id: { not: excludeId },
      isActive: true,
    },
    include: { reviews: { select: { rating: true } } },
    take: 4,
    orderBy: { createdAt: "desc" },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Metadata
// ─────────────────────────────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await db.product.findUnique({
    where: { slug },
    select: { title: true, description: true, images: true },
  });

  if (!product) return { title: "Product Not Found | DropShip" };

  return {
    title: `${product.title} | DropShip`,
    description: product.description.slice(0, 160),
    openGraph: {
      title: product.title,
      description: product.description.slice(0, 160),
      images: product.images[0] ? [{ url: product.images[0] }] : [],
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function avgRating(reviews: { rating: number }[]) {
  if (reviews.length === 0) return 0;
  return reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
}

function StarDisplay({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={
              i < Math.round(rating)
                ? "h-4 w-4 fill-amber-400 text-amber-400"
                : "h-4 w-4 fill-muted text-muted-foreground/30"
            }
          />
        ))}
      </div>
      <span className="text-sm text-muted-foreground">
        {rating.toFixed(1)} ({count} {count === 1 ? "review" : "reviews"})
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// JSON-LD
// ─────────────────────────────────────────────────────────────────────────────
function ProductJsonLd({
  product,
  rating,
  reviewCount,
}: {
  product: {
    title: string;
    description: string;
    images: string[];
    sellingPrice: number;
    slug: string;
  };
  rating: number;
  reviewCount: number;
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    image: product.images,
    offers: {
      "@type": "Offer",
      price: (product.sellingPrice / 100).toFixed(2),
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: `https://dropship.example.com/products/${product.slug}`,
    },
    ...(reviewCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: rating.toFixed(1),
            reviewCount,
          },
        }
      : {}),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────
export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product || !product.isActive) notFound();

  const rating = avgRating(product.reviews);
  const isSale =
    product.compareAtPrice != null && product.compareAtPrice > product.sellingPrice;
  const discount =
    isSale && product.compareAtPrice
      ? Math.round(
          ((product.compareAtPrice - product.sellingPrice) / product.compareAtPrice) * 100
        )
      : 0;

  const primaryImage =
    product.images[0] ?? `https://picsum.photos/seed/${product.id}/800/800`;

  const relatedProducts = await getRelatedProducts(product.categoryId, product.id);

  return (
    <>
      <ProductJsonLd
        product={product}
        rating={rating}
        reviewCount={product.reviews.length}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
            <li>
              <Link href="/" className="hover:text-foreground transition-colors">
                Home
              </Link>
            </li>
            <li aria-hidden="true">
              <ChevronRight className="h-3.5 w-3.5" />
            </li>
            <li>
              <Link
                href={`/products?category=${product.category.slug}`}
                className="hover:text-foreground transition-colors capitalize"
              >
                {product.category.name}
              </Link>
            </li>
            <li aria-hidden="true">
              <ChevronRight className="h-3.5 w-3.5" />
            </li>
            <li className="text-foreground font-medium line-clamp-1 max-w-[200px] sm:max-w-xs">
              {product.title}
            </li>
          </ol>
        </nav>

        {/* Main product area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 xl:gap-16 mb-16">
          {/* LEFT: Image gallery */}
          <ImageGallery
            images={
              product.images.length > 0
                ? product.images
                : [`https://picsum.photos/seed/${product.id}/800/800`]
            }
            title={product.title}
          />

          {/* RIGHT: Product info */}
          <div className="flex flex-col gap-6">
            {/* Title */}
            <div>
              {isSale && (
                <span className="inline-flex items-center rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-semibold text-rose-600 dark:text-rose-400 mb-3">
                  Save {discount}%
                </span>
              )}
              <h1
                className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight tracking-tight"
                style={{ fontFamily: "var(--font-heading), system-ui, sans-serif" }}
              >
                {product.title}
              </h1>
            </div>

            {/* Rating */}
            {product.reviews.length > 0 ? (
              <StarDisplay rating={rating} count={product.reviews.length} />
            ) : (
              <p className="text-sm text-muted-foreground">No reviews yet</p>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span
                className="text-3xl font-extrabold text-foreground"
                style={{ fontFamily: "var(--font-heading), system-ui, sans-serif" }}
              >
                {formatPrice(product.sellingPrice)}
              </span>
              {isSale && product.compareAtPrice && (
                <span className="text-lg text-muted-foreground line-through">
                  {formatPrice(product.compareAtPrice)}
                </span>
              )}
            </div>

            {/* Separator */}
            <div className="border-t border-border" />

            {/* Description */}
            <DescriptionToggle text={product.description} />

            {/* Quantity + Add to Cart */}
            <AddToCartSection product={product} primaryImage={primaryImage} />

            {/* Delivery estimate */}
            <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/50 px-4 py-3.5">
              <Truck className="h-5 w-5 text-[var(--emerald)] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold">Estimated Delivery</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  7–15 business days · Free on orders over $50
                </p>
              </div>
            </div>

            {/* Trust indicators */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: ShieldCheck, label: "Secure Checkout" },
                { icon: RotateCcw, label: "Free Returns" },
                { icon: BadgeCheck, label: "Quality Guarantee" },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-background px-2 py-3 text-center"
                >
                  <Icon className="h-4 w-4 text-[var(--emerald)]" />
                  <span className="text-[11px] font-medium leading-tight text-muted-foreground">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs: Description | Specs | Reviews */}
        <ProductTabs product={product} />

        {/* Related products */}
        {relatedProducts.length > 0 && (
          <section className="mt-20">
            <div className="flex items-end justify-between mb-6">
              <h2
                className="text-2xl font-bold tracking-tight"
                style={{ fontFamily: "var(--font-heading), system-ui, sans-serif" }}
              >
                You Might Also Like
              </h2>
              <Link
                href={`/products?category=${product.category.slug}`}
                className="text-sm font-medium text-[var(--emerald)] hover:underline flex items-center gap-1"
              >
                View all
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <Suspense
              fallback={
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5">
                  {[...Array(4)].map((_, i) => (
                    <ProductCardSkeleton key={i} />
                  ))}
                </div>
              }
            >
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5">
                {relatedProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </Suspense>
          </section>
        )}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Add-to-cart section (server wrapper delegating to client components)
// ─────────────────────────────────────────────────────────────────────────────
function AddToCartSection({
  product,
  primaryImage,
}: {
  product: {
    id: string;
    title: string;
    slug: string;
    sellingPrice: number;
  };
  primaryImage: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <QuantitySelector />
        <AddToCartButton
          product={{
            id: product.id,
            title: product.title,
            slug: product.slug,
            sellingPrice: product.sellingPrice,
            image: primaryImage,
          }}
        />
        <WishlistButton productId={product.id} />
      </div>
    </div>
  );
}
