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
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";
import { ThemeToggle } from "@/components/store/theme-toggle";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Products", href: "/products" },
];

const CATEGORIES = [
  { label: "Electronics", href: "/products?category=electronics" },
  { label: "Clothing", href: "/products?category=clothing" },
  { label: "Home & Garden", href: "/products?category=home-garden" },
  { label: "Sports", href: "/products?category=sports" },
  { label: "Beauty", href: "/products?category=beauty" },
  { label: "Toys", href: "/products?category=toys" },
];

export function StoreHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const { getTotalItems, openCart, toggleCart } = useCartStore();

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [wishlistCount] = useState(0);

  const categoryRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLFormElement>(null);

  const cartCount = getTotalItems();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setCategoryOpen(false);
    setUserMenuOpen(false);
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

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-40",
          "transition-all duration-300",
          scrolled
            ? "bg-background/80 backdrop-blur-xl border-b border-border shadow-sm"
            : "bg-background border-b border-transparent"
        )}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center gap-4">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-1.5 flex-shrink-0 group"
              aria-label="DropShip home"
            >
              <span
                className="text-xl font-extrabold tracking-tight text-foreground group-hover:text-[var(--emerald)] transition-colors duration-200"
                style={{ fontFamily: "var(--font-plus-jakarta-sans), system-ui, sans-serif" }}
              >
                DropShip
              </span>
              <span
                className="h-2 w-2 rounded-full bg-[var(--emerald)] group-hover:scale-125 transition-transform duration-200"
                aria-hidden="true"
              />
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1 ml-4" aria-label="Main navigation">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200",
                    pathname === link.href
                      ? "text-[var(--emerald)] bg-[var(--emerald)]/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {link.label}
                </Link>
              ))}

              {/* Categories dropdown */}
              <div ref={categoryRef} className="relative">
                <button
                  onClick={() => setCategoryOpen((v) => !v)}
                  className={cn(
                    "flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200",
                    categoryOpen
                      ? "text-[var(--emerald)] bg-[var(--emerald)]/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                  aria-expanded={categoryOpen}
                  aria-haspopup="true"
                >
                  Categories
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 transition-transform duration-200",
                      categoryOpen && "rotate-180"
                    )}
                  />
                </button>

                {categoryOpen && (
                  <div className="absolute top-full left-0 mt-1.5 w-52 rounded-xl border border-border bg-popover shadow-xl ring-1 ring-black/5 dark:ring-white/5 animate-in fade-in-0 slide-in-from-top-2 duration-150 z-50">
                    <div className="p-1.5">
                      {CATEGORIES.map((cat) => (
                        <Link
                          key={cat.href}
                          href={cat.href}
                          className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        >
                          <Grid3X3 className="h-3.5 w-3.5 flex-shrink-0" />
                          {cat.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </nav>

            {/* Search — center */}
            <form
              ref={searchRef}
              onSubmit={handleSearch}
              className={cn(
                "hidden md:flex flex-1 max-w-sm mx-auto",
                "relative items-center"
              )}
            >
              <div
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2",
                  "transition-all duration-200",
                  searchFocused
                    ? "border-[var(--emerald)] bg-background ring-2 ring-[var(--emerald)]/20"
                    : "border-border hover:border-muted-foreground/40"
                )}
              >
                <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <input
                  type="search"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  aria-label="Search products"
                />
              </div>
            </form>

            {/* Right Actions */}
            <div className="flex items-center gap-1 ml-auto">
              <ThemeToggle />

              {/* Wishlist */}
              <Link
                href="/account/wishlist"
                className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label={`Wishlist${wishlistCount > 0 ? `, ${wishlistCount} items` : ""}`}
              >
                <Heart className="h-4.5 w-4.5 h-[18px] w-[18px]" />
                {wishlistCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--emerald)] text-[10px] font-bold text-white">
                    {wishlistCount > 9 ? "9+" : wishlistCount}
                  </span>
                )}
              </Link>

              {/* Cart */}
              <button
                onClick={toggleCart}
                className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label={`Cart${cartCount > 0 ? `, ${cartCount} items` : ""}`}
              >
                <ShoppingBag className="h-[18px] w-[18px]" />
                {cartCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--emerald)] text-[10px] font-bold text-white">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </button>

              {/* User menu */}
              <div ref={userMenuRef} className="relative hidden md:block">
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors overflow-hidden"
                  aria-label="User menu"
                  aria-expanded={userMenuOpen}
                  aria-haspopup="true"
                >
                  {session?.user?.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={session.user.image}
                      alt={session.user.name ?? "User avatar"}
                      className="h-full w-full object-cover rounded-lg"
                    />
                  ) : (
                    <User className="h-[18px] w-[18px]" />
                  )}
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-52 rounded-xl border border-border bg-popover shadow-xl ring-1 ring-black/5 dark:ring-white/5 animate-in fade-in-0 slide-in-from-top-2 duration-150 z-50">
                    {session ? (
                      <>
                        <div className="px-3 py-3 border-b border-border">
                          <p className="text-sm font-semibold truncate">
                            {session.user?.name ?? "User"}
                          </p>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {session.user?.email}
                          </p>
                        </div>
                        <div className="p-1.5">
                          <Link
                            href="/account"
                            className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          >
                            <Settings className="h-3.5 w-3.5" />
                            My Account
                          </Link>
                          <Link
                            href="/account/orders"
                            className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          >
                            <Package className="h-3.5 w-3.5" />
                            Orders
                          </Link>
                        </div>
                        <div className="p-1.5 border-t border-border">
                          <button
                            onClick={() => signOut({ callbackUrl: "/" })}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <LogOut className="h-3.5 w-3.5" />
                            Sign Out
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="p-1.5">
                        <Link
                          href="/login"
                          className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        >
                          <User className="h-3.5 w-3.5" />
                          Sign In
                        </Link>
                        <Link
                          href="/register"
                          className="flex items-center justify-center gap-2 px-3 py-2 mt-1 text-sm rounded-lg font-medium bg-[var(--emerald)] text-white hover:opacity-90 transition-opacity"
                        >
                          Create Account
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileOpen((v) => !v)}
                className="flex md:hidden h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileOpen}
              >
                {mobileOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          className={cn(
            "md:hidden border-t border-border bg-background/95 backdrop-blur-xl overflow-hidden",
            "transition-all duration-300 ease-in-out",
            mobileOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
          )}
          aria-hidden={!mobileOpen}
        >
          <div className="mx-auto max-w-7xl px-4 pb-4 pt-3 space-y-4">
            {/* Mobile search */}
            <form onSubmit={handleSearch} className="relative">
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2.5">
                <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <input
                  type="search"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  aria-label="Search products"
                />
              </div>
            </form>

            {/* Mobile nav links */}
            <nav className="space-y-1" aria-label="Mobile navigation">
              <Link
                href="/"
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  pathname === "/"
                    ? "text-[var(--emerald)] bg-[var(--emerald)]/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Home className="h-4 w-4" />
                Home
              </Link>
              <Link
                href="/products"
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  pathname === "/products"
                    ? "text-[var(--emerald)] bg-[var(--emerald)]/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Grid3X3 className="h-4 w-4" />
                Products
              </Link>

              {/* Categories in mobile */}
              <div>
                <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Categories
                </p>
                {CATEGORIES.map((cat) => (
                  <Link
                    key={cat.href}
                    href={cat.href}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--emerald)] flex-shrink-0" />
                    {cat.label}
                  </Link>
                ))}
              </div>
            </nav>

            {/* Mobile user actions */}
            <div className="border-t border-border pt-3 space-y-1">
              {session ? (
                <>
                  <div className="px-3 py-2 mb-1">
                    <p className="text-sm font-semibold">{session.user?.name}</p>
                    <p className="text-xs text-muted-foreground">{session.user?.email}</p>
                  </div>
                  <Link
                    href="/account"
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                    My Account
                  </Link>
                  <Link
                    href="/account/orders"
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <Package className="h-4 w-4" />
                    Orders
                  </Link>
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </>
              ) : (
                <div className="flex gap-2">
                  <Link
                    href="/login"
                    className="flex-1 text-center rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="flex-1 text-center rounded-lg bg-[var(--emerald)] text-white px-4 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Spacer to offset fixed header */}
      <div className="h-16" aria-hidden="true" />
    </>
  );
}
