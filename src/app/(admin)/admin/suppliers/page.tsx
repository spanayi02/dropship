import Link from "next/link";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Plus, Star, ExternalLink, Pencil } from "lucide-react";
import { DeleteSupplierButton } from "./delete-supplier-button";

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Suppliers",
};

const API_TYPE_STYLES: Record<string, string> = {
  MANUAL: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  ALIEXPRESS:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  CJ: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  CUSTOM:
    "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
};

export default async function SuppliersPage() {
  const suppliers = await db.supplier.findMany({
    include: {
      _count: { select: { products: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Suppliers</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {suppliers.length} supplier{suppliers.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/admin/suppliers/new">
          <Button size="sm">
            <Plus className="size-4 mr-1.5" />
            Add Supplier
          </Button>
        </Link>
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Supplier
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  API Type
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                  Products
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                  Rating
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                  Avg. Ship Days
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {suppliers.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    No suppliers yet.{" "}
                    <Link
                      href="/admin/suppliers/new"
                      className="text-primary hover:underline"
                    >
                      Add your first supplier
                    </Link>
                  </td>
                </tr>
              ) : (
                suppliers.map((supplier) => (
                  <tr
                    key={supplier.id}
                    className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/suppliers/${supplier.id}`}
                          className="font-medium hover:text-primary hover:underline"
                        >
                          {supplier.name}
                        </Link>
                        {supplier.website && (
                          <a
                            href={supplier.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <ExternalLink className="size-3.5" />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          API_TYPE_STYLES[supplier.apiType] ??
                          API_TYPE_STYLES.MANUAL
                        }`}
                      >
                        {supplier.apiType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      <Link
                        href={`/admin/suppliers/${supplier.id}`}
                        className="hover:text-primary hover:underline"
                      >
                        {supplier._count.products}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {supplier.rating != null ? (
                        <div className="inline-flex items-center gap-1 justify-end">
                          <Star className="size-3.5 fill-amber-400 text-amber-400" />
                          <span className="tabular-nums">
                            {supplier.rating.toFixed(1)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {supplier.avgShippingDays != null ? (
                        <span>{supplier.avgShippingDays}d</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/admin/suppliers/${supplier.id}/edit`}>
                          <Button variant="ghost" size="icon-sm">
                            <Pencil className="size-3.5" />
                          </Button>
                        </Link>
                        <DeleteSupplierButton
                          supplierId={supplier.id}
                          supplierName={supplier.name}
                          productCount={supplier._count.products}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
