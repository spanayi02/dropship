import type { Metadata, Viewport } from "next";
// Inter for UI and body, Manrope for headings. Both ship Greek subsets,
// which the bilingual EN/EL storefront needs.
import "@fontsource-variable/inter";
import "@fontsource-variable/manrope";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { SessionProvider } from "@/components/session-provider";
import { I18nProvider } from "@/lib/i18n/client";
import { getLocale } from "@/lib/i18n/server";
import { dictionaries } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const d = dictionaries[locale];
  const url = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return {
    metadataBase: new URL(url),
    title: {
      default: d.meta.title,
      template: "%s | WishlistAZ",
    },
    description: d.meta.description,
    keywords: ["online store", "ecommerce", "EU shipping", "curated products", "wishlist"],
    icons: { icon: "/icon.png" },
    openGraph: {
      type: "website",
      locale: locale === "el" ? "el_GR" : "en_IE",
      url,
      siteName: "WishlistAZ",
      title: d.meta.title,
      description: d.meta.description,
    },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffd500" },
    { media: "(prefers-color-scheme: dark)", color: "#131418" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();

  return (
    <html lang={locale} suppressHydrationWarning className="h-full">
      <body className="min-h-full flex flex-col">
        {/*
          DIRECTION CONTRACT — seed 63676ed7 (impeccable, degraded roll, assigned #6)
          THESIS: A dropshipping store that shows you where the parcel leaves from,
            not a marketplace pretending to be a boutique. Refuses the cream/serif
            "artisanal" default and the white Shopify-Dawn default alike.
          OWN-WORLD: European airport signage. Signal yellow fields (#FFD500),
            black split-flap boards with amber LEDs, white thermal luggage tags with
            a punched eyelet and barcode. Fira Sans (Meta lineage) for UI, Fira Sans
            Condensed/Extra Condensed for boards and display. Square corners
            (2–4px), 1px hairlines, tabular numerals everywhere.
          STORY: "This leaves from a warehouse inside the EU, arrives in 3–6 days,
            and the price on the tag is the price." Visitor scans the board, picks a
            gate (category), reads a tag (product), boards (checkout).
          FIRST VIEWPORT: Full-bleed. Left 40%: yellow sign panel with H1 "Ships
            from inside the EU. No customs. No waiting." + primary CTA "Browse the
            board". Right 60%: black departures board, 6 live product rows
            (item · from · to · ETA · price · status LED), header row with a
            flip-clock time. Mobile: sign stacked above a 4-row board.
          FORM: Departure board / luggage tag world; candidate 6 of 7 on the
            grounded list. Signature interaction: split-flap digits on prices,
            totals and the board clock; tags "drop" into the cart.
          FINISH: unreviewed and undocumented is unfinished; this build ends with
            the finish review, the verdict, DESIGN.md, and every shipping raster
            carrying its provenance.
        */}
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <SessionProvider>
            <I18nProvider locale={locale}>
              {children}
              <Toaster position="bottom-center" />
            </I18nProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
