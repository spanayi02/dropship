"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { PlusCircle, Trash2 } from "lucide-react";
import type { Product, Category, ProductSupplier } from "@prisma/client";

import { productSchema, type ProductInput } from "@/lib/validations/product";
import { generateSlug } from "@/lib/utils";
import { upsertProduct } from "@/app/actions/products";
import { Button } from "@/components/ui/button";

type ProductWithRelations = Product & {
  category: Category;
  suppliers: ProductSupplier[];
};

interface ProductFormProps {
  product?: ProductWithRelations;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function dollarsToCents(val: string | number): number {
  const n = typeof val === "string" ? parseFloat(val) : val;
  return Math.round((n || 0) * 100);
}

function centsToDollars(cents: number | null | undefined): string {
  if (cents == null) return "";
  return (cents / 100).toFixed(2);
}

// ─── component ────────────────────────────────────────────────────────────────

export function ProductForm({ product }: ProductFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [categories, setCategories] = useState<Category[]>([]);
  const [slugManual, setSlugManual] = useState(false);
  // Manage image URLs as local state; sync into form on change
  const [imageUrls, setImageUrls] = useState<string[]>(
    product?.images?.length ? product.images : [""]
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      title: product?.title ?? "",
      slug: product?.slug ?? "",
      description: product?.description ?? "",
      images: product?.images?.length ? product.images : [""],
      categoryId: product?.categoryId ?? "",
      sellingPrice: product?.sellingPrice ?? 0,
      compareAtPrice: product?.compareAtPrice ?? undefined,
      isActive: product?.isActive ?? true,
      markupType: product?.markupType ?? "MANUAL",
      markupValue: product?.markupValue ?? undefined,
      autoPrice: product?.autoPrice ?? false,
      markupFloor: product?.markupFloor ?? undefined,
      markupCeiling: product?.markupCeiling ?? undefined,
    },
  });

  // Sync imageUrls → form field
  useEffect(() => {
    const filtered = imageUrls.filter((u) => u.trim() !== "");
    setValue("images", filtered.length ? filtered : imageUrls);
  }, [imageUrls, setValue]);

  function updateImage(index: number, value: string) {
    setImageUrls((prev) => prev.map((u, i) => (i === index ? value : u)));
  }

  function addImage() {
    setImageUrls((prev) => [...prev, ""]);
  }

  function removeImage(index: number) {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  }

  // Fetch categories
  useEffect(() => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((data: Category[]) => setCategories(data))
      .catch(() => {
        // silently ignore; fallback is manual categoryId entry
      });
  }, []);

  // Auto-generate slug from title
  const titleValue = watch("title");
  useEffect(() => {
    if (!slugManual && titleValue) {
      setValue("slug", generateSlug(titleValue), { shouldValidate: false });
    }
  }, [titleValue, slugManual, setValue]);

  const onSubmit = handleSubmit((data) => {
    startTransition(async () => {
      const result = await upsertProduct(data, product?.id);
      if (result.success) {
        toast.success(product ? "Product updated." : "Product created.");
        router.push("/admin/products");
        router.refresh();
      } else {
        toast.error(result.error ?? "Something went wrong.");
      }
    });
  });

  const markupType = watch("markupType");

  return (
    <form onSubmit={onSubmit} className="space-y-8 max-w-2xl">
      {/* Basic Info */}
      <section className="space-y-4 rounded-xl border bg-card p-5">
        <h2 className="text-sm font-semibold">Basic Information</h2>

        <div className="space-y-1">
          <label className="text-sm font-medium">Title *</label>
          <input
            {...register("title")}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/50"
            placeholder="Product title"
          />
          {errors.title && (
            <p className="text-xs text-destructive">{errors.title.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Slug *</label>
          <input
            {...register("slug")}
            onInput={() => setSlugManual(true)}
            className="w-full rounded-lg border bg-background px-3 py-2 font-mono text-sm outline-none focus:ring-2 focus:ring-ring/50"
            placeholder="product-slug"
          />
          {errors.slug && (
            <p className="text-xs text-destructive">{errors.slug.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Description *</label>
          <textarea
            {...register("description")}
            rows={4}
            className="w-full resize-y rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/50"
            placeholder="Describe the product..."
          />
          {errors.description && (
            <p className="text-xs text-destructive">{errors.description.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Category *</label>
          <select
            {...register("categoryId")}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/50"
          >
            <option value="">Select a category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
            {product?.category &&
              !categories.find((c) => c.id === product.category.id) && (
                <option value={product.category.id}>{product.category.name}</option>
              )}
          </select>
          {errors.categoryId && (
            <p className="text-xs text-destructive">{errors.categoryId.message}</p>
          )}
        </div>
      </section>

      {/* Images */}
      <section className="space-y-4 rounded-xl border bg-card p-5">
        <h2 className="text-sm font-semibold">Images</h2>
        <div className="space-y-2">
          {imageUrls.map((url, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="url"
                value={url}
                onChange={(e) => updateImage(index, e.target.value)}
                className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/50"
                placeholder="https://example.com/image.jpg"
              />
              {imageUrls.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeImage(index)}
                  aria-label="Remove image"
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              )}
            </div>
          ))}
          {errors.images && (
            <p className="text-xs text-destructive">
              {typeof errors.images === "object" && "message" in errors.images
                ? String((errors.images as { message?: string }).message)
                : "At least one valid image URL is required"}
            </p>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addImage}
          className="gap-1.5"
        >
          <PlusCircle className="size-4" />
          Add Image URL
        </Button>
      </section>

      {/* Pricing */}
      <section className="space-y-4 rounded-xl border bg-card p-5">
        <h2 className="text-sm font-semibold">Pricing</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-medium">Selling Price (USD) *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                $
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                defaultValue={centsToDollars(product?.sellingPrice)}
                onChange={(e) => setValue("sellingPrice", dollarsToCents(e.target.value))}
                className="w-full rounded-lg border bg-background pl-7 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/50"
                placeholder="0.00"
              />
            </div>
            {errors.sellingPrice && (
              <p className="text-xs text-destructive">{errors.sellingPrice.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Compare At Price (USD)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                $
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                defaultValue={centsToDollars(product?.compareAtPrice)}
                onChange={(e) => {
                  const val = e.target.value ? dollarsToCents(e.target.value) : null;
                  setValue("compareAtPrice", val);
                }}
                className="w-full rounded-lg border bg-background pl-7 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/50"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Markup */}
      <section className="space-y-4 rounded-xl border bg-card p-5">
        <h2 className="text-sm font-semibold">Markup &amp; Auto Pricing</h2>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="autoPrice"
            {...register("autoPrice")}
            className="rounded border"
          />
          <label htmlFor="autoPrice" className="text-sm font-medium">
            Auto-calculate price from cost
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-medium">Markup Type</label>
            <select
              {...register("markupType")}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/50"
            >
              <option value="MANUAL">Manual</option>
              <option value="MULTIPLIER">Multiplier (e.g. 2.5x)</option>
              <option value="FIXED">Fixed Amount</option>
            </select>
          </div>

          {markupType !== "MANUAL" && (
            <div className="space-y-1">
              <label className="text-sm font-medium">
                {markupType === "MULTIPLIER" ? "Multiplier" : "Fixed Amount (USD)"}
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                {...register("markupValue", { valueAsNumber: true })}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/50"
                placeholder={markupType === "MULTIPLIER" ? "2.5" : "10.00"}
              />
            </div>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-medium">Floor Price (USD)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                $
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                defaultValue={centsToDollars(product?.markupFloor)}
                onChange={(e) => {
                  const val = e.target.value ? dollarsToCents(e.target.value) : null;
                  setValue("markupFloor", val);
                }}
                className="w-full rounded-lg border bg-background pl-7 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/50"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Ceiling Price (USD)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                $
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                defaultValue={centsToDollars(product?.markupCeiling)}
                onChange={(e) => {
                  const val = e.target.value ? dollarsToCents(e.target.value) : null;
                  setValue("markupCeiling", val);
                }}
                className="w-full rounded-lg border bg-background pl-7 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/50"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Visibility */}
      <section className="rounded-xl border bg-card p-5">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="isActive"
            {...register("isActive")}
            className="rounded border"
          />
          <label htmlFor="isActive" className="text-sm font-medium">
            Active (visible in store)
          </label>
        </div>
      </section>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : product ? "Update Product" : "Create Product"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/products")}
          disabled={isPending}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
