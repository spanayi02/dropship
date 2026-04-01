"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { updateStoreSettings } from "@/app/actions/settings";
import type { StoreSettings } from "@prisma/client";
import { toast } from "sonner";

const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY"];
const MARKUP_TYPES = [
  { value: "MULTIPLIER", label: "Multiplier (e.g. 2.5×)" },
  { value: "FIXED", label: "Fixed Amount (e.g. +$10)" },
  { value: "MANUAL", label: "Manual (no auto-pricing)" },
] as const;

interface Props {
  settings: StoreSettings;
}

export function SettingsForm({ settings }: Props) {
  const [isPending, startTransition] = useTransition();

  const [storeName, setStoreName] = useState(settings.storeName);
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl ?? "");
  const [contactEmail, setContactEmail] = useState(settings.contactEmail);
  const [currency, setCurrency] = useState(settings.currency);
  const [markupType, setMarkupType] = useState(settings.globalMarkupType);
  const [markupValue, setMarkupValue] = useState(
    String(settings.globalMarkupValue)
  );
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(
    (settings.freeShippingThreshold / 100).toFixed(2)
  );
  const [flatShippingRate, setFlatShippingRate] = useState(
    (settings.flatShippingRate / 100).toFixed(2)
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const markupValueNum = parseFloat(markupValue);
    const freeShippingCents = Math.round(parseFloat(freeShippingThreshold) * 100);
    const flatShippingCents = Math.round(parseFloat(flatShippingRate) * 100);

    if (!storeName.trim()) {
      toast.error("Store name is required");
      return;
    }
    if (!contactEmail.trim() || !contactEmail.includes("@")) {
      toast.error("Valid contact email is required");
      return;
    }
    if (isNaN(markupValueNum) || markupValueNum <= 0) {
      toast.error("Markup value must be a positive number");
      return;
    }
    if (isNaN(freeShippingCents) || freeShippingCents < 0) {
      toast.error("Invalid free shipping threshold");
      return;
    }
    if (isNaN(flatShippingCents) || flatShippingCents < 0) {
      toast.error("Invalid flat shipping rate");
      return;
    }

    startTransition(async () => {
      const result = await updateStoreSettings({
        storeName: storeName.trim(),
        logoUrl: logoUrl.trim() || undefined,
        contactEmail: contactEmail.trim(),
        currency,
        globalMarkupType: markupType,
        globalMarkupValue: markupValueNum,
        freeShippingThreshold: freeShippingCents,
        flatShippingRate: flatShippingCents,
      });

      if (result.success) {
        toast.success("Settings saved");
      } else {
        toast.error(result.error ?? "Failed to save settings");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Store info */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold mb-3">Store Information</legend>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Store Name <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              required
              disabled={isPending}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/50 disabled:opacity-50"
              placeholder="My Store"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              Contact Email <span className="text-destructive">*</span>
            </label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              required
              disabled={isPending}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/50 disabled:opacity-50"
              placeholder="support@example.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Logo URL</label>
          <input
            type="url"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            disabled={isPending}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/50 disabled:opacity-50"
            placeholder="https://example.com/logo.png"
          />
        </div>

        <div className="w-40">
          <label className="block text-sm font-medium mb-1.5">Currency</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            disabled={isPending}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/50 disabled:opacity-50"
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </fieldset>

      <hr className="border-border" />

      {/* Pricing */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold mb-3">Global Pricing</legend>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Default Markup Type
            </label>
            <select
              value={markupType}
              onChange={(e) =>
                setMarkupType(
                  e.target.value as "MULTIPLIER" | "FIXED" | "MANUAL"
                )
              }
              disabled={isPending}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/50 disabled:opacity-50"
            >
              {MARKUP_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              Markup Value
              <span className="ml-1 text-xs text-muted-foreground font-normal">
                {markupType === "MULTIPLIER"
                  ? "(e.g. 2.5 = 2.5× cost)"
                  : markupType === "FIXED"
                  ? "(dollars added, e.g. 10 = +$10)"
                  : "(ignored in manual mode)"}
              </span>
            </label>
            <input
              type="number"
              value={markupValue}
              onChange={(e) => setMarkupValue(e.target.value)}
              step="0.01"
              min="0"
              disabled={isPending || markupType === "MANUAL"}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/50 disabled:opacity-50"
            />
          </div>
        </div>
      </fieldset>

      <hr className="border-border" />

      {/* Shipping */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold mb-3">Shipping</legend>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Free Shipping Threshold ($)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                $
              </span>
              <input
                type="number"
                value={freeShippingThreshold}
                onChange={(e) => setFreeShippingThreshold(e.target.value)}
                step="0.01"
                min="0"
                disabled={isPending}
                className="w-full rounded-lg border bg-background pl-7 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/50 disabled:opacity-50 tabular-nums"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Orders above this amount get free shipping
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              Flat Shipping Rate ($)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                $
              </span>
              <input
                type="number"
                value={flatShippingRate}
                onChange={(e) => setFlatShippingRate(e.target.value)}
                step="0.01"
                min="0"
                disabled={isPending}
                className="w-full rounded-lg border bg-background pl-7 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/50 disabled:opacity-50 tabular-nums"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Applied to orders below the free shipping threshold
            </p>
          </div>
        </div>
      </fieldset>

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : "Save Settings"}
        </Button>
      </div>
    </form>
  );
}
