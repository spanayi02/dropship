/**
 * CJ Dropshipping adapter — API 2.0
 * Docs: https://developers.cjdropshipping.com/en/api/api2/
 *
 * What the real API looks like (verified against the docs, Sept 2026):
 *  - Auth: POST /authentication/getAccessToken { apiKey } → accessToken (180 d)
 *    + refreshToken (180 d) + openId. No email/password. Refresh with
 *    POST /authentication/refreshAccessToken { refreshToken }.
 *  - Every other call carries the header `CJ-Access-Token`.
 *  - Free accounts are limited to 1 request/second; over-limit calls return
 *    code 1600200. Daily usage is metered in "points".
 *  - All prices are USD. We convert to the store currency (EUR) with the
 *    configured FX rate (lib/suppliers/currency).
 *  - Products are priced and stocked per *variant* (vid). Orders need a vid.
 *  - Orders: POST /shopping/order/createOrderV2. `orderNumber` is our own
 *    reference and CJ rejects duplicates (1603003), which makes retries safe.
 *    payType 2 pays from the CJ wallet balance automatically; payType 3 only
 *    creates the order and leaves it UNPAID for the owner to pay in My CJ.
 *
 * Tokens are persisted back into Supplier.apiCredentials (via the factory) so
 * that serverless cold starts do not re-authenticate on every request.
 */

import { HOME_COUNTRY } from "@/lib/store-config";
import { parseSupplierPrice, toStoreCents } from "./currency";
import {
  type NormalizedSupplierOrderStatus,
  type PriceQuery,
  type PriceQuote,
  type SupplierAdapter,
  type SupplierCapabilities,
  type SupplierOrderInput,
  type SupplierOrderResult,
  type SupplierOrderStatus,
  type SupplierProduct,
  type SupplierVariant,
  SupplierNotConfiguredError,
} from "./types";

export const CJ_BASE = "https://developers.cjdropshipping.com/api2.0/v1";
const CJ_CURRENCY = "USD";

/** Fallback tracking page when CJ does not return a trackingUrl. */
export function cjTrackingUrl(trackingNumber: string): string {
  return `https://www.cjpacket.com/?trackNumber=${encodeURIComponent(trackingNumber)}`;
}

export function cjProductUrl(pid: string): string {
  return `https://www.cjdropshipping.com/product/-p-${encodeURIComponent(pid)}.html`;
}

// ─── credentials ──────────────────────────────────────────────────────────────

export interface CJCredentials {
  /** CJ API key (My CJ → Apps → API → Add API). The only thing you type in. */
  apiKey: string;
  /** Legacy field from the old email+key auth; ignored by API 2.0 but kept so old rows still parse. */
  email?: string;
  /** Cached tokens, written back by the adapter. */
  accessToken?: string;
  accessTokenExpiresAt?: string;
  refreshToken?: string;
  refreshTokenExpiresAt?: string;
  /** CJ account id; the HMAC secret for webhook signatures. */
  openId?: string;
}

export interface CJAdapterOptions {
  /** Called whenever tokens change so the caller can persist them. */
  persistCredentials?: (creds: CJCredentials) => Promise<void>;
  /** Warehouse country CJ ships from when the listing does not pin one. */
  fromCountryCode?: string;
  /** Destination country used for price/shipping quotes. */
  quoteCountryCode?: string;
  /** Preferred carrier (CJ logisticName). Cheapest option from freightCalculate when unset. */
  logisticName?: string;
  /** Pay orders from the CJ wallet balance (payType 2). Otherwise create-only (payType 3). */
  autoPay?: boolean;
  /** Create sandbox orders (isSandbox 1): no charge, no fulfilment. */
  sandbox?: boolean;
  /** Platform label CJ shows on the order. */
  platform?: string;
  /** IOSS handling for EU destinations: 1 none, 2 your IOSS, 3 CJ's IOSS. */
  iossType?: 1 | 2 | 3;
  iossNumber?: string;
  fetchImpl?: typeof fetch;
}

