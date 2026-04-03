"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Prisma, SupplierApiType } from "@prisma/client";
import { updateSupplierPrice } from "@/lib/pricing/engine";

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
}

export interface UpsertSupplierData {
  name: string;
  website?: string;
  apiType?: SupplierApiType;
  apiCredentials?: Record<string, string>;
  rating?: number;
  avgShippingDays?: number;
}

export async function upsertSupplier(
  data: UpsertSupplierData,
  id?: string
): Promise<{ success: boolean; supplierId?: string; error?: string }> {
  try {
    await requireAdmin();

    const payload = {
      name: data.name,
      website: data.website ?? null,
      apiType: data.apiType ?? "MANUAL",
      apiCredentials: data.apiCredentials ?? Prisma.DbNull,
      rating: data.rating ?? null,
      avgShippingDays: data.avgShippingDays ?? null,
    };

    if (id) {
      const supplier = await db.supplier.update({ where: { id }, data: payload });
      revalidatePath("/admin/suppliers");
      revalidatePath(`/admin/suppliers/${id}`);
      return { success: true, supplierId: supplier.id };
    } else {
      const supplier = await db.supplier.create({ data: payload });
      revalidatePath("/admin/suppliers");
      return { success: true, supplierId: supplier.id };
    }
  } catch (error) {
    console.error("[upsertSupplier]", error);
    return { success: false, error: "Failed to save supplier" };
  }
}

export async function deleteSupplier(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();

    // Check for active product associations
    const activeProducts = await db.productSupplier.count({
      where: {
        supplierId: id,
        product: { isActive: true },
      },
    });

    if (activeProducts > 0) {
      return {
        success: false,
        error: `Cannot delete: supplier has ${activeProducts} active product(s)`,
      };
    }

    await db.supplier.delete({ where: { id } });

    revalidatePath("/admin/suppliers");
    return { success: true };
  } catch (error) {
    console.error("[deleteSupplier]", error);
    return { success: false, error: "Failed to delete supplier" };
  }
}

export async function lockSupplier(
  productId: string,
  supplierId: string,
  locked: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();

    await db.productSupplier.update({
      where: { productId_supplierId: { productId, supplierId } },
      data: { isLocked: locked },
    });

    revalidatePath(`/admin/suppliers/${supplierId}`);
    return { success: true };
  } catch (error) {
    console.error("[lockSupplier]", error);
    return { success: false, error: "Failed to update lock status" };
  }
}

export async function updateProductSupplierPrice(
  productId: string,
  supplierId: string,
  costPrice: number,
  shippingCost: number,
  inStock: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();

    await updateSupplierPrice(productId, supplierId, costPrice, shippingCost, inStock);

    revalidatePath(`/admin/suppliers/${supplierId}`);
    revalidatePath("/admin/suppliers");

    return { success: true };
  } catch (error) {
    console.error("[updateProductSupplierPrice]", error);
    return { success: false, error: "Failed to update supplier price" };
  }
}
