"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { generateSlug } from "@/lib/utils";
import { CJDropshippingAdapter } from "@/lib/suppliers/cj";
import type { SupplierProduct } from "@/lib/suppliers/types";

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
}

// ─── search ───────────────────────────────────────────────────────────────────

export async function searchCJProducts(
  query: string
): Promise<
  | { success: true; products: SupplierProduct[]; supplierId: string }
  | { success: false; error: string }
> {
  await requireAdmin();

  if (!query.trim()) {
    return { success: true, products: [], supplierId: "" };
  }

  // Find the first CJ supplier that has credentials
  const supplier = await db.supplier.findFirst({
    where: { apiType: "CJ", apiCredentials: { not: Prisma.DbNull } },
  });

  if (!supplier) {
    return {
      success: false,
      error:
        "No CJ Dropshipping supplier configured. Go to Suppliers → Add Supplier, choose CJ Dropshipping and enter your email + API key.",
    };
  }

  try {
    const creds = supplier.apiCredentials as { email: string; apiKey: string };
    const adapter = new CJDropshippingAdapter(creds);
    const products = await adapter.searchProducts(query);
    return { success: true, products, supplierId: supplier.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "CJ API error";
    return { success: false, error: msg };
  }
}

// ─── import ───────────────────────────────────────────────────────────────────

export interface ImportProductInput {
  supplierId: string;
  categoryId: string;
  markupMultiplier: number; // e.g. 2.5
  product: {
    sku: string;
    title: string;
    description: string;
    images: string[];
    costPrice: number;
    shippingCost: number;
    productUrl: string;
  };
}

export async function importCJProduct(
  input: ImportProductInput
): Promise<{ success: true; productId: string } | { success: false; error: string }> {
  await requireAdmin();

  const { supplierId, categoryId, markupMultiplier, product } = input;

  // Verify supplier + category exist
  const [supplier, category] = await Promise.all([
    db.supplier.findUnique({ where: { id: supplierId } }),
    db.category.findUnique({ where: { id: categoryId } }),
  ]);

  if (!supplier) return { success: false, error: "Supplier not found" };
  if (!category) return { success: false, error: "Category not found" };

  // Build unique slug
  let slug = generateSlug(product.title);
  const existing = await db.product.findUnique({ where: { slug } });
  if (existing) slug = `${slug}-${Date.now()}`;

  const totalCost = product.costPrice + product.shippingCost;
  const sellingPrice = Math.round(product.costPrice * markupMultiplier);

  try {
    const created = await db.product.create({
      data: {
        title: product.title,
        slug,
        description: product.description || product.title,
        images: product.images,
        categoryId,
        sellingPrice,
        markupType: "MULTIPLIER",
        markupValue: markupMultiplier,
        autoPrice: true,
        isActive: true,
        suppliers: {
          create: {
            supplierId,
            supplierProductUrl: product.productUrl,
            supplierSku: product.sku,
            costPrice: product.costPrice,
            shippingCost: product.shippingCost,
            totalCost,
            inStock: true,
          },
        },
      },
    });

    revalidatePath("/admin/products");
    revalidatePath("/products");

    return { success: true, productId: created.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Database error";
    return { success: false, error: msg };
  }
}

// ─── categories helper ────────────────────────────────────────────────────────

export async function getCategories() {
  return db.category.findMany({
    where: { parentId: null },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}
