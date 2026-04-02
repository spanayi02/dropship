import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { SupplierForm } from "@/components/admin/supplier-form";

export const metadata = {
  title: "New Supplier",
};

export default function NewSupplierPage() {
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
        <h1 className="text-2xl font-semibold tracking-tight">Add Supplier</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Create a new supplier for your products.
        </p>
      </div>

      <SupplierForm />
    </div>
  );
}
