# WishlistAZ

A curated dropshipping store for the EU market (Cyprus first): a short, hand-checked catalog where every product has at least one vetted supplier, a transparent price built from real supplier cost + markup, and tracked shipping. English and Greek UI, prices in EUR, "departure board" visual identity.

- Storefront: Next.js 16 App Router, React 19, Tailwind v4, Zustand cart, Stripe Checkout
- Back office at `/admin`: products, orders, supplier queue, suppliers, analytics, settings
- Data: Prisma 7 + PostgreSQL. Money is stored in integer minor units (cents) of the store currency.
- Automation: supplier auto-order on payment, price/stock sync, order tracking sync, failed-order retry, review-request emails (Vercel crons in `vercel.json`)

Product decisions live in [`PRODUCT.md`](./PRODUCT.md).

## Quick start

```bash
cp .env.example .env          # fill in DATABASE_URL, NEXTAUTH_SECRET at minimum
npm install                   # runs prisma generate
npx prisma migrate deploy     # or: npm run db:migrate (dev)
npm run db:seed               # demo catalog + admin user admin@example.com / admin123
npm run dev                   # http://localhost:3000, admin at /admin
```

`docker compose up` starts Postgres and a MailDev inbox on http://localhost:1080 if you prefer containers.

Checks: `npx tsc --noEmit`, `npm run lint`, `npm run build`.

## How an order travels

```
customer pays (Stripe) ─▶ webhook /api/webhooks/stripe
                            │  order PENDING, one line per product
                            │  cheapest in-stock supplier already selected at checkout
                            ▼
                     autoPlaceSupplierOrders()
                       ├─ CJ Dropshipping ──▶ createOrderV2 ──▶ SupplierOrder ORDERED
                       │                        (fails? SupplierOrder PENDING → retry cron)
                       └─ everything else ──▶ SupplierOrder PENDING → Admin → Orders → Supplier queue
                                                 (you place it by hand, type the supplier ref)
                            ▼
      CJ webhook /api/webhooks/cj  ─or─  cron /api/cron/sync-orders
                            │  SHIPPED (+ tracking number → shipping email) → DELIVERED
                            ▼
                  cron /api/cron/review-requests (7 days after delivery)
```

Prices: `cron /api/cron/sync-prices` refreshes cost, shipping and stock for API suppliers, records price history, and re-prices products with **auto price** on through the pricing engine (markup × cheapest supplier, floor/ceiling, locked supplier wins).

## Supplier configuration

Each supplier has a **type** (Admin → Suppliers → Add supplier). The type decides what the system can do on its own:

| Type | Catalog search | Live price & stock | Auto-order | Tracking | You do |
|---|---|---|---|---|---|
| **CJ Dropshipping** | yes | yes | yes | webhook + poll | paste an API key, top up the CJ wallet |
| **Manual** (local wholesaler) | no | from your listings | no | no | keep listings current, place orders from the queue |
| **AliExpress** | not yet | from your listings | no | no | same as Manual until the DS API is approved |
| **Alibaba** | no | from your quotes | no | no | negotiate MOQ + price, place POs, confirm in the queue |
| **Made-in-China** | no | from your quotes | no | no | same as Alibaba |

Every supplier carries logistics facts the storefront uses honestly: **Ships from** (ISO country, drives the "ships from inside the EU" badge and CJ freight quotes), **dispatch / production lead time** and **transit days**. Fill them in; the product page shows the real numbers of the supplier that will fulfil the order.

Only two things are global: the FX rate(s) in `.env` (`FX_USD_EUR`) because CJ, Alibaba and Made-in-China quote in USD, and `CRON_SECRET` for the scheduled jobs.

### CJ Dropshipping

CJ is the supplier that works end to end through its API 2.0 (`src/lib/suppliers/cj.ts`).

**1. Get an API key**

