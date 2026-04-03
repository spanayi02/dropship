import { SupplierAdapter } from "./types";
import { ManualSupplierAdapter } from "./manual";
import { AliExpressAdapter } from "./aliexpress";
import { CJDropshippingAdapter, type CJCredentials } from "./cj";

export function getSupplierAdapter(
  type: string,
  credentials?: unknown
): SupplierAdapter {
  switch (type.toLowerCase()) {
    case "manual":
      return new ManualSupplierAdapter();
    case "aliexpress":
      return new AliExpressAdapter();
    case "cj":
      if (!credentials || typeof credentials !== "object") {
        throw new Error(
          "CJ Dropshipping requires credentials: { email, apiKey }. Add them in the supplier settings."
        );
      }
      return new CJDropshippingAdapter(credentials as CJCredentials);
    default:
      throw new Error(`Unknown supplier adapter type: ${type}`);
  }
}
