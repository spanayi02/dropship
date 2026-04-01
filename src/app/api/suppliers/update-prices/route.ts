import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { updateSupplierPrice } from "@/lib/pricing/engine";
import { z } from "zod";

const updateSchema = z.object({
  updates: z.array(
    z.object({
      supplier_sku: z.string().min(1),
      supplier_id: z.string().min(1),
      cost_price: z.number().int().nonnegative(),
      shipping_cost: z.number().int().nonnegative(),
      in_stock: z.boolean(),
    })
  ),
});

export async function POST(req: NextRequest) {
  // Validate API key
  const apiKey = req.headers.get("x-api-key");
  const expectedKey = process.env.PRICE_UPDATE_API_KEY;

  if (!expectedKey) {
    console.error("[update-prices] PRICE_UPDATE_API_KEY env var not set");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  if (!apiKey || apiKey !== expectedKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse and validate body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { updates } = parsed.data;
  let updatedCount = 0;
  const errors: string[] = [];

  for (const update of updates) {
    try {
      // Find ProductSupplier by supplierSku + supplierId
      const productSupplier = await db.productSupplier.findFirst({
        where: {
          supplierSku: update.supplier_sku,
          supplierId: update.supplier_id,
        },
        select: { productId: true, supplierId: true },
      });

      if (!productSupplier) {
        errors.push(
          `No product found for sku="${update.supplier_sku}" supplierId="${update.supplier_id}"`
        );
        continue;
      }

      await updateSupplierPrice(
        productSupplier.productId,
        productSupplier.supplierId,
        update.cost_price,
        update.shipping_cost,
        update.in_stock
      );

      updatedCount++;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unknown error";
      errors.push(
        `Failed to update sku="${update.supplier_sku}": ${message}`
      );
    }
  }

  return NextResponse.json(
    {
      updated: updatedCount,
      errors,
    },
    { status: 200 }
  );
}
