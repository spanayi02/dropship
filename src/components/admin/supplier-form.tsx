"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { upsertSupplier } from "@/app/actions/suppliers";
import type { SupplierApiType } from "@prisma/client";

interface SupplierFormProps {
  supplier?: {
    id: string;
    name: string;
    website: string | null;
    apiType: SupplierApiType;
    apiCredentials?: unknown;
    rating: number | null;
    avgShippingDays: number | null;
  };
}

const API_TYPE_OPTIONS: { value: SupplierApiType; label: string }[] = [
  { value: "MANUAL", label: "Manual" },
  { value: "ALIEXPRESS", label: "AliExpress" },
  { value: "CJ", label: "CJ Dropshipping" },
  { value: "CUSTOM", label: "Custom API" },
];

function getExistingCreds(raw: unknown): { email: string; apiKey: string } {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const creds = raw as Record<string, unknown>;
    return {
      email: typeof creds.email === "string" ? creds.email : "",
      apiKey: typeof creds.apiKey === "string" ? creds.apiKey : "",
    };
  }
  return { email: "", apiKey: "" };
}

export function SupplierForm({ supplier }: SupplierFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(supplier?.name ?? "");
  const [website, setWebsite] = useState(supplier?.website ?? "");
  const [apiType, setApiType] = useState<SupplierApiType>(
    supplier?.apiType ?? "MANUAL"
  );
  const [rating, setRating] = useState<string>(
    supplier?.rating != null ? String(supplier.rating) : ""
  );
  const [avgShippingDays, setAvgShippingDays] = useState<string>(
    supplier?.avgShippingDays != null ? String(supplier.avgShippingDays) : ""
  );

  const existingCreds = getExistingCreds(supplier?.apiCredentials);
  const [cjEmail, setCjEmail] = useState(existingCreds.email);
  const [cjApiKey, setCjApiKey] = useState(existingCreds.apiKey);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const ratingNum = rating !== "" ? parseFloat(rating) : undefined;
    const shippingDaysNum =
      avgShippingDays !== "" ? parseInt(avgShippingDays, 10) : undefined;

    if (ratingNum !== undefined && (ratingNum < 0 || ratingNum > 5)) {
      toast.error("Rating must be between 0 and 5");
      return;
    }

    if (apiType === "CJ" && (!cjEmail.trim() || !cjApiKey.trim())) {
      toast.error("CJ Dropshipping requires both an email and API key");
      return;
    }

    const apiCredentials =
      apiType === "CJ"
        ? { email: cjEmail.trim(), apiKey: cjApiKey.trim() }
        : undefined;

    startTransition(async () => {
      const result = await upsertSupplier(
        {
          name,
          website: website.trim() || undefined,
          apiType,
          apiCredentials,
          rating: ratingNum,
          avgShippingDays: shippingDaysNum,
        },
        supplier?.id
      );

      if (result.success) {
        toast.success(supplier ? "Supplier updated" : "Supplier created");
        router.push("/admin/suppliers");
      } else {
        toast.error(result.error ?? "Failed to save supplier");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
      {/* Name */}
      <div className="space-y-1.5">
        <label
          htmlFor="supplier-name"
          className="text-sm font-medium leading-none"
        >
          Name <span className="text-destructive">*</span>
        </label>
        <input
          id="supplier-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="e.g. CJ Dropshipping"
          className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 transition-all"
        />
      </div>

      {/* Website */}
      <div className="space-y-1.5">
        <label
          htmlFor="supplier-website"
          className="text-sm font-medium leading-none"
        >
          Website
        </label>
        <input
          id="supplier-website"
          type="url"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder="https://cjdropshipping.com"
          className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 transition-all"
        />
      </div>

      {/* API Type */}
      <div className="space-y-1.5">
        <label
          htmlFor="supplier-api-type"
          className="text-sm font-medium leading-none"
        >
          API Type
        </label>
        <select
          id="supplier-api-type"
          value={apiType}
          onChange={(e) => setApiType(e.target.value as SupplierApiType)}
          className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 transition-all"
        >
          {API_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* CJ Credentials — shown only when CJ is selected */}
      {apiType === "CJ" && (
        <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-4">
          <p className="text-sm font-medium">CJ Dropshipping API Credentials</p>
          <p className="text-xs text-muted-foreground -mt-2">
            Find these at{" "}
            <span className="font-mono">app.cjdropshipping.com</span> → your
            avatar → Developer
          </p>

          <div className="space-y-1.5">
            <label
              htmlFor="cj-email"
              className="text-sm font-medium leading-none"
            >
              CJ Account Email <span className="text-destructive">*</span>
            </label>
            <input
              id="cj-email"
              type="email"
              value={cjEmail}
              onChange={(e) => setCjEmail(e.target.value)}
              placeholder="you@example.com"
              className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="cj-api-key"
              className="text-sm font-medium leading-none"
            >
              API Key <span className="text-destructive">*</span>
            </label>
            <input
              id="cj-api-key"
              type="password"
              value={cjApiKey}
              onChange={(e) => setCjApiKey(e.target.value)}
              placeholder="Paste your CJ API key here"
              autoComplete="off"
              className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 transition-all font-mono"
            />
          </div>
        </div>
      )}

      {/* Rating */}
      <div className="space-y-1.5">
        <label
          htmlFor="supplier-rating"
          className="text-sm font-medium leading-none"
        >
          Rating{" "}
          <span className="text-muted-foreground font-normal">(0 – 5)</span>
        </label>
        <input
          id="supplier-rating"
          type="number"
          value={rating}
          onChange={(e) => setRating(e.target.value)}
          min={0}
          max={5}
          step={0.1}
          placeholder="e.g. 4.5"
          className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 transition-all"
        />
      </div>

      {/* Avg Shipping Days */}
      <div className="space-y-1.5">
        <label
          htmlFor="supplier-shipping-days"
          className="text-sm font-medium leading-none"
        >
          Avg. Shipping Days
        </label>
        <input
          id="supplier-shipping-days"
          type="number"
          value={avgShippingDays}
          onChange={(e) => setAvgShippingDays(e.target.value)}
          min={1}
          step={1}
          placeholder="e.g. 14"
          className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 transition-all"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? "Saving…"
            : supplier
            ? "Update Supplier"
            : "Create Supplier"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() => router.push("/admin/suppliers")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
