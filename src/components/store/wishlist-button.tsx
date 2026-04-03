"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { addToWishlist, removeFromWishlist } from "@/app/actions/account";

interface WishlistButtonProps {
  productId: string;
  initialWishlisted?: boolean;
  className?: string;
}

export function WishlistButton({
  productId,
  initialWishlisted = false,
  className,
}: WishlistButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [wishlisted, setWishlisted] = useState(initialWishlisted);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    if (!session?.user) {
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    const next = !wishlisted;
    setWishlisted(next); // optimistic

    startTransition(async () => {
      const result = next
        ? await addToWishlist(productId)
        : await removeFromWishlist(productId);

      if (result.error) {
        setWishlisted(!next); // revert
        if ("requiresAuth" in result && result.requiresAuth) {
          router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
        } else {
          toast.error(result.error);
        }
      } else {
        toast.success(next ? "Added to wishlist" : "Removed from wishlist");
      }
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isPending}
      aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={wishlisted}
      className={cn(
        "flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-border transition-all duration-200 disabled:opacity-60",
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
