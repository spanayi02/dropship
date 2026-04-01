import { SupplierAdapter, SupplierProduct, SupplierOrderInput } from "./types";
import { db } from "@/lib/db";

export class ManualSupplierAdapter implements SupplierAdapter {
  readonly name = "Manual";
  readonly type = "manual" as const;

  async searchProducts(query: string): Promise<SupplierProduct[]> {
    const products = await db.productSupplier.findMany({
      where: {
        supplier: {
          apiType: "MANUAL",
        },
        product: {
          title: { contains: query, mode: "insensitive" },
        },
      },
      include: {
        product: true,
        supplier: true,
      },
    });

    return products.map((ps) => ({
      sku: ps.supplierSku ?? ps.id,
      title: ps.product.title,
      description: ps.product.description,
      images: ps.product.images,
      costPrice: ps.costPrice,
      shippingCost: ps.shippingCost,
      inStock: ps.inStock,
      estimatedDeliveryDays: ps.estimatedDeliveryDays ?? undefined,
      productUrl: ps.supplierProductUrl,
    }));
  }

  async getProductDetails(sku: string): Promise<SupplierProduct> {
    const ps = await db.productSupplier.findFirst({
      where: { supplierSku: sku },
      include: { product: true },
    });

    if (!ps) {
      throw new Error(`Product with SKU ${sku} not found`);
    }

    return {
      sku: ps.supplierSku ?? ps.id,
      title: ps.product.title,
      description: ps.product.description,
      images: ps.product.images,
      costPrice: ps.costPrice,
      shippingCost: ps.shippingCost,
      inStock: ps.inStock,
      estimatedDeliveryDays: ps.estimatedDeliveryDays ?? undefined,
      productUrl: ps.supplierProductUrl,
    };
  }

  async getPrice(
    sku: string
  ): Promise<{ costPrice: number; shippingCost: number; inStock: boolean }> {
    const ps = await db.productSupplier.findFirst({
      where: { supplierSku: sku },
    });

    if (!ps) {
      throw new Error(`Price for SKU ${sku} not found`);
    }

    return {
      costPrice: ps.costPrice,
      shippingCost: ps.shippingCost,
      inStock: ps.inStock,
    };
  }

  async checkStock(sku: string): Promise<boolean> {
    const ps = await db.productSupplier.findFirst({
      where: { supplierSku: sku },
      select: { inStock: true },
    });
    return ps?.inStock ?? false;
  }

  async placeOrder(
    input: SupplierOrderInput
  ): Promise<{ orderId: string; trackingUrl?: string }> {
    // Manual supplier: orders are placed manually by admin
    // Return a placeholder order ID for tracking
    const orderId = `MANUAL-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    return { orderId };
  }
}
