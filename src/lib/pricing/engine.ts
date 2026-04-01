import { db } from "@/lib/db";
import { calculateMarkup } from "@/lib/utils";
import { MarkupType } from "@prisma/client";

export async function getCheapestSupplier(productId: string) {
  const suppliers = await db.productSupplier.findMany({
    where: { productId, inStock: true },
    include: { supplier: true },
    orderBy: { totalCost: "asc" },
  });

  if (suppliers.length === 0) return null;

  // Check for locked supplier first
  const locked = suppliers.find((s) => s.isLocked);
  if (locked) return locked;

  // Return cheapest
  return suppliers[0];
}

export async function autoSelectSupplierForOrder(productId: string) {
  return getCheapestSupplier(productId);
}

export async function recalculateProductPrice(productId: string) {
  const product = await db.product.findUnique({
    where: { id: productId },
    include: {
      suppliers: {
        where: { inStock: true },
        orderBy: { totalCost: "asc" },
      },
    },
  });

  if (!product || !product.autoPrice) return null;
  if (product.suppliers.length === 0) return null;

  const cheapest = product.suppliers[0];
  const settings = await db.storeSettings.findFirst();

  const markupType =
    product.markupType !== "MANUAL"
      ? product.markupType
      : settings?.globalMarkupType ?? "MULTIPLIER";

  const markupValue =
    product.markupValue ??
    settings?.globalMarkupValue ??
    2.5;

  const newPrice = calculateMarkup(
    cheapest.costPrice,
    markupType as "MULTIPLIER" | "FIXED" | "MANUAL",
    markupValue,
    product.markupFloor,
    product.markupCeiling
  );

  const oldPrice = product.sellingPrice;

  await db.product.update({
    where: { id: productId },
    data: { sellingPrice: newPrice },
  });

  // Log price history
  await db.priceHistory.create({
    data: {
      productId,
      supplierId: cheapest.supplierId,
      oldCostPrice: cheapest.costPrice,
      newCostPrice: cheapest.costPrice,
      oldSellingPrice: oldPrice,
      newSellingPrice: newPrice,
    },
  });

  return newPrice;
}

export async function updateSupplierPrice(
  productId: string,
  supplierId: string,
  costPrice: number,
  shippingCost: number,
  inStock: boolean
) {
  const existing = await db.productSupplier.findUnique({
    where: { productId_supplierId: { productId, supplierId } },
  });

  if (!existing) {
    throw new Error(`ProductSupplier not found for ${productId}/${supplierId}`);
  }

  const totalCost = costPrice + shippingCost;
  const oldCostPrice = existing.costPrice;

  // Update supplier record
  await db.productSupplier.update({
    where: { productId_supplierId: { productId, supplierId } },
    data: {
      costPrice,
      shippingCost,
      totalCost,
      inStock,
      lastChecked: new Date(),
    },
  });

  // Log price history if cost changed
  if (oldCostPrice !== costPrice) {
    const product = await db.product.findUnique({
      where: { id: productId },
      select: { sellingPrice: true },
    });

    await db.priceHistory.create({
      data: {
        productId,
        supplierId,
        oldCostPrice,
        newCostPrice: costPrice,
        oldSellingPrice: product?.sellingPrice,
        newSellingPrice: product?.sellingPrice,
      },
    });
  }

  // Recalculate product price if auto-pricing is enabled
  await recalculateProductPrice(productId);
}
