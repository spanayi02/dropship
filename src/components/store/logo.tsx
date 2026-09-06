import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  markClassName?: string;
  wordClassName?: string;
}

/**
 * Typographic wordmark — solid ink mark + bold sans wordmark, no color,
 * no serif. Replaces the old Canva sticker-badge PNG (visible watermark,
 * orange/yellow, didn't match the rest of the site either way).
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
          "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-[6px] bg-[var(--emerald)] text-[11px] font-black tracking-tight text-[var(--emerald-foreground)]",
          markClassName
        )}
      >
        AZ
      </span>
      <span
        className={cn(
          "text-lg font-black lowercase leading-none tracking-tight text-foreground",
          wordClassName
        )}
      >
        wishlist
      </span>
    </Link>
  );
}
