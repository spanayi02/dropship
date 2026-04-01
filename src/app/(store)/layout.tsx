import type { ReactNode } from "react";
import { StoreHeader } from "@/components/store/header";
import { StoreFooter } from "@/components/store/footer";
import { CartDrawer } from "@/components/store/cart-drawer";

interface StoreLayoutProps {
  children: ReactNode;
}

export default function StoreLayout({ children }: StoreLayoutProps) {
  return (
    <>
      <StoreHeader />
      <main className="flex-1 min-h-0">{children}</main>
      <StoreFooter />
      <CartDrawer />
    </>
  );
}
