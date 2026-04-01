"use client";

import { useCartStore } from "@/store/cart-store";
import { formatPrice, cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import {
  ShoppingBag,
  X,
  Plus,
  Minus,
  ArrowRight,
  ShoppingCart,
} from "lucide-react";

export function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, getTotalPrice } =
    useCartStore();

  const totalPrice = getTotalPrice();
  const hasItems = items.length > 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm",
          "transition-opacity duration-300",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        className={cn(
          "fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col",
          "bg-background shadow-2xl",
          "transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-[var(--emerald)]" />
            <h2
              className="text-lg font-semibold"
              style={{ fontFamily: "var(--font-plus-jakarta-sans), system-ui, sans-serif" }}
            >
              Shopping Cart
            </h2>
            {hasItems && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--emerald)] text-[10px] font-bold text-white">
                {items.reduce((s, i) => s + i.quantity, 0)}
              </span>
            )}
          </div>
          <button
            onClick={closeCart}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Close cart"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {!hasItems ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center h-full gap-4 px-6 py-16 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                <ShoppingCart className="h-10 w-10 text-muted-foreground" />
              </div>
              <div>
                <p
                  className="text-lg font-semibold"
                  style={{ fontFamily: "var(--font-plus-jakarta-sans), system-ui, sans-serif" }}
                >
                  Your cart is empty
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Looks like you haven&apos;t added anything yet.
                </p>
              </div>
              <Link
                href="/products"
                onClick={closeCart}
                className={cn(
                  "mt-2 inline-flex items-center gap-2 rounded-lg px-6 py-2.5",
                  "bg-[var(--emerald)] text-white font-medium text-sm",
                  "hover:opacity-90 transition-opacity"
                )}
              >
                Start Shopping
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            /* Cart items */
            <ul className="divide-y divide-border">
              {items.map((item) => (
                <li key={item.id} className="flex gap-4 px-6 py-4">
                  {/* Image */}
                  <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <ShoppingBag className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex flex-1 flex-col gap-2 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/products/${item.slug}`}
                        onClick={closeCart}
                        className="text-sm font-medium leading-tight hover:text-[var(--emerald)] transition-colors line-clamp-2"
                      >
                        {item.title}
                      </Link>
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        aria-label={`Remove ${item.title}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      {/* Quantity controls */}
                      <div className="flex items-center rounded-lg border border-border overflow-hidden">
                        <button
                          onClick={() =>
                            updateQuantity(item.productId, item.quantity - 1)
                          }
                          className="flex h-7 w-7 items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="flex h-7 w-8 items-center justify-center text-sm font-medium border-x border-border">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.productId, item.quantity + 1)
                          }
                          className="flex h-7 w-7 items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      {/* Price */}
                      <span className="text-sm font-semibold text-[var(--emerald)]">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {hasItems && (
          <div className="border-t border-border px-6 py-5 space-y-4">
            {/* Subtotal */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Subtotal</span>
              <span
                className="text-lg font-semibold"
                style={{ fontFamily: "var(--font-plus-jakarta-sans), system-ui, sans-serif" }}
              >
                {formatPrice(totalPrice)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Shipping and taxes calculated at checkout.
            </p>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <Link
                href="/checkout"
                onClick={closeCart}
                className={cn(
                  "flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3",
                  "bg-[var(--emerald)] text-white font-semibold text-sm",
                  "hover:opacity-90 transition-opacity"
                )}
              >
                Proceed to Checkout
                <ArrowRight className="h-4 w-4" />
              </Link>
              <button
                onClick={closeCart}
                className={cn(
                  "flex w-full items-center justify-center rounded-lg px-6 py-2.5",
                  "border border-border text-sm font-medium",
                  "hover:bg-muted transition-colors"
                )}
              >
                Continue Shopping
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
