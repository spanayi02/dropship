import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { ProductForm } from "@/components/admin/product-form";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminEditProductPage({ params }: PageProps) {
  const { id } = await params;

  const product = await db.product.findUnique({
    where: { id },
    include: {
      category: true,
      suppliers: true,
    },
  });

  if (!product) {
    notFound();
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/products">
          <Button variant="ghost" size="icon-sm" aria-label="Back to products">
            <ChevronLeft className="size-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Product</h1>
          <p className="text-sm text-muted-foreground font-mono">{product.slug}</p>
        </div>
      </div>
      <ProductForm product={product} />
    </div>
  );
}
