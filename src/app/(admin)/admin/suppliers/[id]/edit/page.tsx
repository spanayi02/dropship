import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { db } from "@/lib/db";
import { SupplierForm } from "@/components/admin/supplier-form";

export const metadata = {
  title: "Edit Supplier",
};

interface EditSupplierPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditSupplierPage({ params }: EditSupplierPageProps) {
  const { id } = await params;

  const supplier = await db.supplier.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      website: true,
      apiType: true,
      apiCredentials: true,
      rating: true,
      avgShippingDays: true,
    },
  });

  if (!supplier) {
    notFound();
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <Link
          href="/admin/suppliers"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ChevronLeft className="size-4" />
          Back to suppliers
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          Edit Supplier
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Update details for{" "}
          <span className="font-medium text-foreground">{supplier.name}</span>.
        </p>
      </div>

      <SupplierForm supplier={supplier} />
    </div>
  );
}
