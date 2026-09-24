"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { subscribeNewsletter } from "@/app/actions/newsletter";
import { useI18n } from "@/lib/i18n/client";

/** Newsletter sign-up, styled for the dark band on the homepage. */
export function SubscribeForm() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);

    const result = await subscribeNewsletter(email);

    setLoading(false);

    if (result.success) {
      setSubmitted(true);
      toast.success(result.success);
    } else {
      toast.error(result.error ?? t("landing.subscribeFailed"));
    }
  }

  if (submitted) {
    return (
      <p className="inline-flex items-center gap-2 rounded-full bg-tint-ink-foreground/10 px-5 py-3 text-sm font-medium">
        <CheckCircle2 className="h-4 w-4" />
        {t("landing.subscribed")}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t("home.newsletterPlaceholder")}
        required
        autoComplete="email"
        aria-label={t("auth.email")}
        className="h-12 w-full flex-1 rounded-full border border-tint-ink-foreground/20 bg-tint-ink-foreground/10 px-5 text-sm text-tint-ink-foreground outline-none transition-colors placeholder:text-tint-ink-foreground/50 focus:border-tint-ink-foreground/60"
      />
      <button
        type="submit"
        disabled={loading}
        className="inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-tint-ink-foreground px-7 text-sm font-semibold text-tint-ink transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {loading ? t("landing.subscribing") : t("home.newsletterCta")}
        {!loading && <ArrowRight className="h-4 w-4" />}
      </button>
    </form>
  );
}
