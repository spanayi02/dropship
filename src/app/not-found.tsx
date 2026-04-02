import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <div className="space-y-2">
        <p
          className="text-8xl font-extrabold text-[var(--emerald)] leading-none"
          aria-hidden="true"
        >
          404
        </p>
        <h1 className="text-3xl font-bold tracking-tight">Page not found</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Sorry, we couldn&apos;t find the page you&apos;re looking for. It may have been
          moved, deleted, or never existed.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link href="/">
          <Button variant="default">Go to Store</Button>
        </Link>
        <Link href="/admin">
          <Button variant="outline">Admin Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
