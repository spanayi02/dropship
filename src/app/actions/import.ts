"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateSlug } from "@/lib/utils";
import { adapterForSupplier, findImportableCJSupplier } from "@/lib/suppliers/factory";
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

  const supplier = await findImportableCJSupplier();
  if (!supplier) {
    return {
      success: false,
      error:
        "No CJ Dropshipping supplier configured. Go to Suppliers → Add Supplier, choose CJ Dropshipping and paste your CJ API key (or set CJ_API_KEY in the environment).",
    };
  }

  try {
    const adapter = adapterForSupplier(supplier);
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

  const [supplier, category] = await Promise.all([
    db.supplier.findUnique({ where: { id: supplierId } }),
    db.category.findUnique({ where: { id: categoryId } }),
  ]);

  if (!supplier) return { success: false, error: "Supplier not found" };
  if (!category) return { success: false, error: "Category not found" };

  const existingListing = await db.productSupplier.findFirst({
    where: { supplierId, supplierSku: product.sku },
    select: { productId: true },
  });
  if (existingListing) {
    return { success: false, error: "This CJ product is already in your catalog." };
  }

  // Search results are product-level. CJ prices, stocks and ships per variant,
  // so fetch the detail, pick the variant to sell and quote its real shipping.
  let variantId: string | null = null;
  let costPrice = product.costPrice;
  let shippingCost = product.shippingCost;
  let images = product.images;
  let description = product.description;
  let warehouseCountry: string | null = supplier.warehouseCountry ?? null;
  let estimatedDeliveryDays: number | null = supplier.avgShippingDays ?? null;
  let stockQty: number | null = null;
  let sourceCostPrice: number | null = null;
  let inStock = true;

  try {
    const adapter = adapterForSupplier(supplier);
    const details = await adapter.getProductDetails(product.sku);
    if (details.images.length) images = details.images;
    if (details.description) description = details.description;

    const variant =
      adapter instanceof CJDropshippingAdapter ? adapter.pickVariant(details) : details.variants?.[0];
    if (variant) {
      variantId = variant.variantId;
      const quote = await adapter.getPrice({
        sku: product.sku,
        variantId: variant.variantId,
        fromCountry: supplier.warehouseCountry,
      });
      costPrice = quote.costPrice;
      shippingCost = quote.shippingCost;
      inStock = quote.inStock;
      stockQty = quote.stockQty ?? null;
      warehouseCountry = quote.warehouseCountry ?? warehouseCountry;
      estimatedDeliveryDays = quote.estimatedDeliveryDays ?? estimatedDeliveryDays;
      sourceCostPrice = quote.sourceCostPrice ?? null;
    }
  } catch (err) {
    // Import still works with search-level data; the price sync cron fills in the rest.
    console.warn(`[import] Could not enrich CJ product ${product.sku}:`, err instanceof Error ? err.message : err);
  }

  let slug = generateSlug(product.title);
  const existing = await db.product.findUnique({ where: { slug } });
  if (existing) slug = `${slug}-${Date.now()}`;

  const totalCost = costPrice + shippingCost;
  const sellingPrice = Math.round(costPrice * markupMultiplier);

  try {
    const created = await db.product.create({
      data: {
        title: product.title,
        slug,
        description: description || product.title,
        images,
        categoryId,
        sellingPrice,
        markupType: "MULTIPLIER",
        markupValue: markupMultiplier,
        autoPrice: true,
        isActive: inStock,
        suppliers: {
          create: {
            supplierId,
            supplierProductUrl: product.productUrl,
            supplierSku: product.sku,
            variantId,
            costPrice,
            shippingCost,
            totalCost,
            inStock,
            stockQty,
            warehouseCountry,
            estimatedDeliveryDays,
            sourceCurrency: "USD",
            sourceCostPrice,
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
