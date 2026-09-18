# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: EU consumers (Cyprus first, then wider EU) shopping for everyday upgrades — electronics accessories, home, fashion basics, sports, beauty — who are tired of marketplace noise (thousands of near-identical listings, fake "was" prices, 30-day shipping from unknown sellers). They arrive from social/search on mobile, want to decide fast, and want shipping they can trust.

Secondary: the store owner (Stylianos) operating the admin — importing products from suppliers, setting markups, watching orders flow to suppliers, handling exceptions.

## Product Purpose

WishlistAZ is a curated dropshipping store: a short, hand-checked catalog where every product has at least one vetted supplier, a transparent price built from real supplier cost + markup, and tracked shipping. Success = customers buy with confidence and come back; the owner runs it with minimal manual work (auto-order to supplier, auto price sync, auto review requests).

## Positioning

"The shortlist, not the marketplace." A neighbouring dropshipper cannot truthfully claim: every product passed a supplier check and a price check; discounts are computed from an actual prior price; EU-warehouse suppliers are preferred so most orders ship inside the EU (no customs surprises, faster delivery).

## Operating Context

- Customer flow: browse → product page → cart drawer → Stripe Checkout → order confirmation email → shipping email with tracking → review request email.
- Owner flow (admin): add suppliers (CJ Dropshipping API, AliExpress, manual/B2B like Alibaba or Made-in-China) → import products (API search or CSV) → set markup rules → orders auto-forward to the cheapest in-stock supplier (or a locked one) → cron syncs prices, tracking, retries failed supplier orders.
- Owner is in Cyprus; the store targets the EU, priced in EUR, with English and Greek UI.

## Capabilities and Constraints

- Stack: Next.js 16 (App Router), React 19, Tailwind v4, Prisma 7 + PostgreSQL, NextAuth v5, Stripe Checkout, Resend email, Zustand cart, framer-motion. Deployed on Vercel (crons in vercel.json).
- Existing supplier abstraction: `SupplierAdapter` (search, details, price, stock, placeOrder, getOrderStatus) with CJ, AliExpress (stub) and Manual adapters.
- Pricing engine: per-product markup (multiplier/fixed/manual) with floor/ceiling; cheapest-supplier selection with lock override; price history.
- Prices are stored in integer minor units (cents).
- Confirmed: display currency EUR; UI bilingual English + Greek (English default); broad curated catalog across electronics, home, fashion, sports, beauty.
- Confirmed: CJ Dropshipping is the supplier that must work end-to-end via API. AliExpress adapter stays a stub until the owner has DS API approval. Alibaba / Made-in-China are B2B sources handled as structured manual suppliers (MOQ, lead time, quoted cost) with CSV import.

## Brand Commitments

- Name: WishlistAZ (domain wishlistaz.com). Logo asset: `public/wishlistAZ.png`, favicon `src/app/icon.png`.
- Voice: plain, specific, no hype; never invents urgency; says what a product is not.

## Evidence on Hand

- Seeded demo catalog (20 products, 5 categories, sample reviews/orders) in `prisma/seed.ts` — demo data, must be labelled synthetic in screenshots and replaced by real supplier imports.
- No real customer testimonials or press yet. Do not fabricate.
- CJ Dropshipping account exists (owner-provided credentials go in admin → suppliers).

## Product Principles

1. Honesty is the feature: every discount, delivery estimate and stock state is backed by data the system actually has.
2. Fast decisions on mobile: fewer, better products; filters and sort that matter; no infinite scroll traps.
3. Owner automation first: anything the system can do (order, sync, retry, email) it does; the admin exists for exceptions.
4. EU-first logistics: prefer EU-warehouse suppliers; surface delivery estimates from the chosen supplier, not a generic promise.
5. Ship real, working flows over decorative features.
