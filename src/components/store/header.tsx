"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Search,
  ShoppingBag,
  Heart,
  Menu,
  X,
  ChevronDown,
  User,
  LogOut,
  Package,
  Settings,
  Home,
  Grid3X3,
} from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";
import { ThemeToggle } from "@/components/store/theme-toggle";
import { Logo } from "@/components/store/logo";
import { LocaleSwitcher } from "@/components/store/locale-switcher";
import { useI18n } from "@/lib/i18n/client";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/store-config";
import { useHydrated } from "@/hooks/use-hydrated";

const CATEGORY_SLUGS = [
  "electronics",
  "fashion-apparel",
  "home-living",
  "sports-outdoors",
  "beauty-health",
] as const;

const CATEGORY_LABELS: Record<string, string> = {
  electronics: "Electronics",
  "fashion-apparel": "Fashion & Apparel",
  "home-living": "Home & Living",
  "sports-outdoors": "Sports & Outdoors",
  "beauty-health": "Beauty & Health",
};

export function StoreHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const { getTotalItems, toggleCart } = useCartStore();
  const { t, intl } = useI18n();

  // The cart is persisted to localStorage, so its count is only known after
  // the client mounts — render 0 until then to match the server-rendered
  // markup and avoid a hydration mismatch.
  const mounted = useHydrated();

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [wishlistCount] = useState(0);
  const [announcementVisible, setAnnouncementVisible] = useState(true);

  const categoryRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLFormElement>(null);

  const cartCount = mounted ? getTotalItems() : 0;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => {
      setMobileOpen(false);
      setCategoryOpen(false);
      setUserMenuOpen(false);
    });
    return () => window.cancelAnimationFrame(id);
  }, [pathname]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(e.target as Node)) {
        setCategoryOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (searchQuery.trim()) {
        router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
        setSearchQuery("");
        setSearchFocused(false);
      }
    },
    [router, searchQuery]
  );

  const freeShipAmount = formatPrice(FREE_SHIPPING_THRESHOLD, undefined, intl);

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-[3px] focus:bg-ink focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-ink-foreground"
      >
        {t("common.skipToContent")}
      </a>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-40 border-b border-border",
          "transition-shadow duration-300",
          scrolled ? "bg-background/95 backdrop-blur-md shadow-sm" : "bg-background"
        )}
      >
        {/* Announcement bar — signal-yellow signage, black board text */}
        {announcementVisible && (
          <div className="relative flex items-center justify-center gap-2 overflow-hidden bg-signal px-10 py-2 text-[13px] font-semibold text-signal-foreground">
            <span className="label-sign tracking-[0.06em]">
              {t("announcement.text", { amount: freeShipAmount })}
            </span>
            <Link href="/products?sale=true" className="font-bold underline underline-offset-2 hover:no-underline">
              {t("announcement.cta")}
            </Link>
            <button
              onClick={() => setAnnouncementVisible(false)}
              aria-label={t("common.close")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 opacity-70 hover:opacity-100 transition-opacity"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center gap-4">
            <Logo className="flex-shrink-0" />

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1 ml-4" aria-label="Main navigation">
              <Link
                href="/products"
                className={cn(
                  "px-3 py-2 text-sm font-semibold rounded-[3px] transition-colors duration-150",
                  pathname === "/products"
                    ? "text-ink bg-signal"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {t("nav.shop")}
              </Link>

              {/* Categories dropdown */}
              <div ref={categoryRef} className="relative">
                <button
                  onClick={() => setCategoryOpen((v) => !v)}
                  className={cn(
                    "flex items-center gap-1 px-3 py-2 text-sm font-semibold rounded-[3px] transition-colors duration-150",
                    categoryOpen
                      ? "text-ink bg-signal"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                  aria-expanded={categoryOpen}
                  aria-haspopup="true"
                >
                  {t("nav.categories")}
                  <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", categoryOpen && "rotate-180")} />
                </button>

                {categoryOpen && (
                  <div className="absolute top-full left-0 mt-1.5 w-56 rounded-[3px] border border-border bg-popover shadow-xl animate-in fade-in-0 slide-in-from-top-1 duration-150 z-50">
                    <div className="p-1.5">
                      {CATEGORY_SLUGS.map((catSlug) => (
                        <Link
                          key={catSlug}
                          href={`/products?category=${catSlug}`}
                          className="flex items-center gap-2 px-3 py-2 text-sm rounded-[3px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        >
                          <Grid3X3 className="h-3.5 w-3.5 flex-shrink-0" />
                          {CATEGORY_LABELS[catSlug]}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </nav>

            {/* Search — center */}
            <form ref={searchRef} onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-sm mx-auto relative items-center">
              <div
                className={cn(
                  "flex w-full items-center gap-2 rounded-[3px] border bg-field px-3 py-2",
                  "transition-colors duration-150",
                  searchFocused ? "border-ink ring-1 ring-ink/15 bg-background" : "border-border hover:border-muted-foreground/40"
                )}
              >
                <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <input
                  type="search"
                  placeholder={t("common.searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  aria-label={t("common.search")}
                />
              </div>
            </form>

            {/* Right Actions */}
            <div className="flex items-center gap-1 ml-auto">
              <LocaleSwitcher className="hidden sm:inline-flex mr-1" />
              <ThemeToggle />

              <Link
                href="/account/wishlist"
                prefetch={false}
                className="relative flex h-9 w-9 items-center justify-center rounded-[3px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label={`${t("common.wishlist")}${wishlistCount > 0 ? `, ${wishlistCount}` : ""}`}
              >
                <Heart className="h-[18px] w-[18px]" />
                {wishlistCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-signal text-[10px] font-bold text-signal-foreground tnum">
                    {wishlistCount > 9 ? "9+" : wishlistCount}
                  </span>
                )}
              </Link>

              <button
                onClick={toggleCart}
                className="relative flex h-9 w-9 items-center justify-center rounded-[3px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label={`${t("common.cart")}${cartCount > 0 ? `, ${cartCount}` : ""}`}
              >
                <ShoppingBag className="h-[18px] w-[18px]" />
                {cartCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-signal text-[10px] font-bold text-signal-foreground tnum">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </button>

              {/* User menu */}
              <div ref={userMenuRef} className="relative hidden md:block">
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex h-9 w-9 items-center justify-center rounded-[3px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors overflow-hidden"
                  aria-label={t("common.account")}
                  aria-expanded={userMenuOpen}
                  aria-haspopup="true"
                >
                  {session?.user?.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={session.user.image} alt="" className="h-full w-full object-cover rounded-[3px]" />
                  ) : (
                    <User className="h-[18px] w-[18px]" />
                  )}
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-56 rounded-[3px] border border-border bg-popover shadow-xl animate-in fade-in-0 slide-in-from-top-1 duration-150 z-50">
                    {session ? (
                      <>
                        <div className="px-3 py-3 border-b border-border">
                          <p className="text-sm font-semibold truncate">{session.user?.name ?? "User"}</p>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{session.user?.email}</p>
                        </div>
                        <div className="p-1.5">
                          <Link href="/account" className="flex items-center gap-2 px-3 py-2 text-sm rounded-[3px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                            <Settings className="h-3.5 w-3.5" />
                            {t("nav.myAccount")}
                          </Link>
                          <Link href="/account/orders" className="flex items-center gap-2 px-3 py-2 text-sm rounded-[3px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                            <Package className="h-3.5 w-3.5" />
                            {t("nav.orders")}
                          </Link>
                          {session.user?.role === "ADMIN" && (
                            <Link href="/admin" className="flex items-center gap-2 px-3 py-2 text-sm rounded-[3px] text-ink bg-signal/40 hover:bg-signal/60 transition-colors font-semibold">
                              <Grid3X3 className="h-3.5 w-3.5" />
                              {t("nav.admin")}
                            </Link>
                          )}
                        </div>
                        <div className="p-1.5 border-t border-border">
                          <button
                            onClick={() => signOut({ callbackUrl: "/" })}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm rounded-[3px] text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <LogOut className="h-3.5 w-3.5" />
                            {t("common.signOut")}
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="p-1.5">
                        <Link href="/login" className="flex items-center gap-2 px-3 py-2 text-sm rounded-[3px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                          <User className="h-3.5 w-3.5" />
                          {t("common.signIn")}
                        </Link>
                        <Link href="/register" className="flex items-center justify-center gap-2 px-3 py-2 mt-1 text-sm rounded-[3px] font-semibold bg-signal text-signal-foreground hover:bg-signal-deep transition-colors">
                          {t("common.createAccount")}
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={() => setMobileOpen((v) => !v)}
                className="flex md:hidden h-9 w-9 items-center justify-center rounded-[3px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label={mobileOpen ? t("common.close") : t("common.menu")}
                aria-expanded={mobileOpen}
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          className={cn(
            "md:hidden border-t border-border bg-background overflow-hidden",
            "transition-all duration-300 ease-in-out",
            mobileOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
          )}
          aria-hidden={!mobileOpen}
        >
          <div className="mx-auto max-w-7xl px-4 pb-4 pt-3 space-y-4">
            <form onSubmit={handleSearch} className="relative">
              <div className="flex items-center gap-2 rounded-[3px] border border-border bg-field px-3 py-2.5">
                <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <input
                  type="search"
                  placeholder={t("common.searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  aria-label={t("common.search")}
                />
              </div>
            </form>

            <nav className="space-y-1" aria-label="Mobile navigation">
              <Link
                href="/"
                className={cn(
                  "flex items-center gap-3 rounded-[3px] px-3 py-2.5 text-sm font-medium transition-colors",
                  pathname === "/" ? "text-ink bg-signal" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Home className="h-4 w-4" />
                {t("nav.home")}
              </Link>
              <Link
                href="/products"
                className={cn(
                  "flex items-center gap-3 rounded-[3px] px-3 py-2.5 text-sm font-medium transition-colors",
                  pathname === "/products" ? "text-ink bg-signal" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Grid3X3 className="h-4 w-4" />
                {t("nav.shop")}
              </Link>

              <div>
                <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("nav.categories")}
                </p>
                {CATEGORY_SLUGS.map((catSlug) => (
                  <Link
                    key={catSlug}
                    href={`/products?category=${catSlug}`}
                    className="flex items-center gap-3 rounded-[3px] px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-signal-deep flex-shrink-0" />
                    {CATEGORY_LABELS[catSlug]}
                  </Link>
                ))}
              </div>
            </nav>

            <div className="flex items-center justify-between border-t border-border pt-3">
              <span className="text-xs font-semibold text-muted-foreground">{t("common.language")}</span>
              <LocaleSwitcher />
            </div>

            <div className="border-t border-border pt-3 space-y-1">
              {session ? (
                <>
                  <div className="px-3 py-2 mb-1">
                    <p className="text-sm font-semibold">{session.user?.name}</p>
                    <p className="text-xs text-muted-foreground">{session.user?.email}</p>
                  </div>
                  <Link href="/account" className="flex items-center gap-3 rounded-[3px] px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                    <Settings className="h-4 w-4" />
                    {t("nav.myAccount")}
                  </Link>
                  <Link href="/account/orders" className="flex items-center gap-3 rounded-[3px] px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                    <Package className="h-4 w-4" />
                    {t("nav.orders")}
                  </Link>
                  {session.user?.role === "ADMIN" && (
                    <Link href="/admin" className="flex items-center gap-3 rounded-[3px] px-3 py-2.5 text-sm text-ink bg-signal/40 transition-colors font-semibold">
                      <Grid3X3 className="h-4 w-4" />
                      {t("nav.admin")}
                    </Link>
                  )}
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="flex w-full items-center gap-3 rounded-[3px] px-3 py-2.5 text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    {t("common.signOut")}
                  </button>
                </>
              ) : (
                <div className="flex gap-2">
                  <Link href="/login" className="flex-1 text-center rounded-[3px] border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors">
                    {t("common.signIn")}
                  </Link>
                  <Link href="/register" className="flex-1 text-center rounded-[3px] bg-signal text-signal-foreground px-4 py-2.5 text-sm font-semibold hover:bg-signal-deep transition-colors">
                    {t("common.createAccount")}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Spacer to offset fixed header */}
      <div className={cn("transition-all duration-300", announcementVisible ? "h-[100px]" : "h-16")} aria-hidden="true" />
    </>
  );
}
