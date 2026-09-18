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

  const supplier = await db.supplier.findUnique({ where: { id } });
  if (!supplier) notFound();

  const creds = supplier.apiCredentials as { apiKey?: string } | null;
  const { apiCredentials: _omit, ...rest } = supplier;
  void _omit;

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
        <h1 className="text-2xl font-semibold tracking-tight">Edit supplier</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Update details for <span className="font-medium text-foreground">{supplier.name}</span>.
        </p>
      </div>

      <SupplierForm
        supplier={{
          id: rest.id,
          name: rest.name,
          website: rest.website,
          apiType: rest.apiType,
          hasCjApiKey: typeof creds?.apiKey === "string" && creds.apiKey.length > 0,
          rating: rest.rating,
          avgShippingDays: rest.avgShippingDays,
          warehouseCountry: rest.warehouseCountry,
          leadTimeDays: rest.leadTimeDays,
          contactEmail: rest.contactEmail,
          contactUrl: rest.contactUrl,
          paymentTerms: rest.paymentTerms,
          notes: rest.notes,
          isActive: rest.isActive,
        }}
        envHasCjKey={!!process.env.CJ_API_KEY}
      />
    </div>
  );
}
