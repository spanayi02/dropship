/**
 * AliExpress adapter.
 *
 * Decision (see PRODUCT.md): AliExpress stays a *manual* supplier until the
 * owner has AliExpress Dropshipping (DS) API approval. That approval needs an
 * AliExpress open-platform app, an approved DS "Dropshipper" role and OAuth
 * against the seller account — none of which exist yet, and the old stub only
 * threw on every call, which made any AliExpress listing crash price sync.
 *
 * So: AliExpress listings behave exactly like other manual suppliers (prices
 * and stock from ProductSupplier rows, orders via the admin queue with the
 * AliExpress order number typed in), while catalog search stays unavailable
 * with a clear message. When the DS API is approved, implement the
 * `search / livePricing / autoOrder` paths here and flip the capabilities.
 */
import { ManualSupplierAdapter, type ManualAdapterOptions } from "./manual";
import { SupplierNotConfiguredError, type SupplierProduct } from "./types";

export const ALIEXPRESS_API_NOTICE =
  "AliExpress catalog search is not connected: the AliExpress Dropshipping API needs an approved developer app (https://openservice.aliexpress.com). Until then, add AliExpress listings by hand or via CSV import and place orders from the supplier queue.";

export class AliExpressAdapter extends ManualSupplierAdapter {
  constructor(opts: ManualAdapterOptions = {}) {
    super({
      ...opts,
      apiType: opts.apiType ?? "ALIEXPRESS",
      name: opts.name ?? "AliExpress",
      type: "aliexpress",
    });
  }

  async searchProducts(): Promise<SupplierProduct[]> {
    throw new SupplierNotConfiguredError(ALIEXPRESS_API_NOTICE);
  }
}
