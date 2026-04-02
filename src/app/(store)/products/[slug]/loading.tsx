import { Skeleton } from "@/components/ui/skeleton";

export default function ProductLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
        {/* Left: image skeleton */}
        <div className="space-y-3">
          <Skeleton className="aspect-square w-full rounded-2xl" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square w-16 rounded-lg" />
            ))}
          </div>
        </div>

        {/* Right: product details skeleton */}
        <div className="space-y-5">
          {/* Title */}
          <div className="space-y-2">
            <Skeleton className="h-7 w-full" />
            <Skeleton className="h-7 w-4/5" />
          </div>

          {/* Stars */}
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-4 rounded-sm" />
              ))}
            </div>
            <Skeleton className="h-4 w-16" />
          </div>

          {/* Price */}
          <Skeleton className="h-9 w-28" />

          {/* Description lines */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>

          {/* Quantity + button */}
          <div className="flex gap-3 pt-2">
            <Skeleton className="h-11 w-24 rounded-xl" />
            <Skeleton className="h-11 flex-1 rounded-xl" />
          </div>

          {/* Wishlist link */}
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    </div>
  );
}
