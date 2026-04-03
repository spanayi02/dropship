import { SupplierAdapter, SupplierProduct, SupplierOrderInput } from "./types";

const CJ_BASE = "https://developers.cjdropshipping.com/api2.0/v1";

// Token cache — valid 24h; reuse across requests in the same process
const tokenCache = new Map<string, { token: string; expiresAt: number }>();

async function getAccessToken(email: string, apiKey: string): Promise<string> {
  const key = `${email}:${apiKey}`;
  const cached = tokenCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.token;

  const res = await fetch(`${CJ_BASE}/authentication/getAccessToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, apiKey }),
  });
  const json = await res.json();
  if (!json.result) throw new Error(`CJ auth failed: ${json.message ?? "unknown"}`);

  const token: string = json.data.accessToken;
  // Tokens are valid 24h; cache for 23h to be safe
  tokenCache.set(key, { token, expiresAt: Date.now() + 23 * 60 * 60 * 1000 });
  return token;
}

export interface CJCredentials {
  email: string;
  apiKey: string;
}

export class CJDropshippingAdapter implements SupplierAdapter {
  readonly name = "CJ Dropshipping";
  readonly type = "cj" as const;

  constructor(private credentials: CJCredentials) {}

  private async token() {
    return getAccessToken(this.credentials.email, this.credentials.apiKey);
  }

  private async cjFetch(path: string, options?: RequestInit) {
    const t = await this.token();
    return fetch(`${CJ_BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        CJ_Token: t,
        ...(options?.headers ?? {}),
      },
    });
  }

  async searchProducts(query: string): Promise<SupplierProduct[]> {
    const res = await this.cjFetch(
      `/product/list?productNameEn=${encodeURIComponent(query)}&pageNum=1&pageSize=20`
    );
    const json = await res.json();
    if (!json.result) return [];

    return (json.data?.list ?? []).map((p: Record<string, unknown>) => ({
      sku: p.pid as string,
      title: p.productNameEn as string,
      description: (p.description as string) ?? "",
      images: p.productImage ? [p.productImage as string] : [],
      costPrice: Math.round(Number(p.sellPrice ?? 0) * 100),
      shippingCost: Math.round(Number(p.shippingCost ?? 0) * 100),
      inStock: (p.inventory as number) > 0,
      productUrl: `https://cjdropshipping.com/product/${p.pid}.html`,
    }));
  }

  async getProductDetails(sku: string): Promise<SupplierProduct> {
    const res = await this.cjFetch(`/product/detail?pid=${encodeURIComponent(sku)}`);
    const json = await res.json();
    if (!json.result) throw new Error(`CJ product not found: ${sku}`);

    const p = json.data;
    return {
      sku: p.pid,
      title: p.productNameEn,
      description: p.description ?? "",
      images: p.productImages?.map((i: Record<string, string>) => i.imageUrl) ?? [],
      costPrice: Math.round(Number(p.sellPrice ?? 0) * 100),
      shippingCost: Math.round(Number(p.shippingCost ?? 0) * 100),
      inStock: (p.inventory ?? 0) > 0,
      estimatedDeliveryDays: p.deliveryDay ?? undefined,
      productUrl: `https://cjdropshipping.com/product/${p.pid}.html`,
    };
  }

  async getPrice(
    sku: string
  ): Promise<{ costPrice: number; shippingCost: number; inStock: boolean }> {
    const product = await this.getProductDetails(sku);
    return {
      costPrice: product.costPrice,
      shippingCost: product.shippingCost,
      inStock: product.inStock,
    };
  }

  async checkStock(sku: string): Promise<boolean> {
    const { inStock } = await this.getPrice(sku);
    return inStock;
  }

  async placeOrder(
    input: SupplierOrderInput
  ): Promise<{ orderId: string; trackingUrl?: string }> {
    const { shippingAddress, supplierSku, quantity } = input;

    const res = await this.cjFetch("/shopping/order/createOrderV2", {
      method: "POST",
      body: JSON.stringify({
        shippingAddress: {
          firstName: shippingAddress.firstName,
          lastName: shippingAddress.lastName,
          phone: shippingAddress.phone ?? "",
          countryCode: shippingAddress.country,
          province: shippingAddress.state,
          city: shippingAddress.city,
          address: shippingAddress.street,
          zip: shippingAddress.postalCode,
        },
        products: [{ vid: supplierSku, quantity }],
        shippingMethod: "CJPacket",
      }),
    });

    const json = await res.json();
    if (!json.result) throw new Error(`CJ order failed: ${json.message ?? "unknown"}`);

    return { orderId: json.data.orderId as string };
  }

  async getOrderStatus(cjOrderId: string): Promise<{
    status: string;
    trackingNumber?: string;
    trackingUrl?: string;
    shippedAt?: string;
  }> {
    const res = await this.cjFetch(
      `/shopping/order/getOrderDetail?orderId=${encodeURIComponent(cjOrderId)}`
    );
    const json = await res.json();
    if (!json.result) throw new Error(`CJ getOrderDetail failed: ${json.message ?? "unknown"}`);

    const o = json.data ?? {};
    return {
      status: (o.orderStatus ?? "") as string,
      trackingNumber: o.trackNumber as string | undefined,
      trackingUrl: o.logisticUrl as string | undefined,
      shippedAt: o.shippingTime as string | undefined,
    };
  }
}
