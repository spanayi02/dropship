"use client";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/20">
        <ShieldAlert className="h-10 w-10 text-rose-500" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Admin Error</h1>
        <p className="text-muted-foreground max-w-md">
          Something went wrong in the admin panel. Please try again or contact support.
        </p>
      </div>

      {process.env.NODE_ENV === "development" && error.message && (
        <div className="w-full max-w-lg rounded-lg border border-rose-200 bg-rose-50 p-4 text-left dark:border-rose-800 dark:bg-rose-900/10">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-rose-600 dark:text-rose-400">
            Error details
          </p>
          <code className="block whitespace-pre-wrap break-all text-xs text-rose-700 dark:text-rose-300">
            {error.message}
          </code>
        </div>
      )}

      {error.digest && (
        <p className="text-xs text-muted-foreground">
          Digest:{" "}
          <span className="font-mono font-medium text-foreground">{error.digest}</span>
        </p>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button onClick={reset} variant="default">
          Try again
        </Button>
        <Link href="/admin">
          <Button variant="outline">Admin Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
