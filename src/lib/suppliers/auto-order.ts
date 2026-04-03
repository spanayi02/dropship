/**
 * Auto-order: when a customer pays, automatically place orders with suppliers.
 * Called from the Stripe webhook after checkout.session.completed.
 *
 * Supports CJ Dropshipping (apiType = "CJ") and manual suppliers (skipped — admin handles).
 */

import { db } from "@/lib/db";
import { getSupplierAdapter } from "./factory";

export async function autoPlaceSupplierOrders(orderId: string): Promise<void> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      orderItems: {
        include: {
          product: true,
          supplierOrder: true,
        },
      },
    },
  });

  if (!order) {
    console.error(`[auto-order] Order not found: ${orderId}`);
    return;
  }

  for (const item of order.orderItems) {
    // Skip if a supplier order was already placed for this item
    if (item.supplierOrder) continue;

    const supplierId = item.selectedSupplierId;
    if (!supplierId) {
      console.warn(`[auto-order] No supplier selected for item ${item.id}, skipping`);
      continue;
    }

    const supplier = await db.supplier.findUnique({ where: { id: supplierId } });
    if (!supplier) continue;

    // Only auto-order for CJ; manual suppliers require admin action
    if (supplier.apiType !== "CJ") {
      // Create a PENDING supplier order so admin can see it needs manual action
      await db.supplierOrder.create({
        data: {
          orderItemId: item.id,
          supplierId,
          status: "PENDING",
        },
      });
      continue;
    }

    const productSupplier = await db.productSupplier.findUnique({
      where: { productId_supplierId: { productId: item.productId, supplierId } },
    });

    if (!productSupplier?.supplierSku) {
      console.warn(
        `[auto-order] Missing supplierSku for product ${item.productId} / supplier ${supplierId}`
      );
      // Still create a PENDING record so admin is alerted
      await db.supplierOrder.create({
        data: { orderItemId: item.id, supplierId, status: "PENDING" },
      });
      continue;
    }

    const shippingAddr = order.shippingAddress as {
      firstName: string;
      lastName: string;
      street: string;
      city: string;
      state: string;
      country: string;
      postalCode: string;
      phone?: string;
    };

    try {
      const adapter = getSupplierAdapter(supplier.apiType.toLowerCase(), supplier.apiCredentials);

      const result = await adapter.placeOrder({
        supplierSku: productSupplier.supplierSku,
        quantity: item.quantity,
        shippingAddress: shippingAddr,
      });

      await db.supplierOrder.create({
        data: {
          orderItemId: item.id,
          supplierId,
          status: "ORDERED",
          supplierOrderRef: result.orderId,
          trackingUrl: result.trackingUrl ?? null,
          orderedAt: new Date(),
        },
      });

      console.log(
        `[auto-order] Placed CJ order ${result.orderId} for item ${item.id} (order ${order.orderNumber})`
      );
    } catch (err) {
      console.error(`[auto-order] Failed to place order for item ${item.id}:`, err);
      // Create PENDING record so admin can retry manually
      await db.supplierOrder.create({
        data: { orderItemId: item.id, supplierId, status: "PENDING" },
      });
    }
  }
}
