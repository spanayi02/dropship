"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { generateSlug } from "@/lib/utils";
import {
  productSchema,
  csvImportRowSchema,
  type ProductInput,
  type CsvImportRow,
} from "@/lib/validations/product";

// ─── upsert ───────────────────────────────────────────────────────────────────

export async function upsertProduct(
  data: ProductInput,
  id?: string
): Promise<{ success: true; id: string } | { success: false; error: string }> {
  const parsed = productSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const payload = parsed.data;

  try {
    if (id) {
      const product = await db.product.update({
        where: { id },
        data: payload,
      });
      revalidatePath("/admin/products");
      revalidatePath(`/admin/products/${id}`);
      return { success: true, id: product.id };
    } else {
      const product = await db.product.create({ data: payload });
      revalidatePath("/admin/products");
      return { success: true, id: product.id };
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Database error";
    return { success: false, error: msg };
  }
}

// ─── delete (soft) ────────────────────────────────────────────────────────────

export async function deleteProduct(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await db.product.update({
      where: { id },
      data: { isActive: false },
    });
    revalidatePath("/admin/products");
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Database error";
    return { success: false, error: msg };
  }
}

// ─── toggle active ────────────────────────────────────────────────────────────

export async function toggleProductActive(
  id: string
): Promise<{ success: boolean; isActive?: boolean; error?: string }> {
  try {
    const product = await db.product.findUnique({
      where: { id },
      select: { isActive: true },
    });
    if (!product) return { success: false, error: "Product not found" };

    const updated = await db.product.update({
      where: { id },
      data: { isActive: !product.isActive },
      select: { isActive: true },
    });
    revalidatePath("/admin/products");
    return { success: true, isActive: updated.isActive };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Database error";
    return { success: false, error: msg };
  }
}

// ─── CSV import ───────────────────────────────────────────────────────────────

export async function importProductsCSV(
  rows: CsvImportRow[]
): Promise<{ created: number; errors: { row: number; message: string }[] }> {
  const errors: { row: number; message: string }[] = [];
  let created = 0;

  for (let i = 0; i < rows.length; i++) {
    const rowParsed = csvImportRowSchema.safeParse(rows[i]);
    if (!rowParsed.success) {
      errors.push({
        row: i + 1,
        message: rowParsed.error.issues[0]?.message ?? "Invalid row",
      });
      continue;
    }

    const row = rowParsed.data;

    try {
      // Upsert category by slug
      const categorySlug = generateSlug(row.category);
      const category = await db.category.upsert({
        where: { slug: categorySlug },
        create: { name: row.category, slug: categorySlug },
        update: {},
      });

      // Upsert supplier by name
      const supplier = await db.supplier.upsert({
        where: { id: `name-${generateSlug(row.supplier_name)}` },
        create: { id: `name-${generateSlug(row.supplier_name)}`, name: row.supplier_name },
        update: {},
      });

      // Build unique slug for product
      let slug = generateSlug(row.title);
      const existing = await db.product.findUnique({ where: { slug } });
      if (existing) {
        slug = `${slug}-${Date.now()}`;
      }

      const imageUrls = row.image_urls
        .split(",")
        .map((u) => u.trim())
        .filter(Boolean);

      const shippingCost = 0;
      const totalCost = row.cost_price + shippingCost;

      const product = await db.product.create({
        data: {
          title: row.title,
          slug,
          description: row.description,
          images: imageUrls,
          categoryId: category.id,
          sellingPrice: row.selling_price,
          isActive: true,
          markupType: "MANUAL",
          suppliers: {
            create: {
              supplierId: supplier.id,
              supplierProductUrl: row.supplier_url,
              supplierSku: row.supplier_sku ?? null,
              costPrice: row.cost_price,
              shippingCost,
              totalCost,
              inStock: true,
            },
          },
        },
      });

      void product; // suppress unused warning
      created++;
    } catch (err) {
      errors.push({
        row: i + 1,
        message: err instanceof Error ? err.message : "Unexpected error",
      });
    }
  }

  revalidatePath("/admin/products");
  return { created, errors };
}
