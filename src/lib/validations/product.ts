import { z } from "zod";

export const productSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  images: z.array(z.string().url("Invalid image URL")).min(1, "At least one image is required"),
  categoryId: z.string().min(1, "Category is required"),
  sellingPrice: z.number().int().positive("Price must be a positive integer (in cents)"),
  compareAtPrice: z.number().int().positive().optional().nullable(),
  isActive: z.boolean().default(true),
  markupType: z.enum(["MULTIPLIER", "FIXED", "MANUAL"]).default("MANUAL"),
  markupValue: z.number().positive().optional().nullable(),
  autoPrice: z.boolean().default(false),
  markupFloor: z.number().int().positive().optional().nullable(),
  markupCeiling: z.number().int().positive().optional().nullable(),
});

export const productFilterSchema = z.object({
  category: z.string().optional(),
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  inStock: z.coerce.boolean().optional(),
  sort: z.enum(["price_asc", "price_desc", "newest", "best_selling", "rating"]).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
});

const SUPPLIER_TYPES = ["MANUAL", "CJ", "ALIEXPRESS", "ALIBABA", "MADE_IN_CHINA", "CUSTOM"] as const;

const optionalText = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() ? v.trim() : undefined));

/**
 * CSV import row. Prices are in store minor units (cents). The optional
 * columns exist for B2B suppliers (Alibaba, Made-in-China): the quote they
 * gave you (source_currency + source_cost_price), the MOQ and lead time.
 * See README → "CSV import" for a template.
 */
export const csvImportRowSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  selling_price: z.coerce.number().int().positive(),
  cost_price: z.coerce.number().int().positive(),
  shipping_cost: z.coerce.number().int().nonnegative().optional(),
  category: z.string().min(1),
  image_urls: z.string().min(1),
  supplier_name: z.string().min(1),
  supplier_type: optionalText.pipe(z.enum(SUPPLIER_TYPES).optional()),
  supplier_url: z.string().url(),
  supplier_sku: optionalText,
  variant_id: optionalText,
  moq: z.coerce.number().int().positive().optional(),
  lead_time_days: z.coerce.number().int().nonnegative().optional(),
  warehouse_country: optionalText.pipe(
    z.string().length(2, "warehouse_country must be a 2-letter ISO code").optional()
  ),
  source_currency: optionalText.pipe(z.string().length(3).optional()),
  source_cost_price: z.coerce.number().nonnegative().optional(),
  stock_qty: z.coerce.number().int().nonnegative().optional(),
});

export type ProductInput = z.infer<typeof productSchema>;
export type ProductFilterInput = z.infer<typeof productFilterSchema>;
export type CsvImportRow = z.infer<typeof csvImportRowSchema>;