export function cjOptionsFromEnv(): CJAdapterOptions {
  const env = process.env;
  const iossType = env.CJ_IOSS_TYPE ? (Number(env.CJ_IOSS_TYPE) as 1 | 2 | 3) : undefined;
  return {
    fromCountryCode: env.CJ_FROM_COUNTRY || "CN",
    quoteCountryCode: env.CJ_QUOTE_COUNTRY || HOME_COUNTRY,
    logisticName: env.CJ_LOGISTIC_NAME || undefined,
    autoPay: env.CJ_AUTO_PAY === "true",
    sandbox: env.CJ_SANDBOX === "true",
    platform: env.CJ_PLATFORM || "Api",
    iossType: iossType && [1, 2, 3].includes(iossType) ? iossType : undefined,
    iossNumber: env.CJ_IOSS_NUMBER || undefined,
  };
}

// ─── errors ───────────────────────────────────────────────────────────────────

export class CJApiError extends Error {
  constructor(
    message: string,
    readonly code: number | string,
    readonly endpoint: string,
    readonly requestId?: string
  ) {
    super(`CJ ${endpoint}: ${message} (code ${code}${requestId ? `, request ${requestId}` : ""})`);
    this.name = "CJApiError";
  }
  get isAuthError() {
    return [1600001, 1600002, 1600003, 1600004, 1600005, 1600006, 1601000].includes(
      Number(this.code)
    );
  }
  get isRateLimited() {
    return Number(this.code) === 1600200 || Number(this.code) === 429;
  }
  get isQuotaExhausted() {
    return Number(this.code) === 1600201 || Number(this.code) === 16900500;
  }
  get isDuplicateOrder() {
    return Number(this.code) === 1603003;
  }
  get isInsufficientBalance() {
    return Number(this.code) === 1604000 || Number(this.code) === 1604001;
  }
}

interface CJEnvelope<T> {
  code: number;
  result: boolean;
  message?: string;
  data: T;
  requestId?: string;
}

// ─── rate limiting ────────────────────────────────────────────────────────────

/** Serialise calls per API key: CJ allows 1 req/s on free accounts. */
const throttles = new Map<string, { chain: Promise<void>; last: number }>();
const MIN_INTERVAL_MS = Number(process.env.CJ_MIN_INTERVAL_MS ?? 1100);

