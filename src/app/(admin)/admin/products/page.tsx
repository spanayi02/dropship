import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CSVImportModal } from "@/components/admin/csv-import-modal";
import { ProductRowActions } from "@/components/admin/product-row-actions";
import { PlusCircle, Search } from "lucide-react";

export const dynamic = 'force-dynamic';

interface SearchParams {
  search?: string;
  category?: string;
}

interface PageProps {
  searchParams: Promise<SearchParams>;
}

export default async function AdminProductsPage({ searchParams }: PageProps) {
  const { search, category } = await searchParams;

  const [products, categories] = await Promise.all([
    db.product.findMany({
      where: {
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: "insensitive" } },
                { slug: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
        ...(category ? { category: { slug: category } } : {}),
      },
      include: {
        category: true,
        suppliers: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    db.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground">{products.length} product{products.length !== 1 ? "s" : ""} found</p>
        </div>
        <div className="flex items-center gap-2">
          <CSVImportModal />
          <Link href="/admin/products/new">
            <Button size="sm" className="gap-1.5">
              <PlusCircle className="size-4" />
              Add Product
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <form method="GET" className="flex flex-wrap gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              name="search"
              defaultValue={search ?? ""}
              placeholder="Search products…"
              className="h-8 rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring/50 w-56"
            />
          </div>
          <select
            name="category"
            defaultValue={category ?? ""}
            className="h-8 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/50"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
          <Button type="submit" variant="outline" size="sm">
            Filter
          </Button>
          {(search || category) && (
            <Link href="/admin/products">
              <Button variant="ghost" size="sm">
                Clear
              </Button>
            </Link>
          )}
        </form>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-xs text-muted-foreground">
              <th className="px-4 py-3 text-left font-medium">Image</th>
              <th className="px-4 py-3 text-left font-medium">Title</th>
              <th className="px-4 py-3 text-left font-medium">Category</th>
              <th className="px-4 py-3 text-right font-medium">Selling Price</th>
              <th className="px-4 py-3 text-right font-medium">Cost</th>
              <th className="px-4 py-3 text-right font-medium">Margin</th>
              <th className="px-4 py-3 text-center font-medium">Active</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {products.map((product) => {
              const minCost =
                product.suppliers.length > 0
                  ? Math.min(...product.suppliers.map((s) => s.totalCost))
                  : null;
              const margin =
                minCost !== null && product.sellingPrice > 0
                  ? Math.round(
                      ((product.sellingPrice - minCost) / product.sellingPrice) * 100
                    )
                  : null;

              return (
                <tr key={product.id} className="hover:bg-muted/30 transition-colors">
                  {/* Image */}
                  <td className="px-4 py-3">
                    {product.images[0] ? (
                      <div className="relative size-8 overflow-hidden rounded-md border">
                        <Image
                          src={product.images[0]}
                          alt={product.title}
                          fill
                          className="object-cover"
                          sizes="32px"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="size-8 rounded-md border bg-muted" />
                    )}
                  </td>

                  {/* Title */}
                  <td className="px-4 py-3 max-w-[220px]">
                    <p className="font-medium truncate">{product.title}</p>
                    <p className="text-xs text-muted-foreground font-mono truncate">{product.slug}</p>
                  </td>

                  {/* Category */}
                  <td className="px-4 py-3 text-muted-foreground">
                    {product.category.name}
                  </td>

                  {/* Selling Price */}
                  <td className="px-4 py-3 text-right font-medium tabular-nums">
                    {formatPrice(product.sellingPrice)}
                  </td>

                  {/* Cost */}
                  <td className="px-4 py-3 text-right text-muted-foreground tabular-nums">
                    {minCost !== null ? formatPrice(minCost) : "—"}
                  </td>

                  {/* Margin */}
                  <td className="px-4 py-3 text-right tabular-nums">
                    {margin !== null ? (
                      <span
                        className={
                          margin >= 30
                            ? "text-emerald-600"
                            : margin >= 10
                            ? "text-yellow-600"
                            : "text-destructive"
                        }
                      >
                        {margin}%
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>

                  {/* Active */}
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block size-2 rounded-full ${
                        product.isActive ? "bg-emerald-500" : "bg-muted-foreground/40"
                      }`}
                    />
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <ProductRowActions productId={product.id} isActive={product.isActive} />
                  </td>
                </tr>
              );
            })}
            {products.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                  No products found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
