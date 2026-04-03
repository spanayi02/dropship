"use client";

import { useState, useTransition, useRef } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Search, Loader2, PackagePlus, ExternalLink, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { searchCJProducts, importCJProduct } from "@/app/actions/import";
import type { SupplierProduct } from "@/lib/suppliers/types";

interface Category {
  id: string;
  name: string;
}

interface ImportClientProps {
  categories: Category[];
}

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

// ─── Import modal ─────────────────────────────────────────────────────────────

function ImportModal({
  product,
  supplierId,
  categories,
  onClose,
  onImported,
}: {
  product: SupplierProduct;
  supplierId: string;
  categories: Category[];
  onClose: () => void;
  onImported: (productId: string) => void;
}) {
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [markup, setMarkup] = useState("2.5");
  const [isPending, startTransition] = useTransition();

  const markupNum = parseFloat(markup) || 2.5;
  const sellingPrice = Math.round(product.costPrice * markupNum);
  const profit = sellingPrice - product.costPrice - product.shippingCost;

  function handleImport() {
    if (!categoryId) {
      toast.error("Please select a category");
      return;
    }

    startTransition(async () => {
      const result = await importCJProduct({
        supplierId,
        categoryId,
        markupMultiplier: markupNum,
        product: {
          sku: product.sku,
          title: product.title,
          description: product.description ?? product.title,
          images: product.images,
          costPrice: product.costPrice,
          shippingCost: product.shippingCost,
          productUrl: product.productUrl,
        },
      });

      if (result.success) {
        toast.success("Product imported successfully!");
        onImported(result.productId);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-md rounded-xl border bg-background shadow-xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="font-semibold">Import Product</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Product preview */}
          <div className="flex items-center gap-3">
            {product.images[0] && (
              <div className="relative size-14 shrink-0 rounded-lg overflow-hidden border bg-muted">
                <Image
                  src={product.images[0]}
                  alt={product.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium line-clamp-2">{product.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                SKU: <span className="font-mono">{product.sku}</span>
              </p>
            </div>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Category <span className="text-destructive">*</span>
            </label>
            {categories.length === 0 ? (
              <p className="text-xs text-destructive">
                No categories yet.{" "}
                <a href="/admin/products" className="underline">
                  Create one first.
                </a>
              </p>
            ) : (
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 transition-all"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Markup */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Price Markup (multiplier)
            </label>
            <input
              type="number"
              value={markup}
              onChange={(e) => setMarkup(e.target.value)}
              min="1"
              max="20"
              step="0.1"
              className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 transition-all"
            />
            <p className="text-xs text-muted-foreground">
              e.g. 2.5× means your selling price is 2.5× the supplier cost
            </p>
          </div>

          {/* Pricing summary */}
          <div className="rounded-lg bg-muted/50 border p-3 space-y-1.5 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Supplier cost</span>
              <span>{formatPrice(product.costPrice)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Shipping cost</span>
              <span>{formatPrice(product.shippingCost)}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Your selling price</span>
              <span>{formatPrice(sellingPrice)}</span>
            </div>
            <div className="flex justify-between border-t pt-1.5">
              <span className="font-medium">Profit per sale</span>
              <span
                className={
                  profit > 0
                    ? "font-bold text-emerald-600 dark:text-emerald-400"
                    : "font-bold text-destructive"
                }
              >
                {formatPrice(profit)}
              </span>
            </div>
          </div>
        </div>

        <div className="border-t px-5 py-4 flex gap-3">
          <Button
            onClick={handleImport}
            disabled={isPending || categories.length === 0}
            className="flex-1"
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin mr-2" />
            ) : (
              <PackagePlus className="size-4 mr-2" />
            )}
            {isPending ? "Importing…" : "Import to Store"}
          </Button>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Product card ─────────────────────────────────────────────────────────────

function ProductCard({
  product,
  onImport,
  imported,
}: {
  product: SupplierProduct;
  onImport: () => void;
  imported: boolean;
}) {
  return (
    <div className="rounded-xl border bg-card flex flex-col overflow-hidden hover:shadow-md transition-shadow">
      {/* Image */}
      <div className="relative aspect-square bg-muted">
        {product.images[0] ? (
          <Image
            src={product.images[0]}
            alt={product.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground text-xs">
            No image
          </div>
        )}
        {/* Stock badge */}
        <span
          className={`absolute top-2 right-2 rounded-full px-2 py-0.5 text-xs font-medium ${
            product.inStock
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
          }`}
        >
          {product.inStock ? "In Stock" : "Out of Stock"}
        </span>
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        <p className="text-sm font-medium line-clamp-2 leading-snug">
          {product.title}
        </p>

        <div className="mt-auto space-y-1 text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>Cost</span>
            <span className="font-medium text-foreground">
              {formatPrice(product.costPrice)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Shipping</span>
            <span>{formatPrice(product.shippingCost)}</span>
          </div>
          <div className="flex justify-between border-t pt-1">
            <span>Suggested (2.5×)</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {formatPrice(Math.round(product.costPrice * 2.5))}
            </span>
          </div>
        </div>

        <div className="flex gap-2 mt-1">
          {imported ? (
            <div className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/20 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              <Check className="size-3.5" />
              Imported
            </div>
          ) : (
            <Button
              size="sm"
              className="flex-1 text-xs"
              onClick={onImport}
              disabled={!product.inStock}
            >
              <PackagePlus className="size-3.5 mr-1.5" />
              Import
            </Button>
          )}
          <a
            href={product.productUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-lg border px-2 text-muted-foreground hover:text-foreground transition-colors"
            title="View on CJ"
          >
            <ExternalLink className="size-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Main client component ────────────────────────────────────────────────────

export function ImportClient({ categories }: ImportClientProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SupplierProduct[]>([]);
  const [supplierId, setSupplierId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSearching, startSearch] = useTransition();
  const [selectedProduct, setSelectedProduct] = useState<SupplierProduct | null>(null);
  const [importedSkus, setImportedSkus] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setError(null);

    startSearch(async () => {
      const res = await searchCJProducts(query);
      if (res.success) {
        setResults(res.products);
        setSupplierId(res.supplierId);
        if (res.products.length === 0) {
          setError("No products found. Try different keywords.");
        }
      } else {
        setError(res.error);
        setResults([]);
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-3 max-w-2xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search CJ catalog… e.g. wireless earbuds, phone case, yoga mat"
            className="flex h-10 w-full rounded-lg border border-input bg-background pl-10 pr-4 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 transition-all"
          />
        </div>
        <Button type="submit" disabled={isSearching || !query.trim()}>
          {isSearching ? (
            <Loader2 className="size-4 animate-spin mr-2" />
          ) : (
            <Search className="size-4 mr-2" />
          )}
          {isSearching ? "Searching…" : "Search"}
        </Button>
      </form>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Results grid */}
      {results.length > 0 && (
        <>
          <p className="text-sm text-muted-foreground">
            {results.length} products found for{" "}
            <span className="font-medium text-foreground">"{query}"</span>
          </p>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {results.map((product) => (
              <ProductCard
                key={product.sku}
                product={product}
                imported={importedSkus.has(product.sku)}
                onImport={() => setSelectedProduct(product)}
              />
            ))}
          </div>
        </>
      )}

      {/* Empty state */}
      {results.length === 0 && !error && !isSearching && (
        <div className="rounded-xl border border-dashed p-16 text-center text-muted-foreground">
          <Search className="size-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Search the CJ catalog</p>
          <p className="text-sm mt-1">
            Type any product keyword above — earphones, phone cases, LED strips,
            pet toys, anything.
          </p>
        </div>
      )}

      {/* Import modal */}
      {selectedProduct && (
        <ImportModal
          product={selectedProduct}
          supplierId={supplierId}
          categories={categories}
          onClose={() => setSelectedProduct(null)}
          onImported={(productId) => {
            setImportedSkus((prev) => new Set(prev).add(selectedProduct.sku));
            setSelectedProduct(null);
            toast.success(
              <span>
                Imported!{" "}
                <a
                  href={`/admin/products/${productId}`}
                  className="underline font-medium"
                >
                  View product →
                </a>
              </span>
            );
          }}
        />
      )}
    </div>
  );
}
