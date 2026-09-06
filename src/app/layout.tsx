import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { SessionProvider } from "@/components/session-provider";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: {
    default: "WishlistAZ — the shortlist for things worth buying",
    template: "%s | WishlistAZ",
  },
  description:
    "A tight, hand-picked catalog across electronics, home, fashion, sports, and beauty — vetted suppliers, fair markups, and shipping you can actually track.",
  keywords: ["online store", "ecommerce", "curated deals", "wishlist"],
  icons: {
    icon: "/icon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: "WishlistAZ",
    title: "WishlistAZ — the shortlist for things worth buying",
    description:
      "A tight, hand-picked catalog across electronics, home, fashion, sports, and beauty.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${archivo.variable} h-full`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <SessionProvider>
            {children}
            <Toaster richColors position="top-right" />
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