1. Log in to [My CJ](https://www.cjdropshipping.com/) → left menu **Apps** → **Install App** → category *Others* → install **API**.
2. **Apps → API → Add API**: name it (e.g. `wishlistaz`), type **API Key**, confirm.
3. Copy the key from the list (the *API Key & MCP Token* column). It looks like `CJ…@api@…`.

CJ's API 2.0 authenticates with the key alone; your account e-mail is not used. Access tokens live 180 days and are cached on the supplier row, so serverless deployments do not re-authenticate on every request. Free accounts get **1 request/second**; the adapter throttles and retries `1600200` (rate limited) automatically.

**2. Add the supplier**

Admin → Suppliers → Add supplier → type **CJ Dropshipping**:

- **API key**: paste it and press **Test connection**. A successful test shows your CJ `openId` and wallet balance.
  Alternatively set `CJ_API_KEY` in `.env`; the admin value wins when both exist.
- **Ships from**: the CJ warehouse you sell from, e.g. `DE` for the German warehouse, `CN` for China. Freight quotes and orders use it as `fromCountryCode`. Create one supplier per warehouse if you use several (e.g. "CJ (EU warehouse)" = `DE`, "CJ (CN)" = `CN`) and link each product to the one that stocks it.
- Dispatch time and transit days as CJ advertises for that warehouse.

**3. Import products**

Admin → Import products → search → Import. On import the app fetches the product detail, picks the variant to sell (cheapest in stock, preferring the supplier's warehouse country), stores its `vid` (required for ordering), converts the USD price with `FX_USD_EUR`, and quotes EU shipping (`CJ_QUOTE_COUNTRY`, default `CY`) with CJ's freight calculator. Each listing on the supplier page has a **refresh** button that re-quotes it.

Bulk alternative: CSV import on the Products page with `supplier_type=CJ`, `supplier_sku=<pid>` and `variant_id=<vid>` columns.

**4. Ordering**

On `checkout.session.completed` the app calls `createOrderV2` with your order number as CJ `orderNumber` (CJ rejects duplicates, so retries are safe), the customer's address, the variant `vid`, `fromCountryCode` and a carrier:

- `CJ_LOGISTIC_NAME` empty → the cheapest option CJ's freight calculator returns for that destination.
- `CJ_LOGISTIC_NAME="CJPacket Ordinary"` (or any name CJ lists) → always that carrier.

Payment:

- `CJ_AUTO_PAY="true"`: `payType 2`, CJ deducts the order from your **wallet balance**. Keep the balance topped up; an insufficient balance (`1604000`) leaves the supplier order PENDING for the retry cron.
- `CJ_AUTO_PAY="false"` (default): `payType 3`, the order is created **unpaid**. You pay it in My CJ → Orders. Safer while you are validating the flow.
- `CJ_SANDBOX="true"`: every order is a sandbox order (no charge, no fulfilment). Use this on staging and for the first real test, then set it to `false`.

For EU customers served from a non-EU warehouse set `CJ_IOSS_TYPE` (`3` to use CJ's IOSS) so VAT is settled at checkout instead of at the customs desk.

**5. Tracking**

Two mechanisms, both idempotent, both send the shipping e-mail once:

- **Webhook** (instant). Register your endpoint with the CJ API once (any HTTP client, after the first token fetch):

  ```bash
  TOKEN=$(curl -s -X POST https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken \
    -H 'Content-Type: application/json' -d '{"apiKey":"'"$CJ_API_KEY"'"}' | jq -r .data.accessToken)

  curl -X POST https://developers.cjdropshipping.com/api2.0/v1/webhook/set \
    -H "CJ-Access-Token: $TOKEN" -H 'Content-Type: application/json' -d '{
      "product":  {"type":"CANCEL","callbackUrls":["https://<your-domain>/api/webhooks/cj"]},
      "stock":    {"type":"CANCEL","callbackUrls":["https://<your-domain>/api/webhooks/cj"]},
      "order":    {"type":"ENABLE","callbackUrls":["https://<your-domain>/api/webhooks/cj"]},
      "logistics":{"type":"ENABLE","callbackUrls":["https://<your-domain>/api/webhooks/cj"]}
    }'
  ```

  CJ signs each push (`sign` header = Base64 HMAC-SHA256 of the raw body, secret = your `openId`). The receiver verifies it against the `openId` stored on the CJ supplier row (or `CJ_OPEN_ID`). If you register the URL before the first API call, use the shared-secret form instead: `…/api/webhooks/cj?secret=<CJ_WEBHOOK_SECRET>`.
- **Polling** (`/api/cron/sync-orders`, every 2 hours): asks CJ for every ORDERED line and applies the same transitions. Nothing is lost if a webhook is missed.

**6. Price and stock sync**

`/api/cron/sync-prices` (daily) re-quotes CJ listings per variant: price, stock in the "ships from" warehouse, cheapest shipping to `CJ_QUOTE_COUNTRY`. Products whose suppliers are all out of stock leave the board automatically and return when stock is back. Listings you **lock** are never touched.

**Error codes you will meet**: `1600001/1600004` bad key or token (Test connection again), `1600200` rate limited (the adapter waits), `1600201/16900500` daily quota used up, `1603003` duplicate order (already placed, treated as success), `1604000` wallet balance too low, `1605001` carrier not valid for the route (clear `CJ_LOGISTIC_NAME`). Full table: <https://developers.cjdropshipping.com/en/api/api2/standard/ps-code.html>.

### AliExpress

**Status: manual supplier until the AliExpress Dropshipping (DS) API is approved for your account.** The old adapter threw on every call and made any AliExpress listing break price sync; it now behaves like a manual supplier with catalog search disabled and a clear message.

What approval needs, when you want it:

1. An app on the AliExpress Open Platform (<https://openservice.aliexpress.com>) with the **Dropshipping** API group.
2. The seller account authorised against that app (OAuth; the app receives `access_token` + `refresh_token`).
3. Then implement `searchProducts`, `getPrice`, `placeOrder` and `getOrderStatus` in `src/lib/suppliers/aliexpress.ts` using `aliexpress.ds.*` methods and flip its `capabilities`. Everything else (queue, crons, webhook plumbing) already treats any supplier with `autoOrder: true` as an API supplier.

Until then: create the supplier with type **AliExpress**, add listings by hand or CSV (`supplier_type=ALIEXPRESS`, `supplier_url` = the AliExpress product URL), place orders from the supplier queue and type the AliExpress order number as the reference, and paste the tracking number when it arrives (the shipping e-mail goes out from the queue).

### Alibaba and Made-in-China (B2B, manual)

Both are B2B marketplaces: factories quote per SKU with a **minimum order quantity**, a **production lead time** and a price in USD, and you pay by Trade Assurance / T/T. There is no dropship API, so they are structured manual suppliers:

1. **Supplier** (Admin → Suppliers → Add supplier → type *Alibaba* or *Made-in-China*): storefront URL, **Ships from** `CN` (or the factory's country), **production lead time**, **transit days** (sea/air/rail as you actually ship), **contact / inquiry URL** (TradeManager chat or the Made-in-China inquiry page), **payment terms** ("30 % deposit, 70 % before shipment"), notes.
2. **Listings** carry the quote. Per product row on the supplier page (pencil icon) or via CSV:
   - `cost_price` in EUR cents (what one unit costs you after conversion), `shipping_cost` per unit if you allocate freight,
   - `moq`, `lead_time_days`,
   - `source_currency` + `source_cost_price` = the quote as the factory gave it (`USD 12.80`) so you can re-check it later.
   A template with the three supplier types is in [`docs/csv-import-template.csv`](./docs/csv-import-template.csv).
3. **Orders**: the line lands in the supplier queue with the listing link, SKU, MOQ and quote. If the customer ordered fewer units than the MOQ the queue flags it: either you hold stock (order the MOQ, sell the rest) or you switch the product to another supplier. Place the PO on Alibaba / Made-in-China, then **Mark as ordered** with the PO / Trade Assurance number, and later **Mark as shipped** with the tracking number.

The pricing engine treats B2B listings like any other supplier: if their total cost is the cheapest in-stock option they win auto-selection, unless another supplier is **locked** on that product. Lock the EU supplier on products where a 100-piece MOQ makes no sense for single retail orders.

### Pushing prices from outside (any manual supplier)

`POST /api/suppliers/update-prices` with header `x-api-key: <PRICE_UPDATE_API_KEY>`:

```json
{ "updates": [ { "supplier_id": "<Supplier.id>", "supplier_sku": "ALB-KB87",
                 "cost_price": 3220, "shipping_cost": 0, "in_stock": true } ] }
```

Use it from a spreadsheet script when a factory sends a new quote sheet.

## Environment variables

See [`.env.example`](./.env.example); every variable is documented inline. Minimum for local development: `DATABASE_URL`, `NEXTAUTH_SECRET`. For a working shop: Stripe keys + webhook secret, Resend, `CRON_SECRET`, and for CJ: `CJ_API_KEY` (or the key in the admin), `FX_USD_EUR`, `CJ_AUTO_PAY`, `CJ_SANDBOX`.

## Scheduled jobs

| Path | Default schedule | What it does |
|---|---|---|
| `/api/cron/sync-prices` | daily 06:00 | live cost/stock/shipping for API suppliers, re-price auto-priced products |
| `/api/cron/sync-orders` | daily 08:00 (set `0 */2 * * *` in production) | ORDERED → SHIPPED / DELIVERED via supplier API |
| `/api/cron/retry-orders` | daily 09:00 (hourly recommended) | re-place API supplier orders that failed |
| `/api/cron/review-requests` | daily 10:00 | review e-mail 7 days after delivery |

All require `Authorization: Bearer <CRON_SECRET>`. Vercel adds it automatically for entries in `vercel.json`.

## Project layout

```
src/app/(store)        storefront (EN/EL, src/lib/i18n)
src/app/(admin)/admin  back office
src/app/api            Stripe + CJ webhooks, crons, price push endpoint
src/lib/suppliers      adapter contract (types.ts), cj.ts, manual.ts (Alibaba, Made-in-China),
                       aliexpress.ts, factory.ts, auto-order.ts, order-status.ts, currency.ts
src/lib/pricing        markup engine, cheapest-supplier selection, price history
prisma                 schema, migrations, seed (demo data, labelled as such)
public/demo            locally rendered demo imagery (see PROVENANCE.txt)
```
