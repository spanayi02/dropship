import Link from "next/link";
import { ArrowRight } from "lucide-react";

const SHOP_LINKS = [
  { label: "Products", href: "/products" },
  { label: "New Arrivals", href: "/products?sort=newest" },
  { label: "Best Sellers", href: "/products?sort=best-sellers" },
  { label: "Sale", href: "/products?sale=true" },
];

const ACCOUNT_LINKS = [
  { label: "My Account", href: "/account" },
  { label: "Orders", href: "/account/orders" },
  { label: "Wishlist", href: "/account/wishlist" },
  { label: "Login", href: "/login" },
];

const SUPPORT_LINKS = [
  { label: "FAQ", href: "/faq" },
  { label: "Shipping Info", href: "/shipping" },
  { label: "Returns", href: "/returns" },
  { label: "Contact Us", href: "/contact" },
];

const COMPANY_LINKS = [
  { label: "About Us", href: "/about" },
  { label: "Blog", href: "/blog" },
  { label: "Careers", href: "/careers" },
  { label: "Privacy Policy", href: "/privacy" },
];

const PAYMENT_METHODS = ["Visa", "Mastercard", "PayPal", "Stripe", "Amex"];

const SOCIAL_LINKS = [
  {
    label: "Twitter / X",
    href: "https://twitter.com",
    svg: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-4 w-4"
        aria-hidden="true"
      >
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.737-8.858L1.998 2.25H8.072l4.261 5.634 5.91-5.634ZM17.08 19.77h1.833L7.006 4.124H5.033L17.08 19.77Z" />
      </svg>
    ),
  },
  {
    label: "Instagram",
    href: "https://instagram.com",
    svg: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
        aria-hidden="true"
      >
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    ),
  },
  {
    label: "Facebook",
    href: "https://facebook.com",
    svg: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-4 w-4"
        aria-hidden="true"
      >
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
];

interface FooterColumnProps {
  title: string;
  links: { label: string; href: string }[];
}

function FooterColumn({ title, links }: FooterColumnProps) {
  return (
    <div>
      <h3
        className="text-sm font-semibold text-foreground mb-4"
        style={{ fontFamily: "var(--font-plus-jakarta-sans), system-ui, sans-serif" }}
      >
        {title}
      </h3>
      <ul className="space-y-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-muted-foreground hover:text-foreground hover:translate-x-0.5 transition-all duration-200 inline-block"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function StoreFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-muted/30 mt-auto">
      {/* Newsletter banner */}
      <div className="bg-[var(--emerald)]/10 border-b border-[var(--emerald)]/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2
                className="text-xl font-bold text-foreground"
                style={{ fontFamily: "var(--font-plus-jakarta-sans), system-ui, sans-serif" }}
              >
                Stay in the loop
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Get exclusive deals, new arrivals, and updates delivered to your inbox.
              </p>
            </div>
            <form
              action="#"
              className="flex w-full md:w-auto gap-2"
              aria-label="Newsletter signup"
            >
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                required
                className="flex-1 md:w-64 rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:border-[var(--emerald)] focus:ring-2 focus:ring-[var(--emerald)]/20 transition-all"
                aria-label="Email address for newsletter"
              />
              <button
                type="submit"
                className="flex items-center gap-2 rounded-lg bg-[var(--emerald)] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity flex-shrink-0"
              >
                Subscribe
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main footer content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10 lg:gap-8">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-1.5 group mb-4">
              <img src="/wishlistAZ.png" alt="WishlistAZ" className="h-8 w-auto" />
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Discover thousands of quality products at unbeatable prices.
              Fast shipping, hassle-free returns, and exceptional service — every time.
            </p>

            {/* Social links */}
            <div className="flex items-center gap-2 mt-6">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.href}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-[var(--emerald)] hover:text-[var(--emerald)] transition-all duration-200"
                >
                  {social.svg}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          <FooterColumn title="Shop" links={SHOP_LINKS} />
          <FooterColumn title="Account" links={ACCOUNT_LINKS} />
          <FooterColumn title="Support" links={SUPPORT_LINKS} />
          <FooterColumn title="Company" links={COMPANY_LINKS} />
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              &copy; {currentYear} WishlistAZ. All rights reserved.
            </p>

            {/* Payment method badges */}
            <div
              className="flex items-center gap-2 flex-wrap justify-center"
              aria-label="Accepted payment methods"
            >
              {PAYMENT_METHODS.map((method) => (
                <span
                  key={method}
                  className="inline-flex items-center rounded-md border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-muted-foreground"
                >
                  {method}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
