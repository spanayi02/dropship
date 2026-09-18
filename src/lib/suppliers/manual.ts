/**
 * Manual supplier adapter.
 *
 * Backs every supplier that has no ordering API: local wholesalers, Alibaba
 * and Made-in-China B2B factories, and AliExpress until its DS API is
 * approved. Prices and stock come from the ProductSupplier rows the owner
 * keeps up to date (admin inline editor, CSV import or the
 * /api/suppliers/update-prices endpoint). Orders are never placed by code:
 * they land in the supplier queue for the owner to place by hand.
 */
import { db } from "@/lib/db";
import type { SupplierApiType } from "@prisma/client";
import {
  ManualOrderRequiredError,
  type PriceQuery,
  type PriceQuote,
  type SupplierAdapter,
  type SupplierAdapterType,
  type SupplierCapabilities,
  type SupplierOrderResult,
  type SupplierProduct,
} from "./types";

export interface ManualAdapterOptions {
  /** Scope lookups to one supplier row. Strongly recommended: SKUs are only unique per supplier. */
  supplierId?: string;
  /** Used for DB filtering when no supplierId is given. */
  apiType?: SupplierApiType;
  name?: string;
  type?: SupplierAdapterType;
}

export class ManualSupplierAdapter implements SupplierAdapter {
  readonly name: string;
  readonly type: SupplierAdapterType;
  readonly capabilities: SupplierCapabilities = {
    search: false,
    livePricing: false,
    autoOrder: false,
    orderTracking: false,
  };

  constructor(protected readonly opts: ManualAdapterOptions = {}) {
    this.name = opts.name ?? "Manual supplier";
    this.type = opts.type ?? "manual";
  }

  protected scope() {
    if (this.opts.supplierId) return { supplierId: this.opts.supplierId };
    if (this.opts.apiType) return { supplier: { apiType: this.opts.apiType } };
    return {};
  }

  /** Searches the listings already imported for this supplier, not an external catalog. */
  async searchProducts(query: string): Promise<SupplierProduct[]> {
    const rows = await db.productSupplier.findMany({
      where: {
        ...this.scope(),
        product: { title: { contains: query, mode: "insensitive" } },
      },
      include: { product: true },
      take: 50,
    });
    return rows.map((ps) => this.toSupplierProduct(ps));
  }

  async getProductDetails(sku: string): Promise<SupplierProduct> {
    const ps = await db.productSupplier.findFirst({
      where: { ...this.scope(), supplierSku: sku },
      include: { product: true },
    });
    if (!ps) throw new Error(`No listing with supplier SKU ${sku} for ${this.name}`);
    return this.toSupplierProduct(ps);
  }

  async getPrice(q: PriceQuery): Promise<PriceQuote> {
    const ps = await db.productSupplier.findFirst({
      where: { ...this.scope(), supplierSku: q.sku },
    });
    if (!ps) throw new Error(`No listing with supplier SKU ${q.sku} for ${this.name}`);
    return {
      costPrice: ps.costPrice,
      shippingCost: ps.shippingCost,
      inStock: ps.inStock,
      stockQty: ps.stockQty ?? undefined,
      estimatedDeliveryDays: ps.estimatedDeliveryDays ?? undefined,
      warehouseCountry: ps.warehouseCountry ?? undefined,
      sourceCurrency: ps.sourceCurrency ?? undefined,
      sourceCostPrice: ps.sourceCostPrice ?? undefined,
    };
  }

  async checkStock(q: PriceQuery): Promise<boolean> {
    const ps = await db.productSupplier.findFirst({
      where: { ...this.scope(), supplierSku: q.sku },
      select: { inStock: true },
    });
    return ps?.inStock ?? false;
  }

  async placeOrder(): Promise<SupplierOrderResult> {
    throw new ManualOrderRequiredError(this.name);
  }

  private toSupplierProduct(ps: {
    id: string;
    supplierSku: string | null;
    supplierProductUrl: string;
    costPrice: number;
    shippingCost: number;
    inStock: boolean;
    stockQty: number | null;
    estimatedDeliveryDays: number | null;
    warehouseCountry: string | null;
    sourceCurrency: string | null;
    sourceCostPrice: number | null;
    product: { title: string; description: string; images: string[] };
  }): SupplierProduct {
    return {
      sku: ps.supplierSku ?? ps.id,
      title: ps.product.title,
      description: ps.product.description,
      images: ps.product.images,
      costPrice: ps.costPrice,
      shippingCost: ps.shippingCost,
      inStock: ps.inStock,
      stockQty: ps.stockQty ?? undefined,
      estimatedDeliveryDays: ps.estimatedDeliveryDays ?? undefined,
      productUrl: ps.supplierProductUrl,
      warehouseCountry: ps.warehouseCountry ?? undefined,
      sourceCurrency: ps.sourceCurrency ?? undefined,
      sourceCostPrice: ps.sourceCostPrice ?? undefined,
    };
  }
}

/** Alibaba: B2B marketplace, quotes by chat / Trade Assurance. No dropship API. */
export class AlibabaAdapter extends ManualSupplierAdapter {
  constructor(opts: ManualAdapterOptions = {}) {
    super({ ...opts, apiType: opts.apiType ?? "ALIBABA", name: opts.name ?? "Alibaba", type: "alibaba" });
  }
}

/** Made-in-China: B2B marketplace, quotes by inquiry form / email. No dropship API. */
export class MadeInChinaAdapter extends ManualSupplierAdapter {
  constructor(opts: ManualAdapterOptions = {}) {
    super({
      ...opts,
      apiType: opts.apiType ?? "MADE_IN_CHINA",
      name: opts.name ?? "Made-in-China",
      type: "made_in_china",
    });
  }
}
