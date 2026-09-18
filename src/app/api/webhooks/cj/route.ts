/**
 * CJ Dropshipping webhook receiver
 *
 * Register once with the CJ API (see README → CJ Dropshipping → Webhooks):
 *   POST /webhook/set { order: { type: "ENABLE", callbackUrls: [URL] },
 *                       logistics: { type: "ENABLE", callbackUrls: [URL] }, ... }
 * where URL = https://<your-domain>/api/webhooks/cj
 *
 * Authentication — two independent checks, either one is enough:
 *  1. CJ signs every push: header `sign` = Base64(HMAC-SHA256(rawBody, openId)).
 *     openId is returned by getAccessToken; we read it from the CJ supplier row
 *     (persisted by the adapter) or CJ_OPEN_ID.
 *  2. A shared secret in the URL: ?secret=<CJ_WEBHOOK_SECRET>. Use this if you
 *     register the URL before the first token fetch stored an openId.
 *
 * CJ requires a 200 within 3 seconds, so the handler does the minimum DB work
 * and fires emails without awaiting them.
 *
 * Messages handled:
 *  - type ORDER     → params.orderStatus (CREATED … SHIPPED, DELIVERED, CANCELLED)
 *  - type LOGISTIC  → params.trackingStatus (1–11 in transit, 12 delivered)
 *  - legacy flat payload { orderId, orderStatus, trackNumber, logisticUrl }
 */

import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cjTrackingUrl, normalizeCJOrderStatus, normalizeCJTrackingStatus } from "@/lib/suppliers/cj";
import { resolveCJCredentials } from "@/lib/suppliers/factory";
import { applySupplierOrderStatus } from "@/lib/suppliers/order-status";
import type { NormalizedSupplierOrderStatus } from "@/lib/suppliers/types";

export const dynamic = "force-dynamic";

interface CJWebhookMessage {
  messageId?: string;
  type?: string;
  messageType?: string;
  openId?: number | string;
  params?: Record<string, unknown>;
  // legacy flat shape
  orderId?: string;
  orderStatus?: string;
  trackNumber?: string;
  logisticUrl?: string;
  shippingTime?: string;
}

async function knownOpenIds(): Promise<string[]> {
  const ids = new Set<string>();
  if (process.env.CJ_OPEN_ID) ids.add(process.env.CJ_OPEN_ID.trim());
  try {
    const suppliers = await db.supplier.findMany({
      where: { apiType: "CJ" },
      select: { apiCredentials: true },
    });
    for (const s of suppliers) {
      const openId = resolveCJCredentials(s.apiCredentials)?.openId;
      if (openId) ids.add(openId);
    }
  } catch (err) {
    console.error("[cj-webhook] Could not load CJ suppliers for signature check:", err);
  }
  return [...ids];
}

function signatureMatches(rawBody: string, sign: string, openId: string): boolean {
  const expected = createHmac("sha256", openId).update(rawBody).digest("base64");
  const a = Buffer.from(expected);
  const b = Buffer.from(sign);
  return a.length === b.length && timingSafeEqual(a, b);
}

