"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { lockSupplier } from "@/app/actions/suppliers";
import { toast } from "sonner";
import { Lock, Unlock } from "lucide-react";

interface Props {
  productId: string;
  supplierId: string;
  isLocked: boolean;
}

export function LockSupplierToggle({ productId, supplierId, isLocked }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      const result = await lockSupplier(productId, supplierId, !isLocked);
      if (result.success) {
        toast.success(isLocked ? "Supplier unlocked" : "Supplier locked");
      } else {
        toast.error(result.error ?? "Failed to update");
      }
    });
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={handleToggle}
      disabled={isPending}
      title={isLocked ? "Unlock supplier" : "Lock supplier"}
      className={
        isLocked
          ? "text-amber-600 hover:text-amber-700"
          : "text-muted-foreground hover:text-foreground"
      }
    >
      {isLocked ? (
        <Lock className="size-3.5" />
      ) : (
        <Unlock className="size-3.5" />
      )}
    </Button>
  );
}
