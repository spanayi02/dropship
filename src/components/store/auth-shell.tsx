import type { ReactNode } from "react";
import Link from "next/link";
import { ShieldCheck, Truck, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

/** Shared field styling for the sign-in and registration forms. */
export const authFieldClass =
  "w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm text-foreground " +
  "placeholder:text-muted-foreground transition-colors " +
  "focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 " +
  "disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20";

export const authLabelClass = "mb-1.5 block text-sm font-medium text-foreground";

export function AuthField({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className={authLabelClass}>
        {label}
      </label>
      {children}
      {error && (
        <p className="mt-1.5 text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Two-column auth page: the form on the left, the reasons to have an account
 * on the right. Collapses to the form alone on small screens.
 */
export function AuthShell({
  title,
  subtitle,
  children,
  footerPrompt,
  footerLinkLabel,
  footerHref,
  reasons,
  className,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footerPrompt: string;
  footerLinkLabel: string;
  footerHref: string;
  reasons: { shipping: string; secure: string; returns: string };
  className?: string;
}) {
  const points = [
    { icon: Truck, text: reasons.shipping },
    { icon: ShieldCheck, text: reasons.secure },
    { icon: RotateCcw, text: reasons.returns },
  ];

  return (
    <div className={cn("container-store py-12 sm:py-16", className)}>
      <div className="mx-auto grid max-w-4xl items-start gap-10 lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-16">
        <div className="mx-auto w-full max-w-md lg:mx-0">
          <h1 className="text-3xl">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>

          <div className="mt-8">{children}</div>

          <p className="mt-6 text-sm text-muted-foreground">
            {footerPrompt}{" "}
            <Link
              href={footerHref}
              className="font-medium text-foreground underline underline-offset-4 hover:no-underline"
            >
              {footerLinkLabel}
            </Link>
          </p>
        </div>

        <aside className="hidden rounded-xl border border-hairline bg-canvas-soft p-6 lg:block">
          <ul className="space-y-4">
            {points.map((p) => (
              <li key={p.text} className="flex items-start gap-3 text-sm text-muted-foreground">
                <p.icon className="mt-0.5 h-4 w-4 flex-none text-foreground" />
                {p.text}
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
