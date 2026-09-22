import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  markClassName?: string;
  wordClassName?: string;
  dark?: boolean;
}

/**
 * Wordmark: a rounded ink chip carrying the initial, next to the store name
 * set in the display face. The chip alone works at favicon size.
 */
export function Logo({ className, markClassName, wordClassName, dark }: LogoProps) {
  return (
    <Link
      href="/"
      aria-label="WishlistAZ home"
      className={cn("group inline-flex items-center gap-2.5", className)}
    >
      <span
        className={cn(
          "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-ink text-sm font-bold text-ink-foreground",
          dark && "bg-background text-foreground",
          markClassName
        )}
      >
        W
      </span>
      <span
        className={cn(
          "font-display text-xl font-bold leading-none tracking-tight text-foreground",
          wordClassName
        )}
      >
        Wishlist<span className="text-muted-foreground">AZ</span>
      </span>
    </Link>
  );
}
