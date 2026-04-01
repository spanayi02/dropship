import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { RemoveWishlistButton } from "./remove-wishlist-button";

export const dynamic = 'force-dynamic';

export default async function WishlistPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const wishlistItems = await db.wishlistItem.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      product: {
        select: {
          id: true,
          title: true,
          slug: true,
          sellingPrice: true,
          compareAtPrice: true,
          images: true,
          isActive: true,
        },
      },
    },
  });

  if (wishlistItems.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold">Wishlist</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Products you&apos;ve saved for later.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h2 className="text-base font-semibold">Your wishlist is empty</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Save products you love to find them easily later.
          </p>
          <Link href="/products">
            <Button className="mt-6">Start browsing</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Wishlist</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {wishlistItems.length} saved item{wishlistItems.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {wishlistItems.map(({ product, id: wishlistId }) => (
          <div
            key={wishlistId}
            className="group rounded-xl border border-border bg-card overflow-hidden hover:shadow-sm transition-shadow"
          >
            <Link href={`/products/${product.slug}`} className="block">
              <div className="relative aspect-square overflow-hidden bg-muted">
                {product.images[0] ? (
                  <Image
                    src={product.images[0]}
                    alt={product.title}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                    <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                {!product.isActive && (
                  <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                    <span className="text-sm font-medium text-muted-foreground">Unavailable</span>
                  </div>
                )}
              </div>
            </Link>

            <div className="p-4 space-y-3">
              <Link href={`/products/${product.slug}`}>
                <h2 className="text-sm font-medium line-clamp-2 hover:underline underline-offset-4">
                  {product.title}
                </h2>
              </Link>

              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold tabular-nums">
                  {formatPrice(product.sellingPrice)}
                </span>
                {product.compareAtPrice && product.compareAtPrice > product.sellingPrice && (
                  <span className="text-xs text-muted-foreground line-through tabular-nums">
                    {formatPrice(product.compareAtPrice)}
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <Link href={`/products/${product.slug}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">View</Button>
                </Link>
                <RemoveWishlistButton productId={product.id} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