function throttle(key: string): Promise<void> {
  const t = throttles.get(key) ?? { chain: Promise.resolve(), last: 0 };
  const next = t.chain.then(async () => {
    const wait = t.last + MIN_INTERVAL_MS - Date.now();
    if (wait > 0) await sleep(wait);
    t.last = Date.now();
  });
  // Keep the chain alive even if a caller's work throws.
  t.chain = next.catch(() => undefined);
  throttles.set(key, t);
  return next;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── status mapping ───────────────────────────────────────────────────────────

export function normalizeCJOrderStatus(raw: string | null | undefined): NormalizedSupplierOrderStatus {
  switch ((raw ?? "").toUpperCase()) {
    case "CREATED":
    case "IN_CART":
      return "created";
    case "UNPAID":
      return "unpaid";
    case "PENDING":
    case "PROCESSING":
    case "UNSHIPPED":
      return "processing";
    case "SHIPPED":
      return "shipped";
    case "DELIVERED":
    case "COMPLETED":
      return "delivered";
    case "CANCELLED":
    case "CANCELED":
      return "cancelled";
    default:
      return "unknown";
  }
}

/** Webhook LOGISTIC.trackingStatus codes → normalized order status. */
export function normalizeCJTrackingStatus(code: number | string | null | undefined): NormalizedSupplierOrderStatus {
  const n = Number(code);
  if (!Number.isFinite(n)) return "unknown";
  if (n === 12) return "delivered";
  if (n >= 1 && n <= 11) return "shipped";
  if (n === 13 || n === 14) return "shipped"; // exception / return: still in carrier hands
  return "processing";
}

// ─── adapter ──────────────────────────────────────────────────────────────────

export class CJDropshippingAdapter implements SupplierAdapter {
  readonly name = "CJ Dropshipping";
  readonly type = "cj" as const;
  readonly capabilities: SupplierCapabilities = {
    search: true,
    livePricing: true,
    autoOrder: true,
    orderTracking: true,
  };

  private creds: CJCredentials;
  private readonly opts: Required<Pick<CJAdapterOptions, "fromCountryCode" | "quoteCountryCode" | "platform">> &
    CJAdapterOptions;
  private readonly fetchImpl: typeof fetch;
  private authInFlight: Promise<string> | null = null;

  constructor(credentials: CJCredentials, options: CJAdapterOptions = {}) {
    if (!credentials?.apiKey?.trim()) {
      throw new SupplierNotConfiguredError(
        "CJ Dropshipping needs an API key. Create one in My CJ → Apps → API, then paste it in Admin → Suppliers (or set CJ_API_KEY)."
      );
    }
    this.creds = { ...credentials, apiKey: credentials.apiKey.trim() };
    const env = cjOptionsFromEnv();
    this.opts = {
      ...env,
      ...options,
      fromCountryCode: options.fromCountryCode ?? env.fromCountryCode ?? "CN",
      quoteCountryCode: options.quoteCountryCode ?? env.quoteCountryCode ?? HOME_COUNTRY,
      platform: options.platform ?? env.platform ?? "Api",
    };
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  /** Current credentials including any refreshed tokens. */
  get credentials(): CJCredentials {
    return { ...this.creds };
  }

  // ── auth ──────────────────────────────────────────────────────────────────

  private tokenIsFresh(expiresAt?: string, marginMs = 24 * 60 * 60 * 1000): boolean {
    if (!expiresAt) return false;
    const t = Date.parse(expiresAt);
    return Number.isFinite(t) && t - marginMs > Date.now();
  }

  private async accessToken(force = false): Promise<string> {
    if (!force && this.creds.accessToken && this.tokenIsFresh(this.creds.accessTokenExpiresAt)) {
      return this.creds.accessToken;
    }
    if (!this.authInFlight) {
      this.authInFlight = this.authenticate(force).finally(() => {
        this.authInFlight = null;
      });
    }
    return this.authInFlight;
  }

  private async authenticate(force: boolean): Promise<string> {
    // Prefer refresh: it does not count against the get-token cache window.
    if (!force && this.creds.refreshToken && this.tokenIsFresh(this.creds.refreshTokenExpiresAt)) {
      try {
        const data = await this.rawPost<TokenResponse>(
          "/authentication/refreshAccessToken",
          { refreshToken: this.creds.refreshToken },
          { auth: false }
        );
        await this.storeTokens(data);
        return data.accessToken;
      } catch (err) {
        console.warn("[cj] refreshAccessToken failed, falling back to getAccessToken:", errMessage(err));
      }
    }
    const data = await this.rawPost<TokenResponse>(
      "/authentication/getAccessToken",
      { apiKey: this.creds.apiKey },
      { auth: false }
    );
    await this.storeTokens(data);
    return data.accessToken;
  }

  private async storeTokens(data: TokenResponse) {
    this.creds = {
      ...this.creds,
      accessToken: data.accessToken,
      accessTokenExpiresAt: data.accessTokenExpiryDate,
      refreshToken: data.refreshToken ?? this.creds.refreshToken,
      refreshTokenExpiresAt: data.refreshTokenExpiryDate ?? this.creds.refreshTokenExpiresAt,
      openId: data.openId != null ? String(data.openId) : this.creds.openId,
    };
    try {
      await this.opts.persistCredentials?.(this.creds);
    } catch (err) {
      console.error("[cj] Failed to persist refreshed tokens:", errMessage(err));
    }
  }

  // ── transport ─────────────────────────────────────────────────────────────

  private async rawPost<T>(path: string, body: unknown, o: { auth: boolean; method?: string }): Promise<T> {
    return this.request<T>(path, { method: o.method ?? "POST", body: JSON.stringify(body) }, o.auth);
  }

  private async request<T>(path: string, init: RequestInit, auth = true, attempt = 0): Promise<T> {
    await throttle(this.creds.apiKey);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...((init.headers as Record<string, string>) ?? {}),
    };
    if (auth) headers["CJ-Access-Token"] = await this.accessToken();

    let res: Response;
    try {
      res = await this.fetchImpl(`${CJ_BASE}${path}`, {
        ...init,
        headers,
        signal: AbortSignal.timeout(Number(process.env.CJ_TIMEOUT_MS ?? 25000)),
      });
    } catch (err) {
      if (attempt < 2) {
        await sleep(1500 * (attempt + 1));
        return this.request<T>(path, init, auth, attempt + 1);
      }
      throw new CJApiError(`network error: ${errMessage(err)}`, "NETWORK", path);
    }

    const text = await res.text();
    let json: CJEnvelope<T> | null = null;
    try {
      json = text ? (JSON.parse(text) as CJEnvelope<T>) : null;
    } catch {
      json = null;
    }

    if (!json) {
      if ((res.status === 429 || res.status >= 500) && attempt < 2) {
        await sleep(2000 * (attempt + 1));
        return this.request<T>(path, init, auth, attempt + 1);
      }
      throw new CJApiError(`HTTP ${res.status}: ${text.slice(0, 200) || "empty body"}`, res.status, path);
    }

    if (json.result === true || json.code === 200) return json.data;

    const error = new CJApiError(json.message ?? "unknown error", json.code, path, json.requestId);
    if (error.isRateLimited && attempt < 3) {
      await sleep(2000 * (attempt + 1));
      return this.request<T>(path, init, auth, attempt + 1);
    }
    if (auth && error.isAuthError && attempt === 0) {
      // Token revoked or expired early: re-authenticate once and retry.
      await this.accessToken(true);
      return this.request<T>(path, init, auth, attempt + 1);
    }
    throw error;
  }

  private get<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params ?? {})) {
      if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
    }
    const q = qs.toString();
    return this.request<T>(`${path}${q ? `?${q}` : ""}`, { method: "GET" });
  }

  private post<T>(path: string, body: unknown, method: "POST" | "PATCH" = "POST"): Promise<T> {
    return this.request<T>(path, { method, body: JSON.stringify(body) });
  }

  // ── products ──────────────────────────────────────────────────────────────

  async searchProducts(query: string): Promise<SupplierProduct[]> {
    const data = await this.get<ListV2Response>("/product/listV2", {
      keyWord: query,
      page: 1,
      size: 24,
      countryCode: this.opts.fromCountryCode !== "CN" ? this.opts.fromCountryCode : undefined,
      features: "enable_description",
    });
    const list = data?.content?.flatMap((c) => c.productList ?? []) ?? [];
    return list.map((p) => {
      const usd = parseSupplierPrice(p.nowPrice || p.discountPrice || p.sellPrice);
      const stock = Number(p.warehouseInventoryNum ?? 0);
      return {
        sku: p.id,
        title: p.nameEn ?? p.sku ?? p.id,
        description: p.description ?? "",
        images: p.bigImage ? [p.bigImage] : [],
        costPrice: toStoreCents(usd, CJ_CURRENCY),
        shippingCost: 0, // per-variant, quoted at import / sync time
        inStock: stock > 0,
        stockQty: stock,
        estimatedDeliveryDays: parseDeliveryDays(p.deliveryCycle),
        productUrl: cjProductUrl(p.id),
        sourceCurrency: CJ_CURRENCY,
        sourceCostPrice: usd,
      } satisfies SupplierProduct;
    });
  }

  async getProductDetails(sku: string): Promise<SupplierProduct> {
    const p = await this.get<ProductQueryResponse>("/product/query", { pid: sku });
    if (!p?.pid) throw new CJApiError("product not found", 1602001, "/product/query");

    const variants: SupplierVariant[] = (p.variants ?? []).map((v) => {
      const inventories = v.inventories ?? [];
      const stockQty = inventories.reduce((s, i) => s + Number(i.totalInventory ?? 0), 0);
      return {
        variantId: v.vid,
        sku: v.variantSku ?? undefined,
        name: v.variantNameEn ?? v.variantKey ?? undefined,
        image: v.variantImage ?? undefined,
        costPrice: toStoreCents(v.variantSellPrice, CJ_CURRENCY),
        stockQty: inventories.length ? stockQty : undefined,
        warehouseCountries: inventories
          .filter((i) => Number(i.totalInventory ?? 0) > 0 && i.countryCode)
          .map((i) => i.countryCode!.toUpperCase()),
      };
    });

    const cheapest = variants.length
      ? variants.reduce((a, b) => (b.costPrice < a.costPrice ? b : a))
      : undefined;
    const usd = cheapest ? undefined : parseSupplierPrice(p.sellPrice);
    const costPrice = cheapest ? cheapest.costPrice : toStoreCents(usd, CJ_CURRENCY);
    const anyStock = variants.some((v) => (v.stockQty ?? 0) > 0);

    return {
      sku: p.pid,
      title: p.productNameEn ?? p.productSku ?? p.pid,
      description: p.description ?? "",
      images: uniq([p.bigImage, ...(p.productImageSet ?? []), ...variants.map((v) => v.image)]),
      costPrice,
      shippingCost: 0,
      inStock: variants.length ? anyStock : true,
      stockQty: variants.length ? variants.reduce((s, v) => s + (v.stockQty ?? 0), 0) : undefined,
      productUrl: cjProductUrl(p.pid),
      sourceCurrency: CJ_CURRENCY,
      sourceCostPrice: cheapest ? Math.round(cheapest.costPrice) / 100 : usd,
      variants,
    };
  }

  /**
   * Pick the variant to sell for a product: the cheapest one with stock,
   * preferring the configured warehouse country so EU listings ship from EU.
   */
  pickVariant(product: SupplierProduct, preferCountry = this.opts.fromCountryCode): SupplierVariant | undefined {
    const vs = product.variants ?? [];
    if (!vs.length) return undefined;
    const inStock = vs.filter((v) => (v.stockQty ?? 0) > 0);
    const pool = inStock.length ? inStock : vs;
    const local = pool.filter((v) => v.warehouseCountries?.includes(preferCountry.toUpperCase()));
    const candidates = local.length ? local : pool;
    return candidates.reduce((a, b) => (b.costPrice < a.costPrice ? b : a));
  }

  // ── pricing / stock ───────────────────────────────────────────────────────

  async getPrice(q: PriceQuery): Promise<PriceQuote> {
    const vid = q.variantId ?? (await this.resolveVariantId(q.sku));
    const [variant, stockRows] = await Promise.all([
      this.get<VariantResponse>("/product/variant/queryByVid", { vid }),
      this.get<StockRow[]>("/product/stock/queryByVid", { vid }),
    ]);

    const rows = Array.isArray(stockRows) ? stockRows : [];
    const fromCountry = (q.fromCountry ?? this.opts.fromCountryCode).toUpperCase();
    const inCountry = rows.filter((r) => (r.countryCode ?? "").toUpperCase() === fromCountry);
    const relevant = inCountry.length ? inCountry : rows;
    const stockQty = relevant.reduce((s, r) => s + Number(r.totalInventoryNum ?? r.storageNum ?? 0), 0);
    const warehouseCountry = inCountry.length
      ? fromCountry
      : rows.find((r) => Number(r.totalInventoryNum ?? r.storageNum ?? 0) > 0)?.countryCode?.toUpperCase();

    const usd = parseSupplierPrice(variant?.variantSellPrice ?? variant?.sellPrice);
    const shipping = await this.quoteShipping(vid, warehouseCountry ?? fromCountry, q.destinationCountry, q.quantity ?? 1);

    return {
      costPrice: toStoreCents(usd, CJ_CURRENCY),
      shippingCost: shipping?.cents ?? 0,
      inStock: stockQty > 0,
      stockQty,
      estimatedDeliveryDays: shipping?.days,
      warehouseCountry,
      sourceCurrency: CJ_CURRENCY,
      sourceCostPrice: usd,
      shippingMethod: shipping?.logisticName,
    };
  }

  async checkStock(q: PriceQuery): Promise<boolean> {
    const vid = q.variantId ?? (await this.resolveVariantId(q.sku));
    const rows = await this.get<StockRow[]>("/product/stock/queryByVid", { vid });
    return (Array.isArray(rows) ? rows : []).some(
      (r) => Number(r.totalInventoryNum ?? r.storageNum ?? 0) > 0
    );
  }

  private async resolveVariantId(pid: string): Promise<string> {
    const product = await this.getProductDetails(pid);
    const v = this.pickVariant(product);
    if (!v) throw new CJApiError(`product ${pid} has no variants`, 1602000, "/product/query");
    return v.variantId;
  }

  /** Cheapest (or configured) shipping option for one variant, in store cents. */
  async quoteShipping(
    vid: string,
    fromCountry: string,
    toCountry = this.opts.quoteCountryCode,
    quantity = 1
  ): Promise<{ cents: number; logisticName: string; days?: number } | null> {
    let options: FreightOption[];
    try {
      const data = await this.post<FreightOption[]>("/logistic/freightCalculate", {
        startCountryCode: fromCountry.toUpperCase(),
        endCountryCode: toCountry.toUpperCase(),
        products: [{ vid, quantity }],
      });
      options = Array.isArray(data) ? data : [];
    } catch (err) {
      console.warn(`[cj] freightCalculate failed for ${vid} ${fromCountry}→${toCountry}:`, errMessage(err));
      return null;
    }
    if (!options.length) return null;

    const preferred = this.opts.logisticName
      ? options.find((o) => o.logisticName?.toLowerCase() === this.opts.logisticName!.toLowerCase())
      : undefined;
    const chosen =
      preferred ??
      options.reduce((a, b) => (priceOf(b) < priceOf(a) ? b : a));
    return {
      cents: toStoreCents(priceOf(chosen), CJ_CURRENCY),
      logisticName: chosen.logisticName,
      days: parseDeliveryDays(chosen.logisticAging),
    };
  }

  // ── orders ────────────────────────────────────────────────────────────────

  async placeOrder(input: SupplierOrderInput): Promise<SupplierOrderResult> {
    const vid = input.variantId ?? (await this.resolveVariantId(input.supplierSku));
    const addr = input.shippingAddress;
    const fromCountry = (input.fromCountry ?? this.opts.fromCountryCode).toUpperCase();
    const toCountry = addr.country.toUpperCase();
    if (!/^[A-Z]{2}$/.test(toCountry)) {
      throw new CJApiError(
        `destination country "${addr.country}" is not an ISO-3166 alpha-2 code; fix the order's shipping address`,
        1605002,
        "/shopping/order/createOrderV2"
      );
    }

    // CJ requires a carrier name. Use the configured one or the cheapest quote.
    let logisticName = this.opts.logisticName;
    if (!logisticName) {
      const quote = await this.quoteShipping(vid, fromCountry, toCountry, input.quantity);
      if (!quote) {
        throw new CJApiError(
          `no shipping option from ${fromCountry} to ${toCountry} for variant ${vid}`,
          1605000,
          "/logistic/freightCalculate"
        );
      }
      logisticName = quote.logisticName;
    }

    const payType = this.opts.autoPay ? 2 : 3;
    const body = {
      orderNumber: input.orderNumber.slice(0, 50),
      shippingZip: addr.postalCode,
      shippingCountryCode: toCountry,
      shippingCountry: countryName(toCountry),
      shippingProvince: addr.state || addr.city,
      shippingCity: addr.city,
      shippingPhone: addr.phone ?? "",
      shippingCustomerName: `${addr.firstName} ${addr.lastName}`.trim().slice(0, 50),
      shippingAddress: addr.street.slice(0, 500),
      shippingAddress2: addr.street2 ?? "",
      email: input.customerEmail ?? "",
      remark: (input.remark ?? "").slice(0, 500),
      fromCountryCode: fromCountry,
      logisticName,
      platform: this.opts.platform,
      payType,
      ...(this.opts.sandbox ? { isSandbox: 1 } : {}),
      ...(this.opts.iossType ? { iossType: this.opts.iossType } : {}),
      ...(this.opts.iossNumber ? { iossNumber: this.opts.iossNumber } : {}),
      products: [{ vid, quantity: input.quantity, storeLineItemId: input.orderNumber.slice(0, 125) }],
    };

    let data: CreateOrderResponse;
    try {
      data = await this.post<CreateOrderResponse>("/shopping/order/createOrderV2", body);
    } catch (err) {
      if (err instanceof CJApiError && err.isDuplicateOrder) {
        // Retry after a timeout: the first attempt went through. Look it up.
        const existing = await this.getOrderStatus(input.orderNumber);
        return {
          orderId: existing.supplierOrderId ?? input.orderNumber,
          status: existing.normalized,
          trackingUrl: existing.trackingUrl,
          requiresPayment: existing.normalized === "unpaid" || existing.normalized === "created",
        };
      }
      throw err;
    }

    const orderId = data?.orderId ?? (typeof data === "string" ? (data as string) : undefined);
    if (!orderId) throw new CJApiError("createOrderV2 returned no orderId", 1603000, "/shopping/order/createOrderV2");

    const status = normalizeCJOrderStatus(data.orderStatus);
    const paid = payType === 2 && status !== "unpaid" && status !== "created";
    return {
      orderId,
      status,
      requiresPayment: !paid,
      paymentUrl: data.cjPayUrl || undefined,
    };
  }

  async getOrderStatus(orderId: string): Promise<SupplierOrderStatus & { supplierOrderId?: string }> {
    const o = await this.get<OrderDetailResponse>("/shopping/order/getOrderDetail", { orderId });
    const normalized = normalizeCJOrderStatus(o?.orderStatus);
    const trackingNumber = o?.trackNumber || undefined;
    return {
      status: o?.orderStatus ?? "",
      normalized,
      trackingNumber,
      trackingUrl: o?.trackingUrl || (trackingNumber ? cjTrackingUrl(trackingNumber) : undefined),
      shippingMethod: o?.logisticName ?? undefined,
      shippedAt: o?.outWarehouseTime ?? undefined,
      supplierOrderId: o?.orderId ?? undefined,
    };
  }

  /** Pay an UNPAID order from the CJ wallet. Useful for the retry cron when autoPay is on. */
  async payFromBalance(orderId: string): Promise<void> {
    await this.post<null>("/shopping/pay/payBalance", { orderId });
  }

  async getBalance(): Promise<{ amountUsd: number }> {
    const data = await this.get<{ amount?: number }>("/shopping/pay/getBalance");
    return { amountUsd: Number(data?.amount ?? 0) };
  }

  async testConnection(): Promise<{ ok: boolean; message: string }> {
    try {
      const { amountUsd } = await this.getBalance();
      return {
        ok: true,
        message: `Connected to CJ (openId ${this.creds.openId ?? "?"}). Wallet balance: $${amountUsd.toFixed(2)}.`,
      };
    } catch (err) {
      return { ok: false, message: errMessage(err) };
    }
  }
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function errMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function uniq(values: (string | undefined | null)[]): string[] {
  return Array.from(new Set(values.filter((v): v is string => !!v)));
}

