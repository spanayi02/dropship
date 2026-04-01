"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { deleteSupplier } from "@/app/actions/suppliers";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

interface Props {
  supplierId: string;
  supplierName: string;
  productCount: number;
}

export function DeleteSupplierButton({
  supplierId,
  supplierName,
  productCount,
}: Props) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (productCount > 0) {
      toast.error(
        `Cannot delete "${supplierName}" — it has ${productCount} active product(s)`
      );
      return;
    }

    if (
      !confirm(
        `Are you sure you want to delete "${supplierName}"? This cannot be undone.`
      )
    ) {
      return;
    }

    startTransition(async () => {
      const result = await deleteSupplier(supplierId);
      if (result.success) {
        toast.success(`"${supplierName}" deleted`);
      } else {
        toast.error(result.error ?? "Failed to delete supplier");
      }
    });
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={handleDelete}
      disabled={isPending}
      className="text-muted-foreground hover:text-destructive"
    >
      <Trash2 className="size-3.5" />
    </Button>
  );
}
