"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { removeFromWishlist } from "@/app/actions/account";

interface RemoveWishlistButtonProps {
  productId: string;
}

export function RemoveWishlistButton({ productId }: RemoveWishlistButtonProps) {
  const [isPending, startTransition] = useTransition();

  function handleRemove() {
    startTransition(async () => {
      const result = await removeFromWishlist(productId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Removed from wishlist");
      }
    });
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleRemove}
      disabled={isPending}
      aria-label="Remove from wishlist"
      className="text-destructive hover:text-destructive hover:bg-destructive/10"
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
    </Button>
  );
}
