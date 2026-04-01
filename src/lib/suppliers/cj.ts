import { SupplierAdapter, SupplierProduct, SupplierOrderInput } from "./types";

export class CJDropshippingAdapter implements SupplierAdapter {
  readonly name = "CJ Dropshipping";
  readonly type = "cj" as const;

  async searchProducts(_query: string): Promise<SupplierProduct[]> {
    throw new Error(
      "CJ Dropshipping adapter not yet implemented. Apply at https://cjdropshipping.com"
    );
  }

  async getProductDetails(_sku: string): Promise<SupplierProduct> {
    throw new Error(
      "CJ Dropshipping adapter not yet implemented. Apply at https://cjdropshipping.com"
    );
  }

  async getPrice(
    _sku: string
  ): Promise<{ costPrice: number; shippingCost: number; inStock: boolean }> {
    throw new Error(
      "CJ Dropshipping adapter not yet implemented. Apply at https://cjdropshipping.com"
    );
  }

  async checkStock(_sku: string): Promise<boolean> {
    throw new Error(
      "CJ Dropshipping adapter not yet implemented. Apply at https://cjdropshipping.com"
    );
  }

  async placeOrder(
    _input: SupplierOrderInput
  ): Promise<{ orderId: string; trackingUrl?: string }> {
    throw new Error(
      "CJ Dropshipping adapter not yet implemented. Apply at https://cjdropshipping.com"
    );
  }
}
