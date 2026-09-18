"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PlugZap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { testSupplierConnection, upsertSupplier } from "@/app/actions/suppliers";
import { SUPPLIER_TYPE_LABELS } from "@/components/admin/badges";
import type { SupplierApiType } from "@prisma/client";

export interface SupplierFormValues {
  id: string;
  name: string;
  website: string | null;
  apiType: SupplierApiType;
  /** Whether a CJ key is saved on the row (the key itself never reaches the browser). */
  hasCjApiKey: boolean;
  rating: number | null;
  avgShippingDays: number | null;
  warehouseCountry: string | null;
  leadTimeDays: number | null;
  contactEmail: string | null;
  contactUrl: string | null;
  paymentTerms: string | null;
  notes: string | null;
  isActive: boolean;
}

interface SupplierFormProps {
  supplier?: SupplierFormValues;
  /** True when CJ_API_KEY is set in the environment, so a CJ supplier works without a typed key. */
  envHasCjKey?: boolean;
}

const API_TYPE_OPTIONS: SupplierApiType[] = ["CJ", "MANUAL", "ALIBABA", "MADE_IN_CHINA", "ALIEXPRESS", "CUSTOM"];

const TYPE_HELP: Record<SupplierApiType, string> = {
  CJ: "Full API: catalog search, live prices and stock, automatic ordering on checkout, tracking webhooks. Needs a CJ API key.",
  MANUAL: "A wholesaler you deal with directly. You keep prices and stock on each listing; orders wait in the supplier queue for you to place.",
  ALIBABA: "B2B factory quotes. Each listing carries MOQ, quoted cost (usually USD) and lead time. Orders are placed by you on Alibaba (Trade Assurance) and confirmed in the queue.",
  MADE_IN_CHINA: "B2B factory quotes. Each listing carries MOQ, quoted cost (usually USD) and lead time. Orders are placed by you on Made-in-China and confirmed in the queue.",
  ALIEXPRESS: "Works like a manual supplier until the AliExpress Dropshipping API is approved for your account. Catalog search is disabled; add listings by hand or CSV.",
  CUSTOM: "Any other source. Behaves like a manual supplier; you can push prices with the /api/suppliers/update-prices endpoint.",
};

const inputCls =
  "flex h-9 w-full rounded-[3px] border border-input bg-background px-3 py-1 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 transition-all";
const labelCls = "text-sm font-medium leading-none";

