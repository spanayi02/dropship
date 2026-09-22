"use client";

import { useCallback, useSyncExternalStore } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/client";

/**
 * EU cookie consent.
 *
 * Strictly necessary cookies (session, cart, locale, and this choice itself)
 * need no consent and are always set. Analytics is opt-in: nothing is loaded
 * until someone accepts, which is what the cookies page promises.
 *
 * The choice lives in a first-party cookie rather than localStorage so the
 * server can read it too when analytics is wired up later.
 *
 * Visibility is exposed through useSyncExternalStore rather than an effect:
 * the server snapshot is always "hidden", so the banner never causes a
 * hydration mismatch and never needs a setState during mount.
 */
export const CONSENT_COOKIE = "wl_consent";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export type ConsentValue = "all" | "essential";

/** Lets the footer re-open the banner after a choice has been made. */
export const OPEN_CONSENT_EVENT = "wl:open-cookie-settings";

function readConsent(): ConsentValue | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${CONSENT_COOKIE}=(all|essential)`));
  return (match?.[1] as ConsentValue) ?? null;
}

function writeConsent(value: ConsentValue) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CONSENT_COOKIE}=${value}; Path=/; Max-Age=${ONE_YEAR_SECONDS}; SameSite=Lax${secure}`;
}

// ── visibility store ─────────────────────────────────────────────────────────
//
// getSnapshot must return a cached value, not recompute on every call, so the
// snapshot lives in a module variable and is refreshed explicitly. Starting at
// "hidden" keeps the server and first client render identical.

type Visibility = "shown" | "hidden";

const listeners = new Set<() => void>();
let snapshot: Visibility = "hidden";
let reopened = false;

function notify() {
  for (const l of listeners) l();
}

function compute(): Visibility {
  return reopened || readConsent() === null ? "shown" : "hidden";
}

function refresh() {
  const next = compute();
  if (next !== snapshot) {
    snapshot = next;
    notify();
  }
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  // Pick up the stored choice now that we are on the client.
  refresh();

  const reopen = () => {
    reopened = true;
    refresh();
  };
  window.addEventListener(OPEN_CONSENT_EVENT, reopen);

  return () => {
    listeners.delete(onChange);
    window.removeEventListener(OPEN_CONSENT_EVENT, reopen);
  };
}

function getSnapshot(): Visibility {
  return snapshot;
}

function getServerSnapshot(): Visibility {
  return "hidden";
}

// ── components ───────────────────────────────────────────────────────────────

export function CookieConsent() {
  const { t } = useI18n();
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const choose = useCallback((value: ConsentValue) => {
    writeConsent(value);
    reopened = false;
    refresh();
  }, []);

  if (state === "hidden") return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={t("legal.cookieTitle")}
      className="fixed inset-x-0 bottom-0 z-50 animate-fade-up border-t border-hairline bg-background/95 backdrop-blur-sm"
    >
      <div className="container-store flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:py-5">
        <p className="max-w-2xl text-sm text-muted-foreground">
          {t("legal.cookieText")}{" "}
          <Link href="/cookies" className="underline underline-offset-4 hover:text-foreground">
            {t("legal.cookieMore")}
          </Link>
        </p>
        <div className="flex flex-none gap-2">
          <button
            type="button"
            onClick={() => choose("essential")}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-border-strong px-4 text-sm font-medium transition-colors hover:bg-muted"
          >
            {t("legal.cookieReject")}
          </button>
          <button
            type="button"
            onClick={() => choose("all")}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t("legal.cookieAccept")}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Footer control that reopens the banner so a choice can be changed. */
export function CookieSettingsButton({ className }: { className?: string }) {
  const { t } = useI18n();
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.dispatchEvent(new Event(OPEN_CONSENT_EVENT))}
    >
      {t("legal.cookieSettings")}
    </button>
  );
}
