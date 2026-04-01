"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { OrderStatus } from "@prisma/client";

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();

    await db.order.update({
      where: { id: orderId },
      data: { status },
    });

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);

    return { success: true };
  } catch (error) {
    console.error("[updateOrderStatus]", error);
    return { success: false, error: "Failed to update order status" };
  }
}

export async function markSupplierOrderOrdered(
  supplierOrderId: string,
  ref: string,
  tracking?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();

    await db.supplierOrder.update({
      where: { id: supplierOrderId },
      data: {
        status: "ORDERED",
        supplierOrderRef: ref,
        trackingNumber: tracking ?? null,
        orderedAt: new Date(),
      },
    });

    revalidatePath("/admin/orders/queue");

    return { success: true };
  } catch (error) {
    console.error("[markSupplierOrderOrdered]", error);
    return { success: false, error: "Failed to mark supplier order as ordered" };
  }
}

export async function markSupplierOrderShipped(
  supplierOrderId: string,
  tracking: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();

    await db.supplierOrder.update({
      where: { id: supplierOrderId },
      data: {
        status: "SHIPPED",
        trackingNumber: tracking,
        shippedAt: new Date(),
      },
    });

    revalidatePath("/admin/orders/queue");

    return { success: true };
  } catch (error) {
    console.error("[markSupplierOrderShipped]", error);
    return { success: false, error: "Failed to mark supplier order as shipped" };
  }
}

export async function bulkUpdateOrderStatus(
  orderIds: string[],
  status: OrderStatus
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    await requireAdmin();

    if (orderIds.length === 0) {
      return { success: false, error: "No orders selected" };
    }

    const result = await db.order.updateMany({
      where: { id: { in: orderIds } },
      data: { status },
    });

    revalidatePath("/admin/orders");

    return { success: true, count: result.count };
  } catch (error) {
    console.error("[bulkUpdateOrderStatus]", error);
    return { success: false, error: "Failed to bulk update orders" };
  }
}
