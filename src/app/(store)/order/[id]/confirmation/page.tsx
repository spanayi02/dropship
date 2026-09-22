import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Check, Package, Truck } from "lucide-react";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import { getT } from "@/lib/i18n/server";
import { intlLocale } from "@/lib/i18n";
import { OrderStatusBadge } from "@/components/store/order-status-badge";
import { ClearCart } from "./clear-cart";

interface ConfirmationPageProps {
  params: Promise<{ id: string }>;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export default async function OrderConfirmationPage({ params }: ConfirmationPageProps) {
  const { id } = await params;
  const { t, locale } = await getT();
  const intl = intlLocale(locale);

  const order = await db.order.findUnique({
    where: { id },
    include: {
      user: { select: { email: true } },
      orderItems: {
        include: { product: { select: { title: true, images: true, slug: true } } },
      },
    },
  });

  if (!order) notFound();

  const shippingAddress = order.shippingAddress as {
    firstName: string;
    lastName: string;
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    phone?: string;
  };

  const email = order.user?.email ?? order.guestEmail ?? "";
  const estimatedFrom = addDays(order.createdAt, 3);
  const estimatedTo = addDays(order.createdAt, 7);

  const formatDate = (date: Date) =>
    date.toLocaleDateString(intl, { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="container-store max-w-3xl py-12 sm:py-16">
      <ClearCart />

      {/* Confirmation */}
      <div className="mb-10 text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-success-soft">
          <Check className="h-7 w-7 text-success" strokeWidth={2.5} />
        </div>
        <h1 className="text-3xl sm:text-4xl">{t("order.confirmedTitle")}</h1>
        {email && (
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">
            {t("order.confirmedText", { email })}
          </p>
        )}
      </div>

      {/* Order summary */}
      <section className="card-surface mb-6 overflow-hidden">
        <div className="grid gap-4 border-b border-hairline px-6 py-5 sm:grid-cols-3">
          <div>
            <p className="label-sign text-muted-foreground">{t("order.orderNumber")}</p>
            <p className="mt-1 font-mono text-sm font-medium">{order.orderNumber}</p>
          </div>
          <div>
            <p className="label-sign text-muted-foreground">{t("order.placed")}</p>
            <p className="mt-1 text-sm">{formatDate(order.createdAt)}</p>
          </div>
          <div>
            <p className="label-sign text-muted-foreground">{t("order.status")}</p>
            <div className="mt-1.5">
              <OrderStatusBadge status={order.status} />
            </div>
          </div>
        </div>

        <ul className="divide-y divide-hairline">
          {order.orderItems.map((item) => (
            <li key={item.id} className="flex items-center gap-4 px-6 py-4">
              <div className="media-frame relative h-16 w-16 flex-none">
                {item.product.images[0] && (
                  <Image
                    src={item.product.images[0]}
                    alt={item.product.title}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/products/${item.product.slug}`}
                  className="line-clamp-2 text-sm font-medium underline-offset-2 hover:underline"
                >
                  {item.product.title}
                </Link>
                <p className="mt-0.5 text-sm text-muted-foreground tabular-nums">
                  × {item.quantity}
                </p>
              </div>
              <p className="text-sm font-medium tabular-nums">
                {formatPrice(item.priceAtPurchase * item.quantity, undefined, intl)}
              </p>
            </li>
          ))}
        </ul>

        <div className="space-y-2 border-t border-hairline bg-canvas-soft px-6 py-5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("cart.subtotal")}</span>
            <span className="tabular-nums">{formatPrice(order.subtotal, undefined, intl)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("cart.shipping")}</span>
            <span className="tabular-nums">
              {order.shippingCost === 0 ? (
                <span className="font-medium text-success">{t("common.free")}</span>
              ) : (
                formatPrice(order.shippingCost, undefined, intl)
              )}
            </span>
          </div>
          <div className="flex justify-between border-t border-hairline pt-3 text-base font-semibold">
            <span>{t("order.total")}</span>
            <span className="tabular-nums">{formatPrice(order.total, undefined, intl)}</span>
          </div>
        </div>
      </section>

      {/* Delivery */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <section className="card-surface p-6">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Truck className="h-4 w-4 text-muted-foreground" />
            {t("order.shippingTo")}
          </h2>
          <address className="space-y-0.5 text-sm not-italic text-muted-foreground">
            <p className="font-medium text-foreground">
              {shippingAddress.firstName} {shippingAddress.lastName}
            </p>
            <p>{shippingAddress.street}</p>
            <p>
              {shippingAddress.postalCode} {shippingAddress.city}
              {shippingAddress.state ? `, ${shippingAddress.state}` : ""}
            </p>
            <p>{shippingAddress.country}</p>
            {shippingAddress.phone && <p>{shippingAddress.phone}</p>}
          </address>
        </section>

        <section className="card-surface p-6">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Package className="h-4 w-4 text-muted-foreground" />
            {t("product.eta")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {formatDate(estimatedFrom)} – {formatDate(estimatedTo)}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">{t("order.trackingSoon")}</p>
        </section>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href={`/account/orders/${order.id}`}
          className="inline-flex h-11 flex-1 items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 active:translate-y-px"
        >
          {t("order.viewOrders")}
        </Link>
        <Link
          href="/products"
          className="inline-flex h-11 flex-1 items-center justify-center rounded-lg border border-border-strong px-6 text-sm font-medium transition-colors hover:bg-muted active:translate-y-px"
        >
          {t("order.continueShopping")}
        </Link>
      </div>
    </div>
  );
}
