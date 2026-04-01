import { SupplierAdapter } from "./types";
import { ManualSupplierAdapter } from "./manual";
import { AliExpressAdapter } from "./aliexpress";
import { CJDropshippingAdapter } from "./cj";

export function getSupplierAdapter(type: string): SupplierAdapter {
  switch (type.toLowerCase()) {
    case "manual":
      return new ManualSupplierAdapter();
    case "aliexpress":
      return new AliExpressAdapter();
    case "cj":
      return new CJDropshippingAdapter();
    default:
      throw new Error(`Unknown supplier adapter type: ${type}`);
  }
}