function secretMatches(given: string | null): boolean {
  const expected = process.env.CJ_WEBHOOK_SECRET;
  if (!expected || !given) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(given);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  // ── auth ──
  const sign = req.headers.get("sign");
  let authorized = secretMatches(req.nextUrl.searchParams.get("secret"));
  if (!authorized && sign) {
    const ids = await knownOpenIds();
    authorized = ids.some((id) => signatureMatches(rawBody, sign, id));
  }
  if (!authorized) {
    console.warn("[cj-webhook] Rejected push: bad signature / secret");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let msg: CJWebhookMessage;
  try {
    msg = JSON.parse(rawBody) as CJWebhookMessage;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const type = (msg.type ?? "").toUpperCase();
  const params = msg.params ?? {};
  const str = (o: Record<string, unknown>, k: string) => (typeof o[k] === "string" ? (o[k] as string) : undefined);

  let cjOrderId: string | undefined;
  let ourReferences: string[] = [];
  let normalized: NormalizedSupplierOrderStatus = "unknown";
  let rawStatus = "";
  let trackingNumber: string | undefined;
  let trackingUrl: string | undefined;
  let shippedAt: string | undefined;

  if (type === "ORDER") {
    cjOrderId = str(params, "cjOrderId") ?? str(params, "orderId");
    const ref = str(params, "orderNumber") ?? str(params, "orderNum");
    if (ref) ourReferences = [ref];
    rawStatus = str(params, "orderStatus") ?? "";
    normalized = normalizeCJOrderStatus(rawStatus);
    trackingNumber = str(params, "trackNumber") || undefined;
    trackingUrl = str(params, "trackingUrl") || undefined;
    shippedAt = str(params, "deliveryDate") || undefined;
  } else if (type === "LOGISTIC" || type === "LOGISTICS") {
    cjOrderId = str(params, "orderId");
    const refs = params.storeOrderNumbers;
    if (Array.isArray(refs)) ourReferences = refs.filter((r): r is string => typeof r === "string");
    rawStatus = String(params.trackingStatus ?? "");
    normalized = normalizeCJTrackingStatus(params.trackingStatus as number | string | undefined);
    trackingNumber = str(params, "trackingNumber") || str(params, "trackNumber") || undefined;
    trackingUrl = str(params, "trackingUrl") || undefined;
  } else if (msg.orderId) {
    // legacy flat payload
    cjOrderId = msg.orderId;
    rawStatus = msg.orderStatus ?? "";
    normalized = normalizeCJOrderStatus(rawStatus);
    if (normalized === "unknown" && rawStatus.toLowerCase().includes("ship")) normalized = "shipped";
    trackingNumber = msg.trackNumber || undefined;
    trackingUrl = msg.logisticUrl || undefined;
    shippedAt = msg.shippingTime || undefined;
  } else {
    // PRODUCT / VARIANT / STOCK / ORDERSPLIT etc. — acknowledged, not acted on.
    return NextResponse.json({ received: true, ignored: type || "unknown" });
  }

  if (!cjOrderId && ourReferences.length === 0) {
    return NextResponse.json({ error: "Missing order reference" }, { status: 400 });
  }

  const supplierOrders = await db.supplierOrder.findMany({
    where: {
      OR: [
        ...(cjOrderId ? [{ supplierOrderRef: cjOrderId }] : []),
        ...(ourReferences.length ? [{ supplierOrderRef: { in: ourReferences } }] : []),
        ...(ourReferences.length ? [{ orderItem: { order: { orderNumber: { in: ourReferences.map(stripLineSuffix) } } } }] : []),
      ],
      supplier: { apiType: "CJ" },
    },
    select: { id: true, supplierOrderRef: true },
  });

  if (supplierOrders.length === 0) {
    console.warn(`[cj-webhook] No supplier order for CJ ${cjOrderId ?? ourReferences.join(",")} (${type})`);
    return NextResponse.json({ received: true, matched: 0 });
  }

  if (trackingNumber && !trackingUrl) trackingUrl = cjTrackingUrl(trackingNumber);

  const outcomes: string[] = [];
  for (const so of supplierOrders) {
    // Learn the real CJ order id if we only had our own reference so far.
    if (cjOrderId && so.supplierOrderRef !== cjOrderId) {
      await db.supplierOrder.update({ where: { id: so.id }, data: { supplierOrderRef: cjOrderId } });
    }
    const outcome = await applySupplierOrderStatus(
      so.id,
      { status: rawStatus, normalized, trackingNumber, trackingUrl, shippedAt },
      "cj-webhook"
    );
    outcomes.push(outcome);
  }

  return NextResponse.json({ received: true, matched: supplierOrders.length, outcomes });
}

/** "ORD-20260918-AB12-XY34Z1" → "ORD-20260918-AB12" (our supplier reference adds a line suffix). */
function stripLineSuffix(ref: string): string {
  const m = ref.match(/^(ORD-\d{8}-[A-Z0-9]{4})(?:-[A-Z0-9]{1,6})?$/i);
  return m ? m[1] : ref;
}
