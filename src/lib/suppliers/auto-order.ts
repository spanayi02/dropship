/**
 * Auto-order: when a customer pays, place the order with each line's
 * selected supplier. Called from the Stripe webhook after
 * checkout.session.completed, and again by the retry cron for lines that
 * failed.
 *
 * API suppliers (CJ) are ordered here. Everything else (manual, AliExpress,
 * Alibaba, Made-in-China) gets a PENDING SupplierOrder so it shows up in
 * Admin → Orders → Supplier queue for the owner to place by hand.
 */

import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { toCountryCode } from "@/lib/countries";
import { adapterForSupplier, isApiSupplier } from "./factory";
import type { SupplierOrderInput } from "./types";

type ShippingAddress = SupplierOrderInput["shippingAddress"];

export function parseShippingAddress(raw: Prisma.JsonValue): ShippingAddress {
  const a = (raw ?? {}) as Record<string, unknown>;
  const s = (k: string) => (typeof a[k] === "string" ? (a[k] as string) : "");
  return {
    firstName: s("firstName"),
    lastName: s("lastName"),
    street: s("street") || s("address") || s("line1"),
    street2: s("street2") || s("line2") || undefined,
    city: s("city"),
    state: s("state") || s("province") || s("region"),
    // Checkout stores what the customer typed ("Cyprus", "Κύπρος"); suppliers need ISO codes.
    country: toCountryCode(s("countryCode") || s("country")) ?? (s("country") || s("countryCode")),
    postalCode: s("postalCode") || s("zip"),
    phone: s("phone") || undefined,
  };
}

/** Our reference sent to the supplier: order number + line suffix, unique and ≤ 50 chars. */
export function supplierOrderReference(orderNumber: string, orderItemId: string): string {
  return `${orderNumber}-${orderItemId.slice(-6).toUpperCase()}`.slice(0, 50);
}

export interface PlaceLineResult {
  ok: boolean;
  supplierOrderRef?: string;
  requiresPayment?: boolean;
  error?: string;
}

/**
 * Place (or re-place) one order line with its supplier and record the result
 * on the SupplierOrder row. Idempotent: an existing ORDERED row is left alone.
 */
export async function placeSupplierOrderForItem(orderItemId: string): Promise<PlaceLineResult> {
  const item = await db.orderItem.findUnique({
    where: { id: orderItemId },
    include: {
      order: { include: { user: { select: { email: true } } } },
      product: { select: { id: true, title: true } },
      supplierOrder: true,
    },
  });
  if (!item) return { ok: false, error: `Order item ${orderItemId} not found` };
  if (item.supplierOrder?.status && item.supplierOrder.status !== "PENDING") {
    return { ok: true, supplierOrderRef: item.supplierOrder.supplierOrderRef ?? undefined };
  }

  const supplierId = item.selectedSupplierId;
  if (!supplierId) return { ok: false, error: "No supplier selected for this line" };

  const supplier = await db.supplier.findUnique({ where: { id: supplierId } });
  if (!supplier) return { ok: false, error: `Supplier ${supplierId} no longer exists` };

  const ensurePending = async () => {
    if (!item.supplierOrder) {
      await db.supplierOrder.create({
        data: { orderItemId: item.id, supplierId, status: "PENDING" },
      });
    }
  };

  if (!isApiSupplier(supplier.apiType)) {
    await ensurePending();
    return { ok: false, error: `${supplier.name} is a manual supplier; queued for the owner` };
  }

  const listing = await db.productSupplier.findUnique({
    where: { productId_supplierId: { productId: item.productId, supplierId } },
  });
  if (!listing?.supplierSku) {
    await ensurePending();
    return { ok: false, error: `Listing for "${item.product.title}" has no supplier SKU` };
  }

  const order = item.order;
  const reference = supplierOrderReference(order.orderNumber, item.id);

  try {
    const adapter = adapterForSupplier(supplier);
    const result = await adapter.placeOrder({
      orderNumber: reference,
      supplierSku: listing.supplierSku,
      variantId: listing.variantId,
      quantity: item.quantity,
      fromCountry: listing.warehouseCountry ?? supplier.warehouseCountry,
      customerEmail: order.user?.email ?? order.guestEmail,
      remark: `WishlistAZ ${order.orderNumber}`,
      shippingAddress: parseShippingAddress(order.shippingAddress),
    });

    const data = {
      status: "ORDERED" as const,
      supplierOrderRef: result.orderId,
      trackingUrl: result.trackingUrl ?? null,
      orderedAt: new Date(),
    };
    if (item.supplierOrder) {
      await db.supplierOrder.update({ where: { id: item.supplierOrder.id }, data });
    } else {
      await db.supplierOrder.create({ data: { orderItemId: item.id, supplierId, ...data } });
    }

    console.log(
      `[auto-order] ${supplier.name} order ${result.orderId} placed for ${order.orderNumber} line ${item.id}` +
        (result.requiresPayment ? " — needs payment in the supplier dashboard" : "")
    );
    return { ok: true, supplierOrderRef: result.orderId, requiresPayment: result.requiresPayment };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[auto-order] Failed for line ${item.id} (${order.orderNumber}):`, message);
    await ensurePending();
    return { ok: false, error: message };
  }
}

export async function autoPlaceSupplierOrders(orderId: string): Promise<void> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { orderItems: { select: { id: true, supplierOrder: { select: { id: true } } } } },
  });

  if (!order) {
    console.error(`[auto-order] Order not found: ${orderId}`);
    return;
  }

  for (const item of order.orderItems) {
    if (item.supplierOrder) continue; // already handled (retry or a previous webhook delivery)
    await placeSupplierOrderForItem(item.id);
  }
}
