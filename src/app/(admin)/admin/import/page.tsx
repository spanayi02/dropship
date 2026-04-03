import { db } from "@/lib/db";
import { ImportClient } from "./import-client";

export const metadata = {
  title: "Import Products",
};

export default async function ImportPage() {
  const [categories, cjSupplier] = await Promise.all([
    db.category.findMany({
      where: { parentId: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.supplier.findFirst({
      where: { apiType: "CJ" },
      select: { id: true, name: true, apiCredentials: true },
    }),
  ]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Import Products
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Search CJ Dropshipping&apos;s catalog and add products to your store
          instantly.
        </p>
      </div>

      {/* No CJ supplier warning */}
      {(!cjSupplier || !cjSupplier.apiCredentials) && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-900/40 dark:bg-yellow-900/10 p-4">
          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
            CJ Dropshipping not configured
          </p>
          <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
            Go to{" "}
            <a
              href="/admin/suppliers/new"
              className="underline font-medium"
            >
              Suppliers → Add Supplier
            </a>
            , select <strong>CJ Dropshipping</strong> as the API type, then
            enter your CJ account email and API key.
          </p>
        </div>
      )}

      {/* No categories warning */}
      {categories.length === 0 && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-900/40 dark:bg-yellow-900/10 p-4">
          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
            No categories yet
          </p>
          <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
            You need at least one category before importing. Create one in{" "}
            <a href="/admin/products/new" className="underline font-medium">
              Products
            </a>
            .
          </p>
        </div>
      )}

      <ImportClient categories={categories} />
    </div>
  );
}
