"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, ChevronLeft, ChevronRight, ShoppingBag, Lock } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart-store";
import { formatPrice } from "@/lib/utils";
import { FREE_SHIPPING_THRESHOLD, FLAT_SHIPPING_RATE } from "@/lib/store-config";
import { useI18n } from "@/lib/i18n/client";
import { useHydrated } from "@/hooks/use-hydrated";
import { shippingAddressSchema, type ShippingAddressInput } from "@/lib/validations/order";
import { createCheckoutSession } from "@/app/actions/checkout";
import { z } from "zod";

const contactSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type ContactInput = z.infer<typeof contactSchema>;

type Step = 1 | 2 | 3;

function StepIndicator({ current, labels }: { current: Step; labels: string[] }) {
  const steps = [1, 2, 3] as Step[];
  return (
    <nav aria-label="Checkout steps" className="mb-8">
      <ol className="flex items-center gap-0">
        {steps.map((id, idx) => {
          const isDone = current > id;
          const isActive = current === id;

          return (
            <li key={id} className="flex flex-1 items-center">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={[
                    "flex h-8 w-8 items-center justify-center rounded-[3px] border-2 text-xs font-bold tnum transition-colors",
                    isDone
                      ? "border-signal bg-signal text-signal-foreground"
                      : isActive
                      ? "border-ink bg-ink/5 text-ink dark:border-signal dark:text-signal"
                      : "border-border bg-muted text-muted-foreground",
                  ].join(" ")}
                  aria-current={isActive ? "step" : undefined}
                >
                  {isDone ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    id
                  )}
                </div>
                <span
                  className={[
                    "mt-1.5 text-center text-xs font-medium hidden sm:block",
                    isActive ? "text-foreground" : "text-muted-foreground",
                  ].join(" ")}
                >
                  {labels[idx]}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={[
                    "h-px flex-1 mx-2 transition-colors",
                    isDone ? "bg-signal" : "bg-border",
                  ].join(" ")}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

interface FieldProps {
  id: string;
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

function Field({ id, label, error, required, children }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-foreground mb-1.5">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

const inputCls =
  "w-full rounded-[3px] border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:opacity-50";

export default function CheckoutPage() {
  const router = useRouter();
  const storeItems = useCartStore((s) => s.items);
  const { t, intl } = useI18n();
  const [step, setStep] = useState<Step>(1);
  const [email, setEmail] = useState("");
  const [isRedirecting, setIsRedirecting] = useState(false);

  // The cart is persisted to localStorage — only trust it once the client
  // has mounted, so the first render matches the server and hydration
  // doesn't flip between "empty" and "has items".
  const mounted = useHydrated();
  const items = mounted ? storeItems : [];

  // Redirect if cart is empty
  useEffect(() => {
    if (mounted && storeItems.length === 0) {
      router.replace("/products");
    }
  }, [mounted, storeItems.length, router]);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING_RATE;
  const total = subtotal + shippingCost;

  // Contact form
  const contactForm = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
  });

  // Shipping form
  const shippingForm = useForm<ShippingAddressInput>({
    resolver: zodResolver(shippingAddressSchema),
  });

  async function onStep1Next() {
    const contactValid = await contactForm.trigger();
    const shippingValid = await shippingForm.trigger();

    if (!contactValid || !shippingValid) return;

    const contactData = contactForm.getValues();
    setEmail(contactData.email);
    setStep(2);
  }

  async function handlePayment() {
    setIsRedirecting(true);
    try {
      const shippingAddress = shippingForm.getValues();
      const result = await createCheckoutSession(
        { email, shippingAddress, items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })) },
        items
      );

      if ("error" in result) {
        toast.error(result.error);
        setIsRedirecting(false);
        return;
      }

      // Hard navigation to Stripe's hosted checkout (an external URL) — not a
      // route the app owns, so router.push doesn't apply here.
      // eslint-disable-next-line react-hooks/immutability -- intentional external redirect, not component state
      window.location.href = result.sessionUrl;
    } catch {
      toast.error(t("checkout.errorGeneric"));
      setIsRedirecting(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const stepLabels = [t("checkout.shippingAddress"), t("checkout.summary"), "Payment"];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center gap-3">
        <ShoppingBag className="h-6 w-6 text-ink dark:text-signal" />
        <h1 className="font-board text-2xl font-bold uppercase tracking-tight">{t("checkout.title")}</h1>
      </div>

      <StepIndicator current={step} labels={stepLabels} />

      {/* Step 1: Contact & Shipping */}
      {step === 1 && (
        <div className="space-y-6">
          {/* Contact */}
          <section className="rounded-[4px] border border-border bg-card p-6">
            <h2 className="mb-4 text-base font-bold">{t("checkout.contact")}</h2>
            <Field
              id="email"
              label={t("checkout.email")}
              error={contactForm.formState.errors.email?.message}
              required
            >
              <input
                id="email"
                type="email"
                autoComplete="email"
                className={inputCls}
                placeholder="you@example.com"
                {...contactForm.register("email")}
              />
            </Field>
          </section>

          {/* Shipping */}
          <section className="rounded-[4px] border border-border bg-card p-6">
            <h2 className="mb-4 text-base font-bold">{t("checkout.shippingAddress")}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id="firstName"
                label={t("checkout.firstName")}
                error={shippingForm.formState.errors.firstName?.message}
                required
              >
                <input
                  id="firstName"
                  type="text"
                  autoComplete="given-name"
                  className={inputCls}
                  placeholder="Elena"
                  {...shippingForm.register("firstName")}
                />
              </Field>

              <Field
                id="lastName"
                label={t("checkout.lastName")}
                error={shippingForm.formState.errors.lastName?.message}
                required
              >
                <input
                  id="lastName"
                  type="text"
                  autoComplete="family-name"
                  className={inputCls}
                  placeholder="Papadopoulou"
                  {...shippingForm.register("lastName")}
                />
              </Field>

              <div className="sm:col-span-2">
                <Field
                  id="street"
                  label={t("checkout.street")}
                  error={shippingForm.formState.errors.street?.message}
                  required
                >
                  <input
                    id="street"
                    type="text"
                    autoComplete="street-address"
                    className={inputCls}
                    placeholder="Leoforos Archiepiskopou Makariou III 12"
                    {...shippingForm.register("street")}
                  />
                </Field>
              </div>

              <Field
                id="city"
                label={t("checkout.city")}
                error={shippingForm.formState.errors.city?.message}
                required
              >
                <input
                  id="city"
                  type="text"
                  autoComplete="address-level2"
                  className={inputCls}
                  placeholder="Nicosia"
                  {...shippingForm.register("city")}
                />
              </Field>

              <Field
                id="state"
                label={t("checkout.state")}
                error={shippingForm.formState.errors.state?.message}
                required
              >
                <input
                  id="state"
                  type="text"
                  autoComplete="address-level1"
                  className={inputCls}
                  placeholder="Nicosia District"
                  {...shippingForm.register("state")}
                />
              </Field>

              <Field
                id="postalCode"
                label={t("checkout.postalCode")}
                error={shippingForm.formState.errors.postalCode?.message}
                required
              >
                <input
                  id="postalCode"
                  type="text"
                  autoComplete="postal-code"
                  className={inputCls}
                  placeholder="1065"
                  {...shippingForm.register("postalCode")}
                />
              </Field>

              <Field
                id="country"
                label={t("checkout.country")}
                error={shippingForm.formState.errors.country?.message}
                required
              >
                <input
                  id="country"
                  type="text"
                  autoComplete="country-name"
                  className={inputCls}
                  placeholder="Cyprus"
                  {...shippingForm.register("country")}
                />
              </Field>

              <div className="sm:col-span-2">
                <Field
                  id="phone"
                  label={t("checkout.phone")}
                  error={shippingForm.formState.errors.phone?.message}
                >
                  <input
                    id="phone"
                    type="tel"
                    autoComplete="tel"
                    className={inputCls}
                    placeholder="+357 99 000000"
                    {...shippingForm.register("phone")}
                  />
                </Field>
              </div>
            </div>
          </section>

          <p className="text-xs text-muted-foreground">{t("checkout.vatNote")}</p>

          <div className="flex justify-end">
            <Button onClick={onStep1Next} className="gap-2 h-10 px-6 rounded-[3px] bg-signal text-signal-foreground hover:bg-signal-deep">
              Continue to review
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Review */}
      {step === 2 && (
        <div className="space-y-6">
          <section className="rounded-[4px] border border-border bg-card divide-y divide-border overflow-hidden">
            <div className="px-6 py-4">
              <h2 className="text-base font-bold">{t("checkout.summary")}</h2>
            </div>

            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 px-6 py-4">
                <div className="relative h-16 w-16 flex-none overflow-hidden rounded-[3px] border border-border bg-muted">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <ShoppingBag className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
                  <p className="text-xs tnum text-muted-foreground">{item.quantity}× {formatPrice(item.price, undefined, intl)}</p>
                </div>
                <p className="text-sm font-semibold tnum">
                  {formatPrice(item.price * item.quantity, undefined, intl)}
                </p>
              </div>
            ))}

            <div className="px-6 py-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("checkout.subtotal")}</span>
                <span className="tnum">{formatPrice(subtotal, undefined, intl)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("checkout.shipping")}</span>
                <span className="tnum">
                  {shippingCost === 0 ? (
                    <span className="text-go font-medium">{t("common.free")}</span>
                  ) : (
                    formatPrice(shippingCost, undefined, intl)
                  )}
                </span>
              </div>
              <div className="flex justify-between text-base font-bold border-t border-border pt-2 mt-2">
                <span>{t("checkout.total")}</span>
                <span className="tnum">{formatPrice(total, undefined, intl)}</span>
              </div>
            </div>
          </section>

          {/* Shipping address summary */}
          <section className="rounded-[4px] border border-border bg-card p-6">
            <h2 className="mb-3 text-base font-bold">{t("order.shippingTo")}</h2>
            <div className="text-sm text-muted-foreground space-y-0.5">
              {(() => {
                const a = shippingForm.getValues();
                return (
                  <>
                    <p className="text-foreground font-medium">{a.firstName} {a.lastName}</p>
                    <p>{a.street}</p>
                    <p>{a.city}, {a.state} {a.postalCode}</p>
                    <p>{a.country}</p>
                    {a.phone && <p>{a.phone}</p>}
                  </>
                );
              })()}
            </div>
          </section>

          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => setStep(1)} className="gap-2 rounded-[3px]">
              <ChevronLeft className="h-4 w-4" />
              {t("common.back")}
            </Button>
            <Button onClick={() => setStep(3)} className="gap-2 h-10 px-6 rounded-[3px] bg-signal text-signal-foreground hover:bg-signal-deep">
              Proceed to payment
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Payment */}
      {step === 3 && (
        <div className="space-y-6">
          <section className="rounded-[4px] border border-border bg-card p-6">
            <h2 className="mb-2 text-base font-bold">Secure payment</h2>
            <p className="text-sm text-muted-foreground mb-6">{t("checkout.secure")}</p>

            <div className="rounded-[3px] bg-muted/50 border border-border p-4 flex items-start gap-3">
              <div className="mt-0.5 flex-none rounded-[2px] bg-signal/20 p-1.5">
                <Lock className="h-4 w-4 text-ink dark:text-signal" />
              </div>
              <div>
                <p className="text-sm font-medium">256-bit SSL encryption</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Your payment information is protected at all times.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-between text-sm border-t border-border pt-4">
              <span className="text-muted-foreground">{t("checkout.total")}</span>
              <span className="text-base font-bold tnum">{formatPrice(total, undefined, intl)}</span>
            </div>
          </section>

          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => setStep(2)} className="gap-2 rounded-[3px]" disabled={isRedirecting}>
              <ChevronLeft className="h-4 w-4" />
              {t("common.back")}
            </Button>
            <Button
              onClick={handlePayment}
              className="gap-2 h-10 px-8 rounded-[3px] bg-signal text-signal-foreground hover:bg-signal-deep"
              disabled={isRedirecting}
            >
              {isRedirecting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("checkout.processing")}
                </>
              ) : (
                <>
                  {t("checkout.payWithStripe")} · {formatPrice(total, undefined, intl)}
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
