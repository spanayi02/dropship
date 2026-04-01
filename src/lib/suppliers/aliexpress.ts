import { SupplierAdapter, SupplierProduct, SupplierOrderInput } from "./types";

export class AliExpressAdapter implements SupplierAdapter {
  readonly name = "AliExpress";
  readonly type = "aliexpress" as const;

  async searchProducts(_query: string): Promise<SupplierProduct[]> {
    throw new Error(
      "AliExpress adapter not yet implemented. Apply for API access at https://portals.aliexpress.com"
    );
  }

  async getProductDetails(_sku: string): Promise<SupplierProduct> {
    throw new Error(
      "AliExpress adapter not yet implemented. Apply for API access at https://portals.aliexpress.com"
    );
  }

  async getPrice(
    _sku: string
  ): Promise<{ costPrice: number; shippingCost: number; inStock: boolean }> {
    throw new Error(
      "AliExpress adapter not yet implemented. Apply for API access at https://portals.aliexpress.com"
    );
  }

  async checkStock(_sku: string): Promise<boolean> {
    throw new Error(
      "AliExpress adapter not yet implemented. Apply for API access at https://portals.aliexpress.com"
    );
  }

  async placeOrder(
    _input: SupplierOrderInput
  ): Promise<{ orderId: string; trackingUrl?: string }> {
    throw new Error(
      "AliExpress adapter not yet implemented. Apply for API access at https://portals.aliexpress.com"
    );
  }
}