function Field({
  id,
  label,
  hint,
  children,
  required,
}: {
  id: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className={labelCls}>
        {label} {required && <span className="text-stop">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function SupplierForm({ supplier, envHasCjKey = false }: SupplierFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isTesting, startTest] = useTransition();

  const [name, setName] = useState(supplier?.name ?? "");
  const [website, setWebsite] = useState(supplier?.website ?? "");
  const [apiType, setApiType] = useState<SupplierApiType>(supplier?.apiType ?? "CJ");
  const [cjApiKey, setCjApiKey] = useState("");
  const [rating, setRating] = useState(supplier?.rating != null ? String(supplier.rating) : "");
  const [avgShippingDays, setAvgShippingDays] = useState(
    supplier?.avgShippingDays != null ? String(supplier.avgShippingDays) : ""
  );
  const [warehouseCountry, setWarehouseCountry] = useState(supplier?.warehouseCountry ?? "");
  const [leadTimeDays, setLeadTimeDays] = useState(
    supplier?.leadTimeDays != null ? String(supplier.leadTimeDays) : ""
  );
  const [contactEmail, setContactEmail] = useState(supplier?.contactEmail ?? "");
  const [contactUrl, setContactUrl] = useState(supplier?.contactUrl ?? "");
  const [paymentTerms, setPaymentTerms] = useState(supplier?.paymentTerms ?? "");
  const [notes, setNotes] = useState(supplier?.notes ?? "");
  const [isActive, setIsActive] = useState(supplier?.isActive ?? true);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  const isB2B = apiType === "ALIBABA" || apiType === "MADE_IN_CHINA";
  const cjKeyAvailable = !!cjApiKey.trim() || !!supplier?.hasCjApiKey || envHasCjKey;

  function handleTest() {
    setTestResult(null);
    startTest(async () => {
      const r = await testSupplierConnection({
        supplierId: supplier?.id,
        apiType,
        cjApiKey: cjApiKey.trim() || undefined,
      });
      setTestResult(r);
      if (r.ok) toast.success("Connection OK");
      else toast.error("Connection failed");
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const ratingNum = rating !== "" ? parseFloat(rating) : undefined;
    const shippingDaysNum = avgShippingDays !== "" ? parseInt(avgShippingDays, 10) : undefined;
    const leadNum = leadTimeDays !== "" ? parseInt(leadTimeDays, 10) : undefined;

    if (ratingNum !== undefined && (ratingNum < 0 || ratingNum > 5)) {
      toast.error("Rating must be between 0 and 5");
      return;
    }
    if (apiType === "CJ" && !cjKeyAvailable) {
      toast.error("CJ Dropshipping needs an API key");
      return;
    }

    startTransition(async () => {
      const result = await upsertSupplier(
        {
          name,
          website: website.trim() || undefined,
          apiType,
          cjApiKey: apiType === "CJ" ? cjApiKey.trim() || undefined : undefined,
          rating: ratingNum,
          avgShippingDays: shippingDaysNum,
          warehouseCountry: warehouseCountry.trim() || undefined,
          leadTimeDays: leadNum,
          contactEmail: contactEmail.trim() || undefined,
          contactUrl: contactUrl.trim() || undefined,
          paymentTerms: paymentTerms.trim() || undefined,
          notes: notes.trim() || undefined,
          isActive,
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
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">
      {/* Identity */}
      <section className="space-y-4 rounded-[4px] border bg-card p-5">
        <h2 className="label-sign text-muted-foreground">Supplier</h2>

        <Field id="supplier-name" label="Name" required>
          <input
            id="supplier-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g. CJ Dropshipping (EU warehouse)"
            className={inputCls}
          />
        </Field>

        <Field id="supplier-api-type" label="Type" hint={TYPE_HELP[apiType]}>
          <select
            id="supplier-api-type"
            value={apiType}
            onChange={(e) => {
              setApiType(e.target.value as SupplierApiType);
              setTestResult(null);
            }}
            className={inputCls}
          >
            {API_TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {SUPPLIER_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </Field>

        <Field id="supplier-website" label="Website / storefront">
          <input
            id="supplier-website"
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder={
              isB2B
                ? "https://<factory>.en.alibaba.com or https://<factory>.en.made-in-china.com"
                : "https://cjdropshipping.com"
            }
            className={inputCls}
          />
        </Field>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="size-4 accent-[var(--signal-deep)]"
          />
          Active (inactive suppliers are skipped by price sync and auto-order)
        </label>
      </section>

      {/* CJ credentials */}
      {apiType === "CJ" && (
        <section className="space-y-4 rounded-[4px] border border-ink/30 bg-card p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="label-sign text-muted-foreground">CJ Dropshipping API</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleTest}
              disabled={isTesting || !cjKeyAvailable}
            >
              {isTesting ? <Loader2 className="size-3.5 animate-spin" /> : <PlugZap className="size-3.5" />}
              Test connection
            </Button>
          </div>
          <p className="text-xs text-muted-foreground -mt-2">
            My CJ → <span className="font-mono">Apps → API → Add API</span> (type &ldquo;API Key&rdquo;), then copy
            the key. Only the key is needed; CJ&rsquo;s API 2.0 no longer uses your account email.
          </p>

          <Field
            id="cj-api-key"
            label="API key"
            required={!supplier?.hasCjApiKey && !envHasCjKey}
            hint={
              supplier?.hasCjApiKey
                ? "A key is saved. Leave blank to keep it; paste a new key to replace it."
                : envHasCjKey
                  ? "CJ_API_KEY is set in the environment and will be used unless you paste a key here."
                  : undefined
            }
          >
            <input
              id="cj-api-key"
              type="password"
              value={cjApiKey}
              onChange={(e) => setCjApiKey(e.target.value)}
              placeholder={supplier?.hasCjApiKey ? "•••••••••••••••• (saved)" : "CJ…@api@…"}
              autoComplete="off"
              className={`${inputCls} font-mono`}
            />
          </Field>

          {testResult && (
            <p
              className={`rounded-[3px] border px-3 py-2 text-xs ${
                testResult.ok ? "border-go/40 bg-go/10 text-foreground" : "border-stop/40 bg-stop/10 text-stop"
              }`}
            >
              {testResult.message}
            </p>
          )}
        </section>
      )}

      {/* Logistics */}
      <section className="space-y-4 rounded-[4px] border bg-card p-5">
        <h2 className="label-sign text-muted-foreground">Logistics</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field
            id="supplier-warehouse"
            label="Ships from"
            hint="ISO code. Drives the “ships from EU” promise and CJ freight quotes."
          >
            <input
              id="supplier-warehouse"
              type="text"
              value={warehouseCountry}
              onChange={(e) => setWarehouseCountry(e.target.value.toUpperCase())}
              maxLength={2}
              placeholder={isB2B ? "CN" : "DE"}
              className={`${inputCls} uppercase font-mono`}
            />
          </Field>
          <Field
            id="supplier-lead"
            label={isB2B ? "Production lead time (days)" : "Dispatch time (days)"}
            hint={isB2B ? "From PO to goods ready." : "From order to handover to carrier."}
          >
            <input
              id="supplier-lead"
              type="number"
              min={0}
              step={1}
              value={leadTimeDays}
              onChange={(e) => setLeadTimeDays(e.target.value)}
              placeholder={isB2B ? "10" : "1"}
              className={inputCls}
            />
          </Field>
          <Field id="supplier-shipping-days" label="Avg. transit (days)" hint="Carrier time to the customer.">
            <input
              id="supplier-shipping-days"
              type="number"
              min={1}
              step={1}
              value={avgShippingDays}
              onChange={(e) => setAvgShippingDays(e.target.value)}
              placeholder={isB2B ? "25" : "5"}
              className={inputCls}
            />
          </Field>
        </div>
        {isB2B && (
          <p className="rounded-[3px] bg-signal/15 px-3 py-2 text-xs text-foreground">
            MOQ and the quoted unit cost live on each product listing (Suppliers → this supplier → edit a row, or
            CSV import with the <span className="font-mono">moq</span>, <span className="font-mono">source_currency</span>{" "}
            and <span className="font-mono">source_cost_price</span> columns).
          </p>
        )}
      </section>

      {/* Contact & terms */}
      <section className="space-y-4 rounded-[4px] border bg-card p-5">
        <h2 className="label-sign text-muted-foreground">Contact & terms</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="supplier-email" label="Contact email">
            <input
              id="supplier-email"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="sales@factory.com"
              className={inputCls}
            />
          </Field>
          <Field
            id="supplier-contact-url"
            label="Chat / inquiry URL"
            hint="Alibaba TradeManager, Made-in-China inquiry page, CJ ticket…"
          >
            <input
              id="supplier-contact-url"
              type="url"
              value={contactUrl}
              onChange={(e) => setContactUrl(e.target.value)}
              placeholder="https://…/contactus.html"
              className={inputCls}
            />
          </Field>
        </div>
        <Field id="supplier-terms" label="Payment terms">
          <input
            id="supplier-terms"
            type="text"
            value={paymentTerms}
            onChange={(e) => setPaymentTerms(e.target.value)}
            placeholder={isB2B ? "30% deposit, 70% before shipment · Trade Assurance" : "Wallet balance / card"}
            className={inputCls}
          />
        </Field>
        <Field id="supplier-rating" label="Your rating (0–5)">
          <input
            id="supplier-rating"
            type="number"
            value={rating}
            onChange={(e) => setRating(e.target.value)}
            min={0}
            max={5}
            step={0.1}
            placeholder="4.5"
            className={inputCls}
          />
        </Field>
        <Field id="supplier-notes" label="Notes">
          <textarea
            id="supplier-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Sample first, then bulk PO. Ask for FOB Ningbo quotes."
            className={`${inputCls} h-auto py-2 resize-y`}
          />
        </Field>
      </section>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : supplier ? "Update supplier" : "Create supplier"}
        </Button>
        <Button type="button" variant="outline" disabled={isPending} onClick={() => router.push("/admin/suppliers")}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