function priceOf(o: FreightOption): number {
  return Number(o.totalPostageFee ?? o.logisticPrice ?? Number.POSITIVE_INFINITY);
}

/** "3-5" → 5, "8" → 8, "" → undefined. We promise the slow end, never the fast one. */
export function parseDeliveryDays(value: unknown): number | undefined {
  if (value == null) return undefined;
  const nums = String(value).match(/\d+/g)?.map(Number) ?? [];
  if (!nums.length) return undefined;
  return Math.max(...nums);
}

const COUNTRY_NAMES: Record<string, string> = {
  AT: "Austria", BE: "Belgium", BG: "Bulgaria", HR: "Croatia", CY: "Cyprus", CZ: "Czechia",
  DK: "Denmark", EE: "Estonia", FI: "Finland", FR: "France", DE: "Germany", GR: "Greece",
  HU: "Hungary", IE: "Ireland", IT: "Italy", LV: "Latvia", LT: "Lithuania", LU: "Luxembourg",
  MT: "Malta", NL: "Netherlands", PL: "Poland", PT: "Portugal", RO: "Romania", SK: "Slovakia",
  SI: "Slovenia", ES: "Spain", SE: "Sweden", GB: "United Kingdom", CH: "Switzerland",
  NO: "Norway", US: "United States", CA: "Canada", AU: "Australia", CN: "China",
};

