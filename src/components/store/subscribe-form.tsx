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
      <div className="inline-flex items-center gap-2 rounded-[3px] border border-go/30 bg-go/10 px-5 py-3 text-sm font-medium text-go">
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
        className="flex-1 w-full rounded-[3px] border border-board-line bg-board-cell px-4 py-3 text-sm text-board-text outline-none placeholder:text-board-dim focus:border-signal focus:ring-2 focus:ring-signal/30 transition-all"
        aria-label="Email address"
      />
      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-[3px] bg-signal px-6 py-3 text-sm font-bold text-signal-foreground hover:bg-signal-deep transition-colors disabled:opacity-60 whitespace-nowrap"
      >
        {loading ? "Subscribing…" : "Subscribe"}
        {!loading && <ArrowRight className="h-4 w-4" />}
      </button>
    </form>
  );
}
