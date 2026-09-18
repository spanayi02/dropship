"use client";

import { motion, AnimatePresence } from "framer-motion";
import NumberFlow from "@number-flow/react";
import { useCartStore } from "@/store/cart-store";
import { cn } from "@/lib/utils";
import { STORE_CURRENCY } from "@/lib/store-config";
import { useI18n } from "@/lib/i18n/client";
import { useHydrated } from "@/hooks/use-hydrated";
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

function AnimatedPrice({ cents, locale, className }: { cents: number; locale: string; className?: string }) {
  return (
    <NumberFlow
      value={cents / 100}
      locales={locale}
      format={{ style: "currency", currency: STORE_CURRENCY }}
      className={className}
    />
  );
}

export function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, getTotalPrice } =
    useCartStore();
  const { t, intl } = useI18n();

  // items is persisted to localStorage — only trust it after the client has
  // mounted, so the first render matches the server (empty cart) and React
  // doesn't report a hydration mismatch.
  const mounted = useHydrated();

  const cartItems = mounted ? items : [];
  const totalPrice = mounted ? getTotalPrice() : 0;
  const hasItems = cartItems.length > 0;
  const itemCount = cartItems.reduce((s, i) => s + i.quantity, 0);

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
        aria-label={t("cart.title")}
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
            <ShoppingBag className="h-5 w-5 text-ink dark:text-signal" />
            <h2 className="font-board text-lg font-bold uppercase">
              {t("cart.title")}
            </h2>
            {hasItems && (
              <span className="flex h-5 w-5 items-center justify-center rounded-[2px] bg-signal text-[10px] font-bold text-signal-foreground tnum">
                {itemCount}
              </span>
            )}
          </div>
          <button
            onClick={closeCart}
            className="flex h-8 w-8 items-center justify-center rounded-[3px] text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label={t("common.close")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {!hasItems ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center h-full gap-4 px-6 py-16 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-[4px] bg-muted">
                <ShoppingCart className="h-10 w-10 text-muted-foreground" />
              </div>
              <div>
                <p className="font-board text-lg font-bold uppercase">{t("cart.empty")}</p>
                <p className="mt-1 text-sm text-muted-foreground">{t("cart.emptyText")}</p>
              </div>
              <Link
                href="/products"
                onClick={closeCart}
                className={cn(
                  "mt-2 inline-flex items-center gap-2 rounded-[3px] px-6 py-2.5",
                  "bg-signal text-signal-foreground font-bold text-sm",
                  "hover:bg-signal-deep transition-colors"
                )}
              >
                {t("cart.startShopping")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            /* Cart items */
            <ul className="divide-y divide-border">
              <AnimatePresence initial={false} mode="popLayout">
                {cartItems.map((item) => (
                  <motion.li
                    key={item.id}
                    layout
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex gap-4 overflow-hidden px-6 py-4"
                  >
                    {/* Image */}
                    <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-[3px] bg-muted">
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
                          className="text-sm font-medium leading-tight hover:text-ink dark:hover:text-signal transition-colors line-clamp-2"
                        >
                          {item.title}
                        </Link>
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => removeItem(item.productId)}
                          className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-[2px] text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          aria-label={t("cart.remove", { title: item.title })}
                        >
                          <X className="h-3.5 w-3.5" />
                        </motion.button>
                      </div>

                      <div className="flex items-center justify-between">
                        {/* Quantity controls */}
                        <div className="flex items-center rounded-[3px] border border-border overflow-hidden">
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() =>
                              updateQuantity(item.productId, item.quantity - 1)
                            }
                            className="flex h-7 w-7 items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            aria-label={t("cart.decrease")}
                          >
                            <Minus className="h-3 w-3" />
                          </motion.button>
                          <span className="flex h-7 w-8 items-center justify-center text-sm font-medium border-x border-border tnum">
                            <NumberFlow value={item.quantity} />
                          </span>
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() =>
                              updateQuantity(item.productId, item.quantity + 1)
                            }
                            className="flex h-7 w-7 items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            aria-label={t("cart.increase")}
                          >
                            <Plus className="h-3 w-3" />
                          </motion.button>
                        </div>

                        {/* Price */}
                        <AnimatedPrice
                          cents={item.price * item.quantity}
                          locale={intl}
                          className="text-sm font-semibold text-ink dark:text-signal tnum"
                        />
                      </div>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </div>

        {/* Footer */}
        {hasItems && (
          <div className="border-t border-border px-6 py-5 space-y-4">
            {/* Subtotal */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t("cart.subtotal")}</span>
              <AnimatedPrice
                cents={totalPrice}
                locale={intl}
                className="text-lg font-semibold tnum"
              />
            </div>
            <p className="text-xs text-muted-foreground">{t("cart.shippingNote")}</p>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <Link
                href="/checkout"
                onClick={closeCart}
                className={cn(
                  "flex w-full items-center justify-center gap-2 rounded-[3px] px-6 py-3",
                  "bg-signal text-signal-foreground font-bold text-sm",
                  "hover:bg-signal-deep transition-colors"
                )}
              >
                {t("cart.checkout")}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <button
                onClick={closeCart}
                className={cn(
                  "flex w-full items-center justify-center rounded-[3px] px-6 py-2.5",
                  "border border-border text-sm font-medium",
                  "hover:bg-muted transition-colors"
                )}
              >
                {t("cart.continue")}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