export function countryName(code: string): string {
  const c = code.toUpperCase();
  if (COUNTRY_NAMES[c]) return COUNTRY_NAMES[c];
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(c) ?? c;
  } catch {
    return c;
  }
}

// ─── CJ response shapes (only the fields we read) ─────────────────────────────

interface TokenResponse {
  openId?: number | string;
  accessToken: string;
  accessTokenExpiryDate?: string;
  refreshToken?: string;
  refreshTokenExpiryDate?: string;
}

interface ListV2Product {
  id: string;
  nameEn?: string;
  sku?: string;
  bigImage?: string;
  sellPrice?: string | number;
  nowPrice?: string | number;
  discountPrice?: string | number;
  warehouseInventoryNum?: number;
  description?: string;
  deliveryCycle?: string;
}
interface ListV2Response {
  content?: { productList?: ListV2Product[] }[];
  totalRecords?: number;
}

interface ProductQueryVariant {
  vid: string;
  variantSku?: string;
  variantNameEn?: string;
  variantKey?: string;
  variantImage?: string;
  variantSellPrice?: number | string;
  inventories?: { countryCode?: string; totalInventory?: number }[];
}
interface ProductQueryResponse {
  pid: string;
  productNameEn?: string;
  productSku?: string;
  bigImage?: string;
  productImageSet?: string[];
  sellPrice?: number | string;
  description?: string;
  variants?: ProductQueryVariant[];
}

interface VariantResponse {
  vid?: string;
  variantSellPrice?: number | string;
  sellPrice?: number | string;
}

interface StockRow {
  vid?: string;
  countryCode?: string;
  areaEn?: string;
  storageNum?: number;
  totalInventoryNum?: number;
}

interface FreightOption {
  logisticName: string;
  logisticPrice?: number;
  totalPostageFee?: number;
  logisticAging?: string;
}

interface CreateOrderResponse {
  orderId?: string;
  orderNumber?: string;
  orderStatus?: string;
  cjPayUrl?: string;
}

interface OrderDetailResponse {
  orderId?: string;
  orderStatus?: string;
  trackNumber?: string | null;
  trackingUrl?: string | null;
  logisticName?: string;
  outWarehouseTime?: string | null;
}
