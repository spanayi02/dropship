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

export const csvImportRowSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  selling_price: z.coerce.number().int().positive(),
  cost_price: z.coerce.number().int().positive(),
  category: z.string().min(1),
  image_urls: z.string().min(1),
  supplier_name: z.string().min(1),
  supplier_url: z.string().url(),
  supplier_sku: z.string().optional(),
});

export type ProductInput = z.infer<typeof productSchema>;
export type ProductFilterInput = z.infer<typeof productFilterSchema>;
export type CsvImportRow = z.infer<typeof csvImportRowSchema>;
