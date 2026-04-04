"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, ChevronLeft, ChevronRight, ShoppingBag } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart-store";
import { formatPrice } from "@/lib/utils";
import { shippingAddressSchema, type ShippingAddressInput } from "@/lib/validations/order";
import { createCheckoutSession } from "@/app/actions/checkout";
import { z } from "zod";

const FLAT_SHIPPING_RATE = 499;
const FREE_SHIPPING_THRESHOLD = 5000;

const contactSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type ContactInput = z.infer<typeof contactSchema>;

type Step = 1 | 2 | 3;

const STEPS = [
  { id: 1 as Step, label: "Contact & Shipping" },
  { id: 2 as Step, label: "Review Order" },
  { id: 3 as Step, label: "Payment" },
];

function StepIndicator({ current }: { current: Step }) {
  return (
    <nav aria-label="Checkout steps" className="mb-8">
      <ol className="flex items-center gap-0">
        {STEPS.map((step, idx) => {
          const isDone = current > step.id;
          const isActive = current === step.id;

          return (
            <li key={step.id} className="flex flex-1 items-center">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={[
                    "flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors",
                    isDone
                      ? "border-primary bg-primary text-primary-foreground"
                      : isActive
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-muted bg-muted text-muted-foreground",
                  ].join(" ")}
                  aria-current={isActive ? "step" : undefined}
                >
                  {isDone ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step.id
                  )}
                </div>
                <span
                  className={[
                    "mt-1.5 text-center text-xs font-medium hidden sm:block",
                    isActive ? "text-foreground" : "text-muted-foreground",
                  ].join(" ")}
                >
                  {step.label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={[
                    "h-px flex-1 mx-2 transition-colors",
                    isDone ? "bg-primary" : "bg-border",
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
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:opacity-50";

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const [step, setStep] = useState<Step>(1);
  const [email, setEmail] = useState("");
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      router.replace("/products");
    }
  }, [items, router]);

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

  async function handleStep1Submit(
    contactData: ContactInput,
    shippingData: ShippingAddressInput
  ) {
    setEmail(contactData.email);
    setStep(2);
  }

  async function onStep1Next() {
    const contactValid = await contactForm.trigger();
    const shippingValid = await shippingForm.trigger();

    if (!contactValid || !shippingValid) return;

    const contactData = contactForm.getValues();
    const shippingData = shippingForm.getValues();
    handleStep1Submit(contactData, shippingData);
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

      window.location.href = result.sessionUrl;
    } catch {
      toast.error("Failed to initiate payment. Please try again.");
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

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center gap-3">
        <ShoppingBag className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-semibold tracking-tight">Checkout</h1>
      </div>

      <StepIndicator current={step} />

      {/* Step 1: Contact & Shipping */}
      {step === 1 && (
        <div className="space-y-6">
          {/* Contact */}
          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 text-base font-semibold">Contact information</h2>
            <Field
              id="email"
              label="Email address"
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
          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 text-base font-semibold">Shipping address</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id="firstName"
                label="First name"
                error={shippingForm.formState.errors.firstName?.message}
                required
              >
                <input
                  id="firstName"
                  type="text"
                  autoComplete="given-name"
                  className={inputCls}
                  placeholder="Jane"
                  {...shippingForm.register("firstName")}
                />
              </Field>

              <Field
                id="lastName"
                label="Last name"
                error={shippingForm.formState.errors.lastName?.message}
                required
              >
                <input
                  id="lastName"
                  type="text"
                  autoComplete="family-name"
                  className={inputCls}
                  placeholder="Smith"
                  {...shippingForm.register("lastName")}
                />
              </Field>

              <div className="sm:col-span-2">
                <Field
                  id="street"
                  label="Street address"
                  error={shippingForm.formState.errors.street?.message}
                  required
                >
                  <input
                    id="street"
                    type="text"
                    autoComplete="street-address"
                    className={inputCls}
                    placeholder="123 Main St"
                    {...shippingForm.register("street")}
                  />
                </Field>
              </div>

              <Field
                id="city"
                label="City"
                error={shippingForm.formState.errors.city?.message}
                required
              >
                <input
                  id="city"
                  type="text"
                  autoComplete="address-level2"
                  className={inputCls}
                  placeholder="New York"
                  {...shippingForm.register("city")}
                />
              </Field>

              <Field
                id="state"
                label="State / Province"
                error={shippingForm.formState.errors.state?.message}
                required
              >
                <input
                  id="state"
                  type="text"
                  autoComplete="address-level1"
                  className={inputCls}
                  placeholder="NY"
                  {...shippingForm.register("state")}
                />
              </Field>

              <Field
                id="postalCode"
                label="Postal code"
                error={shippingForm.formState.errors.postalCode?.message}
                required
              >
                <input
                  id="postalCode"
                  type="text"
                  autoComplete="postal-code"
                  className={inputCls}
                  placeholder="10001"
                  {...shippingForm.register("postalCode")}
                />
              </Field>

              <Field
                id="country"
                label="Country"
                error={shippingForm.formState.errors.country?.message}
                required
              >
                <input
                  id="country"
                  type="text"
                  autoComplete="country-name"
                  className={inputCls}
                  placeholder="United States"
                  {...shippingForm.register("country")}
                />
              </Field>

              <div className="sm:col-span-2">
                <Field
                  id="phone"
                  label="Phone (optional)"
                  error={shippingForm.formState.errors.phone?.message}
                >
                  <input
                    id="phone"
                    type="tel"
                    autoComplete="tel"
                    className={inputCls}
                    placeholder="+1 555 000 0000"
                    {...shippingForm.register("phone")}
                  />
                </Field>
              </div>
            </div>
          </section>

          <div className="flex justify-end">
            <Button onClick={onStep1Next} className="gap-2 h-10 px-6">
              Continue to review
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Review */}
      {step === 2 && (
        <div className="space-y-6">
          <section className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
            <div className="px-6 py-4">
              <h2 className="text-base font-semibold">Order summary</h2>
            </div>

            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 px-6 py-4">
                <div className="relative h-16 w-16 flex-none overflow-hidden rounded-lg border border-border bg-muted">
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
                  <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                </div>
                <p className="text-sm font-semibold tabular-nums">
                  {formatPrice(item.price * item.quantity)}
                </p>
              </div>
            ))}

            <div className="px-6 py-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="tabular-nums">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span className="tabular-nums">
                  {shippingCost === 0 ? (
                    <span className="text-green-600 font-medium">Free</span>
                  ) : (
                    formatPrice(shippingCost)
                  )}
                </span>
              </div>
              <div className="flex justify-between text-base font-semibold border-t border-border pt-2 mt-2">
                <span>Total</span>
                <span className="tabular-nums">{formatPrice(total)}</span>
              </div>
            </div>
          </section>

          {/* Shipping address summary */}
          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-3 text-base font-semibold">Shipping to</h2>
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
            <Button variant="ghost" onClick={() => setStep(1)} className="gap-2">
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
            <Button onClick={() => setStep(3)} className="gap-2 h-10 px-6">
              Proceed to payment
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Payment */}
      {step === 3 && (
        <div className="space-y-6">
          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-2 text-base font-semibold">Secure payment</h2>
            <p className="text-sm text-muted-foreground mb-6">
              You will be redirected to Stripe&apos;s secure checkout to complete your purchase.
              Your card details are never stored on our servers.
            </p>

            <div className="rounded-lg bg-muted/50 border border-border p-4 flex items-start gap-3">
              <div className="mt-0.5 flex-none rounded-full bg-primary/10 p-1.5">
                <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium">256-bit SSL encryption</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Your payment information is protected at all times.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-between text-sm border-t border-border pt-4">
              <span className="text-muted-foreground">Order total</span>
              <span className="text-base font-semibold tabular-nums">{formatPrice(total)}</span>
            </div>
          </section>

          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => setStep(2)} className="gap-2" disabled={isRedirecting}>
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
            <Button
              onClick={handlePayment}
              className="gap-2 h-10 px-8"
              disabled={isRedirecting}
            >
              {isRedirecting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Redirecting…
                </>
              ) : (
                <>
                  Pay {formatPrice(total)}
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
