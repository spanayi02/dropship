/**
 * Country helpers shared by checkout, suppliers and the storefront.
 * Checkout stores the country as the customer typed it ("Cyprus", "Κύπρος",
 * "CY"); supplier APIs need ISO-3166 alpha-2. Resolve leniently here.
 */

const ISO_CODES = [
  "AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IE","IT","LV","LT","LU",
  "MT","NL","PL","PT","RO","SK","SI","ES","SE","GB","CH","NO","IS","LI","US","CA","AU","NZ",
  "CN","HK","JP","KR","SG","AE","IL","TR","UA","RS","BA","MK","AL","ME","MD","GE","IN","BR",
  "MX","ZA","EG","MA","SA","QA","KW",
];

const ALIASES: Record<string, string> = {
  // Greek
  "κύπρος": "CY", "κυπρος": "CY", "ελλάδα": "GR", "ελλαδα": "GR", "ελλάς": "GR",
  "γερμανία": "DE", "γερμανια": "DE", "ιταλία": "IT", "ιταλια": "IT", "γαλλία": "FR", "γαλλια": "FR",
  "ισπανία": "ES", "ισπανια": "ES", "ολλανδία": "NL", "ολλανδια": "NL", "βέλγιο": "BE", "βελγιο": "BE",
  "αυστρία": "AT", "αυστρια": "AT", "ηνωμένο βασίλειο": "GB", "αγγλία": "GB",
  // English variants
  "uk": "GB", "united kingdom": "GB", "great britain": "GB", "england": "GB", "britain": "GB",
  "usa": "US", "united states": "US", "united states of america": "US", "america": "US",
  "holland": "NL", "the netherlands": "NL", "czech republic": "CZ", "czechia": "CZ",
  "republic of cyprus": "CY", "hellas": "GR", "deutschland": "DE", "españa": "ES", "italia": "IT",
  "österreich": "AT", "osterreich": "AT", "schweiz": "CH", "suisse": "CH", "svizzera": "CH",
  "united arab emirates": "AE", "uae": "AE", "south korea": "KR", "korea": "KR",
};

let byName: Map<string, string> | null = null;

function nameIndex(): Map<string, string> {
  if (byName) return byName;
  byName = new Map();
  for (const [k, v] of Object.entries(ALIASES)) byName.set(k, v);
  for (const lang of ["en", "el"]) {
    let dn: Intl.DisplayNames | null = null;
    try {
      dn = new Intl.DisplayNames([lang], { type: "region" });
    } catch {
      dn = null;
    }
    if (!dn) continue;
    for (const code of ISO_CODES) {
      const name = dn.of(code);
      if (name && name !== code) byName.set(name.toLowerCase(), code);
    }
  }
  return byName;
}

/** "Cyprus" | "Κύπρος" | "cy" → "CY". Unknown input is returned uppercased if 2 letters, else null. */
export function toCountryCode(input: string | null | undefined): string | null {
  const raw = (input ?? "").trim();
  if (!raw) return null;
  if (/^[A-Za-z]{2}$/.test(raw)) return raw.toUpperCase();
  const hit = nameIndex().get(raw.toLowerCase());
  return hit ?? null;
}

export function countryDisplayName(code: string, locale = "en"): string {
  try {
    return new Intl.DisplayNames([locale], { type: "region" }).of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}
