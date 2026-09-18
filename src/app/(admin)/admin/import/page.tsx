import Link from "next/link";
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
          Search CJ Dropshipping&apos;s catalog and add products to the board. B2B suppliers
          (Alibaba, Made-in-China) are imported from CSV on the Products page.
        </p>
      </div>

      {/* No CJ supplier warning */}
      {(!cjSupplier || !cjSupplier.apiCredentials) && (
        <div className="rounded-[3px] border border-signal-deep/60 bg-signal/15 p-4">
          <p className="text-sm font-medium text-foreground">
            CJ Dropshipping not configured
          </p>
          <p className="text-sm text-foreground/80 mt-1">
            Go to{" "}
            <Link href="/admin/suppliers/new" className="underline font-medium">
              Suppliers → Add Supplier
            </Link>
            , select <strong>CJ Dropshipping</strong> as the type and paste your CJ API key
            (My CJ → Apps → API). Or set <span className="font-mono">CJ_API_KEY</span> in the environment.
          </p>
        </div>
      )}

      {/* No categories warning */}
      {categories.length === 0 && (
        <div className="rounded-[3px] border border-signal-deep/60 bg-signal/15 p-4">
          <p className="text-sm font-medium text-foreground">
            No categories yet
          </p>
          <p className="text-sm text-foreground/80 mt-1">
            You need at least one category before importing. Create one in{" "}
            <Link href="/admin/products/new" className="underline font-medium">
              Products
            </Link>
            .
          </p>
        </div>
      )}

      <ImportClient categories={categories} />
    </div>
  );
}
