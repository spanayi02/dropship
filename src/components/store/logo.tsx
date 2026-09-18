import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  markClassName?: string;
  wordClassName?: string;
  dark?: boolean;
}

/**
 * Wordmark built as a luggage tag: a squared ink chip carrying "WL" (the
 * departure-board initial), a punched eyelet, and the store name set in the
 * condensed board face. Reads at favicon size via the chip alone.
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
          "relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[3px] bg-ink text-[13px] font-bold tracking-tight text-ink-foreground transition-transform duration-200 group-hover:-rotate-2",
          dark && "bg-signal text-signal-foreground",
          markClassName
        )}
      >
        <span
          aria-hidden="true"
          className="absolute left-1/2 top-[3px] h-[5px] w-[5px] -translate-x-1/2 rounded-full bg-background/90"
        />
        WL
      </span>
      <span
        className={cn(
          "font-board text-[1.35rem] font-bold uppercase leading-none tracking-[0.02em] text-foreground",
          wordClassName
        )}
      >
        Wishlist<span className="text-muted-foreground">AZ</span>
      </span>
    </Link>
  );
}
