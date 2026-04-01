import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ExternalLink,
  Star,
  Lock,
  Unlock,
} from "lucide-react";
import { LockSupplierToggle } from "./lock-supplier-toggle";
import { InlinePriceEditor } from "./inline-price-editor";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supplier = await db.supplier.findUnique({
    where: { id },
    select: { name: true },
  });
  return { title: supplier ? `${supplier.name} — Supplier` : "Supplier" };
}

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sort?: string }>;
}

export default async function SupplierDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const { sort } = await searchParams;

  const supplier = await db.supplier.findUnique({
    where: { id },
    include: {
      _count: { select: { products: true } },
    },
  });

  if (!supplier) notFound();

  const productSuppliers = await db.productSupplier.findMany({
    where: { supplierId: id },
    include: {
      product: {
        select: {
          id: true,
          title: true,
          sellingPrice: true,
          suppliers: {
            select: { totalCost: true },
            orderBy: { totalCost: "asc" },
            take: 1,
          },
        },
      },
    },
    orderBy:
      sort === "name"
        ? { product: { title: "asc" } }
        : { totalCost: "asc" },
  });

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Back + header */}
      <div className="flex items-start gap-3">
        <Link href="/admin/suppliers">
          <Button variant="ghost" size="icon-sm">
            <ChevronLeft className="size-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-semibold tracking-tight">
              {supplier.name}
            </h1>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
              {supplier.apiType}
            </span>
          </div>
          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground flex-wrap">
            {supplier.website && (
              <a
                href={supplier.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:text-foreground"
              >
                <ExternalLink className="size-3.5" />
                {supplier.website}
              </a>
            )}
            {supplier.rating != null && (
              <span className="inline-flex items-center gap-1">
                <Star className="size-3.5 fill-amber-400 text-amber-400" />
                {supplier.rating.toFixed(1)} rating
              </span>
            )}
            {supplier.avgShippingDays != null && (
              <span>~{supplier.avgShippingDays} day shipping</span>
            )}
            <span>{supplier._count.products} products</span>
          </div>
        </div>
        <Link href={`/admin/suppliers/${id}/edit`}>
          <Button variant="outline" size="sm">
            Edit Supplier
          </Button>
        </Link>
      </div>

      {/* Sort controls */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Sort by:</span>
        <Link
          href={`/admin/suppliers/${id}`}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            !sort || sort === "cost"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          Total Cost
        </Link>
        <Link
          href={`/admin/suppliers/${id}?sort=name`}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            sort === "name"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          Product Name
        </Link>
      </div>

      {/* Products table */}
      <div className="rounded-xl border overflow-hidden">
        <div className="px-4 py-3 border-b">
          <h2 className="font-semibold text-sm">
            Products ({productSuppliers.length})
          </h2>
        </div>
        {productSuppliers.length === 0 ? (
          <div className="px-4 py-12 text-center text-muted-foreground">
            No products linked to this supplier
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                    Product
                  </th>
                  <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">
                    Cost
                  </th>
                  <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">
                    Shipping
                  </th>
                  <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">
                    Total
                  </th>
                  <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">
                    Cheapest
                  </th>
                  <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">
                    Selling
                  </th>
                  <th className="px-4 py-2.5 text-center font-medium text-muted-foreground">
                    In Stock
                  </th>
                  <th className="px-4 py-2.5 text-center font-medium text-muted-foreground">
                    Lock
                  </th>
                  <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">
                    Edit
                  </th>
                </tr>
              </thead>
              <tbody>
                {productSuppliers.map((ps) => {
                  const cheapestCost = ps.product.suppliers[0]?.totalCost;
                  const isMoreExpensive =
                    cheapestCost != null && ps.totalCost > cheapestCost;

                  return (
                    <tr
                      key={ps.id}
                      className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/products/${ps.productId}`}
                          className="font-medium hover:text-primary hover:underline leading-tight"
                        >
                          {ps.product.title}
                        </Link>
                        {ps.supplierSku && (
                          <p className="text-xs text-muted-foreground font-mono mt-0.5">
                            {ps.supplierSku}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {formatPrice(ps.costPrice)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                        {formatPrice(ps.shippingCost)}
                      </td>
                      <td
                        className={`px-4 py-3 text-right tabular-nums font-medium ${
                          isMoreExpensive
                            ? "text-red-600 dark:text-red-400"
                            : "text-green-600 dark:text-green-400"
                        }`}
                      >
                        {formatPrice(ps.totalCost)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                        {cheapestCost != null ? formatPrice(cheapestCost) : "—"}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {formatPrice(ps.product.sellingPrice)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block size-2 rounded-full ${
                            ps.inStock ? "bg-green-500" : "bg-red-500"
                          }`}
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <LockSupplierToggle
                          productId={ps.productId}
                          supplierId={id}
                          isLocked={ps.isLocked}
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <InlinePriceEditor
                          productId={ps.productId}
                          supplierId={id}
                          currentCost={ps.costPrice}
                          currentShipping={ps.shippingCost}
                          currentInStock={ps.inStock}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
