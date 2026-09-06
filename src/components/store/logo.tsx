import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  markClassName?: string;
  wordClassName?: string;
}

/**
 * Typographic wordmark. Replaces the old Canva sticker-badge PNG (visible
 * watermark, mismatched orange/emerald colors) with a lockup that actually
 * scales and matches the rest of the design system.
 */
export function Logo({ className, markClassName, wordClassName }: LogoProps) {
  return (
    <Link
      href="/"
      aria-label="WishlistAZ home"
      className={cn("group inline-flex items-center gap-2", className)}
    >
      <span
        className={cn(
          "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-[7px] bg-[var(--emerald)] text-[12px] font-semibold tracking-tight text-[var(--emerald-foreground)] transition-transform duration-300 group-hover:-rotate-3",
          markClassName
        )}
      >
        AZ
      </span>
      <span
        className={cn(
          "text-xl italic leading-none tracking-tight text-foreground",
          wordClassName
        )}
        style={{ fontFamily: "var(--font-heading), Georgia, serif" }}
      >
        wishlist
      </span>
    </Link>
  );
}
