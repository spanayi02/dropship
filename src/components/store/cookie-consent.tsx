"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/client";

/**
 * EU cookie consent.
 *
 * Strictly necessary cookies (session, cart, locale, and this choice itself)
 * need no consent and are always set. Analytics is opt-in: nothing is loaded
 * until someone accepts, which is what the cookies page promises.
 *
 * The choice is stored in a first-party cookie rather than localStorage so the
 * server can read it too when analytics is wired up later.
 */
export const CONSENT_COOKIE = "wl_consent";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export type ConsentValue = "all" | "essential";

function readConsent(): ConsentValue | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${CONSENT_COOKIE}=(all|essential)`));
  return (match?.[1] as ConsentValue) ?? null;
}

function writeConsent(value: ConsentValue) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CONSENT_COOKIE}=${value}; Path=/; Max-Age=${ONE_YEAR_SECONDS}; SameSite=Lax${secure}`;
}

/** Lets the footer re-open the banner after a choice has been made. */
export const OPEN_CONSENT_EVENT = "wl:open-cookie-settings";

export function CookieConsent() {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Read after mount: the server cannot know the cookie state for a
    // statically rendered shell, and rendering nothing first avoids a flash.
    if (readConsent() === null) setVisible(true);

    const open = () => setVisible(true);
    window.addEventListener(OPEN_CONSENT_EVENT, open);
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, open);
  }, []);

  const choose = useCallback((value: ConsentValue) => {
    writeConsent(value);
    setVisible(false);
  }, []);

  if (!visible) return null;

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
