import Link from "next/link";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Plus, Star, ExternalLink, Pencil } from "lucide-react";
import { FulfilmentBadge, SupplierTypeBadge } from "@/components/admin/badges";
import { isEuCountry } from "@/lib/store-config";
import { DeleteSupplierButton } from "./delete-supplier-button";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Suppliers",
};

export default async function SuppliersPage() {
  const suppliers = await db.supplier.findMany({
    include: {
      _count: { select: { products: true } },
    },
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
  });

  const apiCount = suppliers.filter((s) => s.apiType === "CJ").length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Suppliers</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {suppliers.length} supplier{suppliers.length !== 1 ? "s" : ""} · {apiCount} auto-ordering ·{" "}
            {suppliers.length - apiCount} manual
          </p>
        </div>
        <Link href="/admin/suppliers/new">
          <Button size="sm">
            <Plus className="size-4 mr-1.5" />
            Add supplier
          </Button>
        </Link>
      </div>

      {/* Table */}
      <div className="rounded-[4px] border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Supplier</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Fulfilment</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ships from</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Lead / transit</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Listings</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Rating</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                    No suppliers yet.{" "}
                    <Link href="/admin/suppliers/new" className="text-foreground underline underline-offset-4">
                      Add your first supplier
                    </Link>
                  </td>
                </tr>
              ) : (
                suppliers.map((supplier) => (
                  <tr
                    key={supplier.id}
                    className={`border-b last:border-0 hover:bg-muted/30 transition-colors ${
                      supplier.isActive ? "" : "opacity-60"
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/suppliers/${supplier.id}`}
                          className="font-medium hover:underline underline-offset-4"
                        >
                          {supplier.name}
                        </Link>
                        {supplier.website && (
                          <a
                            href={supplier.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground"
                            aria-label="Open supplier website"
                          >
                            <ExternalLink className="size-3.5" />
                          </a>
                        )}
                        {!supplier.isActive && (
                          <span className="label-sign rounded-[2px] bg-muted px-1.5 py-0.5 text-muted-foreground">
                            inactive
                          </span>
                        )}
                      </div>
                      {supplier.paymentTerms && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[280px]">
                          {supplier.paymentTerms}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <SupplierTypeBadge type={supplier.apiType} />
                    </td>
                    <td className="px-4 py-3">
                      <FulfilmentBadge apiType={supplier.apiType} />
                    </td>
                    <td className="px-4 py-3">
                      {supplier.warehouseCountry ? (
                        <span className="inline-flex items-center gap-1.5 font-mono text-xs">
                          <span
                            className={`size-1.5 rounded-full ${
                              isEuCountry(supplier.warehouseCountry) ? "bg-go" : "bg-muted-foreground/50"
                            }`}
                          />
                          {supplier.warehouseCountry}
                          {isEuCountry(supplier.warehouseCountry) && (
                            <span className="text-muted-foreground">EU</span>
                          )}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-xs">
                      {supplier.leadTimeDays != null || supplier.avgShippingDays != null ? (
                        <span>
                          {supplier.leadTimeDays ?? "—"}d
                          <span className="text-muted-foreground"> + </span>
                          {supplier.avgShippingDays ?? "—"}d
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      <Link href={`/admin/suppliers/${supplier.id}`} className="hover:underline underline-offset-4">
                        {supplier._count.products}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {supplier.rating != null ? (
                        <div className="inline-flex items-center gap-1 justify-end">
                          <Star className="size-3.5 fill-signal-deep text-signal-deep" />
                          <span className="tabular-nums">{supplier.rating.toFixed(1)}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/admin/suppliers/${supplier.id}/edit`}>
                          <Button variant="ghost" size="icon-sm" aria-label="Edit supplier">
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

      <p className="text-xs text-muted-foreground">
        Lead / transit: days from order to dispatch (production time for B2B factories) + carrier days to the
        customer. Configuration guide for each supplier type: see <span className="font-mono">README.md</span>.
      </p>
    </div>
  );
}
