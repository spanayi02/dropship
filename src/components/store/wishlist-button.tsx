"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface WishlistButtonProps {
  productId: string;
  initialWishlisted?: boolean;
  className?: string;
}

export function WishlistButton({
  productId: _productId,
  initialWishlisted = false,
  className,
}: WishlistButtonProps) {
  const [wishlisted, setWishlisted] = useState(initialWishlisted);

  function toggle() {
    setWishlisted((v) => !v);
    // TODO: wire to server action / API
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={wishlisted}
      className={cn(
        "flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-border transition-all duration-200",
        wishlisted
          ? "bg-rose-50 border-rose-200 text-rose-500 dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-400 scale-105"
          : "bg-background text-muted-foreground hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/20",
        className
      )}
    >
      <Heart
        className={cn("h-5 w-5 transition-all duration-200", wishlisted && "fill-current")}
      />
    </button>
  );
}
