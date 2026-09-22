import Link from "next/link";
import { Logo } from "@/components/store/logo";
import { CookieSettingsButton } from "@/components/store/cookie-consent";
import { getT } from "@/lib/i18n/server";
import type { TFunction } from "@/lib/i18n";

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

function buildColumns(t: TFunction) {
  return [
    {
      title: t("nav.shop"),
      links: [
        { label: t("products.title"), href: "/products" },
        { label: t("nav.newArrivals"), href: "/products?sort=newest" },
        { label: t("nav.bestSellers"), href: "/products?sort=best-sellers" },
        { label: t("common.sale"), href: "/products?sale=true" },
      ],
    },
    {
      title: t("account.title"),
      links: [
        { label: t("nav.myAccount"), href: "/account", prefetch: false },
        { label: t("nav.orders"), href: "/account/orders", prefetch: false },
        { label: t("common.wishlist"), href: "/account/wishlist", prefetch: false },
        { label: t("common.signIn"), href: "/login" },
      ],
    },
    {
      title: t("footer.help"),
      links: [
        { label: t("footer.faq"), href: "/faq" },
        { label: t("footer.shippingInfo"), href: "/shipping" },
        { label: t("footer.returns"), href: "/returns" },
        { label: t("footer.contact"), href: "/contact" },
      ],
    },
    {
      title: t("footer.company"),
      links: [
        { label: t("footer.aboutUs"), href: "/about" },
        { label: t("footer.privacy"), href: "/privacy" },
        { label: t("footer.terms"), href: "/terms" },
        { label: t("footer.cookies"), href: "/cookies" },
      ],
    },
  ];
}

interface FooterColumnProps {
  title: string;
  links: { label: string; href: string; prefetch?: boolean }[];
}

function FooterColumn({ title, links }: FooterColumnProps) {
  return (
    <div>
      <h3 className="mb-4 text-sm font-semibold text-foreground">{title}</h3>
      <ul className="space-y-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              prefetch={link.prefetch}
              className="inline-block text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export async function StoreFooter() {
  const { t } = await getT();
  const currentYear = new Date().getFullYear();
  const columns = buildColumns(t);

  return (
    <footer className="mt-auto border-t border-hairline bg-canvas-soft">
      {/* Main footer content */}
      <div className="container-store py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10 lg:gap-8">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <Logo className="mb-4" />
            <p className="text-sm font-medium text-foreground">{t("footer.tagline")}</p>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
              {t("footer.about")}
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
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-hairline text-muted-foreground transition-colors duration-150 hover:border-border-strong hover:text-foreground"
                >
                  {social.svg}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <FooterColumn key={col.title} title={col.title} links={col.links} />
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-hairline">
        <div className="container-store py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-col items-center sm:items-start gap-0.5">
              <p className="text-xs text-muted-foreground">
                {t("footer.rights", { year: currentYear })}
              </p>
              <p className="text-xs text-muted-foreground">{t("footer.basedIn")}</p>
              <CookieSettingsButton className="mt-1 text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground" />
            </div>

            {/* Payment method badges */}
            <div
              className="flex items-center gap-2 flex-wrap justify-center"
              aria-label={t("footer.payments")}
            >
              {PAYMENT_METHODS.map((method) => (
                <span
                  key={method}
                  className="inline-flex items-center rounded-md border border-hairline bg-background px-2.5 py-1 text-[11px] font-medium text-muted-foreground"
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
