"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { subscribeNewsletter } from "@/app/actions/newsletter";

export function SubscribeForm() {
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
      toast.error(result.error ?? "Failed to subscribe. Please try again.");
    }
  }

  if (submitted) {
    return (
      <div className="inline-flex items-center gap-2 rounded-xl border border-[var(--emerald)]/30 bg-[var(--emerald)]/10 px-5 py-3 text-sm font-medium text-[var(--emerald)]">
        <CheckCircle2 className="h-4 w-4" />
        You&apos;re subscribed — thanks!
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col sm:flex-row items-center gap-3 max-w-md mx-auto"
    >
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        required
        className="flex-1 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:border-[var(--emerald)] focus:ring-2 focus:ring-[var(--emerald)]/20 transition-all"
        aria-label="Email address"
      />
      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-xl bg-[var(--emerald)] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[var(--emerald)]/25 hover:opacity-90 transition-opacity disabled:opacity-60 whitespace-nowrap"
      >
        {loading ? "Subscribing…" : "Subscribe"}
        {!loading && <ArrowRight className="h-4 w-4" />}
      </button>
    </form>
  );
}
