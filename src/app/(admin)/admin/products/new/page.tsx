import Link from "next/link";
import { ProductForm } from "@/components/admin/product-form";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export default function AdminNewProductPage() {
  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/products">
          <Button variant="ghost" size="icon-sm" aria-label="Back to products">
            <ChevronLeft className="size-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Product</h1>
          <p className="text-sm text-muted-foreground">Add a new product to your store</p>
        </div>
      </div>
      <ProductForm />
    </div>
  );
}
