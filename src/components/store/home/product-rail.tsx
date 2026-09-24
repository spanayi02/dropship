"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { ProductCard, type ProductCardProduct } from "@/components/store/product-card";

/** Horizontally scrolling product row with arrow controls on desktop. */
export function ProductRail({ products }: { products: ProductCardProduct[] }) {
  const { t } = useI18n();
  const trackRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: dir * track.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <div className="relative">
      <div
        ref={trackRef}
        className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-2 sm:-mx-6 sm:scroll-px-6 sm:gap-5 sm:px-6 lg:mx-0 lg:scroll-px-0 lg:px-0"
      >
        {products.map((product) => (
          <div key={product.id} className="w-[46%] flex-none snap-start sm:w-[31%] lg:w-[calc(20%-16px)]">
            <ProductCard product={product} />
          </div>
        ))}
      </div>

      {products.length > 5 && (
        <>
          <button
            type="button"
            onClick={() => scroll(-1)}
            aria-label={t("landing.scrollPrev")}
            className="absolute -left-5 top-[38%] hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-background shadow-md ring-1 ring-black/5 transition-colors hover:bg-muted lg:inline-flex"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            aria-label={t("landing.scrollNext")}
            className="absolute -right-5 top-[38%] hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-background shadow-md ring-1 ring-black/5 transition-colors hover:bg-muted lg:inline-flex"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}
    </div>
  );
}
