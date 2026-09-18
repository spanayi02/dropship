/**
 * Supplier adapter contract.
 *
 * Every supplier the store can buy from is represented by an adapter. API
 * suppliers (CJ Dropshipping) implement the full contract; B2B / manual
 * suppliers (Alibaba, Made-in-China, local wholesalers, AliExpress until the
 * DS API is approved) are backed by the ProductSupplier rows the owner
 * maintains in the admin and never place orders on their own.
 *
 * Money is always in the store currency, in integer minor units (cents).
 * Adapters that quote in another currency convert with lib/suppliers/currency.
 */

export type SupplierAdapterType =
  | "manual"
  | "aliexpress"
  | "cj"
  | "alibaba"
  | "made_in_china"
  | "custom";

export interface SupplierCapabilities {
  /** Can search the supplier's own catalog (not just our DB). */
  search: boolean;
  /** Can fetch live cost / stock for a listing. */
  livePricing: boolean;
  /** Can place an order with the supplier without a human. */
  autoOrder: boolean;
  /** Can poll the supplier for order status / tracking. */
  orderTracking: boolean;
}

export interface SupplierVariant {
  /** Supplier variant id (CJ "vid"). Required for CJ orders. */
  variantId: string;
  sku?: string;
  name?: string;
  image?: string;
  /** Unit cost in store minor units. */
  costPrice: number;
  /** Total stock across warehouses, when the supplier reports it. */
  stockQty?: number;
  /** ISO-3166 alpha-2 codes of warehouses holding this variant. */
  warehouseCountries?: string[];
}

export interface SupplierProduct {
  /** Supplier product id (CJ "pid"). Stored as ProductSupplier.supplierSku. */
  sku: string;
  title: string;
  description?: string;
  images: string[];
  /** Unit cost in store minor units (cheapest variant for multi-variant products). */
  costPrice: number;
  /** Shipping to the store's default destination, in store minor units. 0 when unknown. */
  shippingCost: number;
  inStock: boolean;
  stockQty?: number;
  estimatedDeliveryDays?: number;
  productUrl: string;
  /** Warehouse the quote assumes goods ship from. */
  warehouseCountry?: string;
  /** Currency the supplier quoted in, before conversion (e.g. "USD"). */
  sourceCurrency?: string;
  /** Unit cost as quoted by the supplier, in sourceCurrency major units. */
  sourceCostPrice?: number;
  variants?: SupplierVariant[];
}

export interface PriceQuery {
  /** Supplier product id / SKU as stored in ProductSupplier.supplierSku. */
  sku: string;
  /** Supplier variant id when the supplier prices per variant (CJ vid). */
  variantId?: string | null;
  /** Destination country for the shipping quote; defaults to the store home country. */
  destinationCountry?: string;
  /** Warehouse country to ship from, when the listing pins one. */
  fromCountry?: string | null;
  quantity?: number;
}

export interface PriceQuote {
  costPrice: number;
  shippingCost: number;
  inStock: boolean;
  stockQty?: number;
  estimatedDeliveryDays?: number;
  warehouseCountry?: string;
  sourceCurrency?: string;
  sourceCostPrice?: number;
  /** Carrier the shipping quote is for (CJ logisticName). */
  shippingMethod?: string;
}

export interface SupplierOrderInput {
  /** Our reference for the order line; used for supplier-side idempotency. Max 50 chars. */
  orderNumber: string;
  supplierSku: string;
  variantId?: string | null;
  quantity: number;
  /** Warehouse country the listing is pinned to, if any. */
  fromCountry?: string | null;
  customerEmail?: string | null;
  remark?: string;
  shippingAddress: {
    firstName: string;
    lastName: string;
    street: string;
    street2?: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    phone?: string;
  };
}

export type NormalizedSupplierOrderStatus =
  | "created"
  | "unpaid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "unknown";

export interface SupplierOrderResult {
  /** Supplier's order id. Stored as SupplierOrder.supplierOrderRef. */
  orderId: string;
  status: NormalizedSupplierOrderStatus;
  trackingUrl?: string;
  /** True when the order was created but still needs a payment step on the supplier side. */
  requiresPayment?: boolean;
  /** Payment page for orders that must be paid manually. */
  paymentUrl?: string;
}

export interface SupplierOrderStatus {
  /** Raw status string from the supplier. */
  status: string;
  normalized: NormalizedSupplierOrderStatus;
  trackingNumber?: string;
  trackingUrl?: string;
  shippingMethod?: string;
  shippedAt?: string;
  deliveredAt?: string;
}

export interface SupplierAdapter {
  readonly name: string;
  readonly type: SupplierAdapterType;
  readonly capabilities: SupplierCapabilities;

  searchProducts(query: string): Promise<SupplierProduct[]>;
  getProductDetails(sku: string): Promise<SupplierProduct>;
  getPrice(query: PriceQuery): Promise<PriceQuote>;
  checkStock(query: PriceQuery): Promise<boolean>;
  placeOrder(input: SupplierOrderInput): Promise<SupplierOrderResult>;
  getOrderStatus?(orderId: string): Promise<SupplierOrderStatus>;
  /** Cheap round-trip that proves credentials work. */
  testConnection?(): Promise<{ ok: boolean; message: string }>;
}

/** Thrown when an adapter is asked to do something it is not configured for. */
export class SupplierNotConfiguredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SupplierNotConfiguredError";
  }
}

/** Thrown when a supplier only supports orders placed by a human. */
export class ManualOrderRequiredError extends Error {
  constructor(supplierName: string) {
    super(
      `${supplierName} has no ordering API. The order stays PENDING in Admin → Orders → Supplier queue until you place it by hand and enter the supplier reference.`
    );
    this.name = "ManualOrderRequiredError";
  }
}
