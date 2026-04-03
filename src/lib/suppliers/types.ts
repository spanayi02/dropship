export interface SupplierProduct {
  sku: string;
  title: string;
  description?: string;
  images: string[];
  costPrice: number;
  shippingCost: number;
  inStock: boolean;
  estimatedDeliveryDays?: number;
  productUrl: string;
}

export interface SupplierOrderInput {
  supplierSku: string;
  quantity: number;
  shippingAddress: {
    firstName: string;
    lastName: string;
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    phone?: string;
  };
}

export interface SupplierOrderStatus {
  status: string;
  trackingNumber?: string;
  trackingUrl?: string;
  shippedAt?: string;
}

export interface SupplierAdapter {
  readonly name: string;
  readonly type: "manual" | "aliexpress" | "cj" | "custom";

  searchProducts(query: string): Promise<SupplierProduct[]>;
  getProductDetails(sku: string): Promise<SupplierProduct>;
  getPrice(
    sku: string
  ): Promise<{ costPrice: number; shippingCost: number; inStock: boolean }>;
  checkStock(sku: string): Promise<boolean>;
  placeOrder(
    input: SupplierOrderInput
  ): Promise<{ orderId: string; trackingUrl?: string }>;
  getOrderStatus?(orderId: string): Promise<SupplierOrderStatus>;
}
