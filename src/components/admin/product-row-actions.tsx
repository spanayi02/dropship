"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteProduct, toggleProductActive } from "@/app/actions/products";

interface ProductRowActionsProps {
  productId: string;
  isActive: boolean;
}

export function ProductRowActions({ productId, isActive }: ProductRowActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      const result = await toggleProductActive(productId);
      if (result.success) {
        toast.success(result.isActive ? "Product activated." : "Product deactivated.");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to update product.");
      }
    });
  }

  function handleDelete() {
    if (!confirm("Are you sure you want to deactivate this product?")) return;
    startTransition(async () => {
      const result = await deleteProduct(productId);
      if (result.success) {
        toast.success("Product deactivated.");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to delete product.");
      }
    });
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <Link href={`/admin/products/${productId}`}>
        <Button variant="ghost" size="icon-sm" aria-label="Edit product" disabled={isPending}>
          <Pencil className="size-3.5" />
        </Button>
      </Link>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={isActive ? "Deactivate product" : "Activate product"}
        onClick={handleToggle}
        disabled={isPending}
      >
        {isActive ? (
          <ToggleRight className="size-3.5 text-emerald-600" />
        ) : (
          <ToggleLeft className="size-3.5 text-muted-foreground" />
        )}
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Delete product"
        onClick={handleDelete}
        disabled={isPending}
      >
        <Trash2 className="size-3.5 text-destructive" />
      </Button>
    </div>
  );
}
