"use client";

import { useState } from "react";
import { ShoppingCart, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";
import { useI18n } from "@/lib/i18n/client";

interface AddToCartButtonProps {
  product: {
    id: string;
    title: string;
    slug: string;
    sellingPrice: number;
    image: string;
  };
  quantity?: number;
  className?: string;
}

export function AddToCartButton({
  product,
  quantity = 1,
  className,
}: AddToCartButtonProps) {
  const { addItem, openCart } = useCartStore();
  const { t } = useI18n();
  const [state, setState] = useState<"idle" | "loading" | "success">("idle");

  async function handleClick() {
    if (state !== "idle") return;
    setState("loading");
    // Simulate async tick so animation is visible
    await new Promise((r) => setTimeout(r, 400));
    addItem({
      id: crypto.randomUUID(),
      productId: product.id,
      title: product.title,
      price: product.sellingPrice,
      image: product.image,
      slug: product.slug,
      quantity,
    });
    setState("success");
    openCart();
    setTimeout(() => setState("idle"), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={state === "loading"}
      aria-label={
        state === "success" ? t("product.addedToCart") : t("product.addToCart")
      }
      className={cn(
        "flex flex-1 items-center justify-center gap-2 rounded-lg px-6 h-11 text-sm font-bold transition-all duration-300",
        state === "success"
          ? "bg-go text-white scale-[1.02]"
          : state === "loading"
          ? "bg-primary/70 text-primary-foreground cursor-wait"
          : "bg-primary text-primary-foreground hover:bg-primary/90",
        className
      )}
    >
      {state === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
      {state === "success" && <Check className="h-4 w-4" />}
      {state === "idle" && <ShoppingCart className="h-4 w-4" />}
      {state === "loading"
        ? t("product.adding")
        : state === "success"
        ? t("product.addedToCart")
        : t("product.addToCart")}
    </button>
  );
}
