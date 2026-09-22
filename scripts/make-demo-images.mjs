/**
 * Generates the demo catalog imagery used by prisma/seed.ts.
 *
 * These are deliberately NOT fake product photos. They are neutral studio
 * pictogram plates, so a demo store looks designed instead of broken, and
 * nobody mistakes them for supplier photography.
 * Replace them by importing real products (admin → Import) — imported products
 * carry the supplier's photography.
 *
 * Provenance: produced by this script from Phosphor Icons (MIT) pictograms.
 *
 * Usage: node scripts/make-demo-images.mjs
 */
import { readFileSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import path from "node:path";

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const outDir = path.join(root, "public", "demo");
mkdirSync(path.join(outDir, "products"), { recursive: true });
mkdirSync(path.join(outDir, "categories"), { recursive: true });

// Resolve playwright from the global install if not local
let chromium;
try {
  ({ chromium } = require("playwright"));
} catch {
  const globalRoot = execSync("npm root -g").toString().trim();
  ({ chromium } = require(path.join(globalRoot, "playwright")));
}

const ICON_DIR = path.join(root, "node_modules/@phosphor-icons/core/assets/fill");
function iconPath(name) {
  const svg = readFileSync(path.join(ICON_DIR, `${name}-fill.svg`), "utf8");
  const m = svg.match(/<path[^>]*d="([^"]+)"/);
  if (!m) throw new Error(`no path in ${name}`);
  return m[1];
}

// Cool-neutral studio fields (oklch-ish, expressed as hex for the renderer)
const FIELDS = ["#EEF0F3", "#E7EAEE", "#F2F3F5", "#E3E6EB", "#EBEDF0", "#F5F6F8"];

/** slug → [primary icon, detail icon, field index, label] */
const PRODUCTS = {
  "wireless-noise-canceling-earbuds-pro": ["headphones", "waveform", 0, "AUDIO"],
  "smart-led-desk-lamp-with-usb-charging": ["lamp", "lightbulb", 1, "DESK"],
  "portable-bluetooth-speaker-waterproof": ["speaker-high", "drop", 2, "AUDIO"],
  "4k-action-camera-with-accessories-kit": ["camera", "video-camera", 3, "CAMERA"],
  "mechanical-keyboard-rgb-backlit-tkl": ["keyboard", "cpu", 4, "DESK"],
  "minimalist-leather-crossbody-bag": ["handbag", "tote", 5, "BAG"],
  "classic-oversized-hoodie-unisex": ["hoodie", "t-shirt", 0, "APPAREL"],
  "premium-stainless-steel-watch-minimalist": ["watch", "gear", 1, "WATCH"],
  "polarized-sunglasses-uv400-protection": ["sunglasses", "sun", 2, "EYEWEAR"],
  "ceramic-pour-over-coffee-set": ["coffee", "drop-simple", 3, "KITCHEN"],
  "linen-throw-blanket-extra-soft": ["bed", "towel", 4, "HOME"],
  "bamboo-cutting-board-set-of-3": ["knife", "fork-knife", 5, "KITCHEN"],
  "aromatherapy-diffuser-500ml-ultrasonic": ["flower-lotus", "wind", 0, "HOME"],
  "resistance-bands-set-5-levels": ["barbell", "person-simple-run", 1, "FITNESS"],
  "insulated-water-bottle-32oz-stainless": ["thermometer", "drop", 2, "OUTDOOR"],
  "yoga-mat-non-slip-extra-thick-6mm": ["person-simple-tai-chi", "leaf", 3, "FITNESS"],
  "facial-gua-sha-tool-rose-quartz": ["sparkle", "heart", 4, "SKINCARE"],
  "led-face-mask-light-therapy-7-colors": ["smiley", "lightning", 5, "SKINCARE"],
  "natural-bristle-hair-brush-detangling": ["scissors", "wind", 0, "HAIR"],
  "vitamin-c-serum-with-hyaluronic-acid": ["test-tube", "drop", 1, "SKINCARE"],
};

// Neutral tonal fields; the page overlays the category name itself, so the
// plate carries no text of its own.
const CATEGORIES = {
  electronics: ["plug", "#E8EBEF", "#2B2F36"],
  "fashion-apparel": ["t-shirt", "#E2E5EA", "#2B2F36"],
  "home-living": ["house", "#EDEFF2", "#2B2F36"],
  "sports-outdoors": ["sneaker", "#E5E8ED", "#2B2F36"],
  "beauty-health": ["sparkle", "#EAECF0", "#2B2F36"],
};

function productSvg({ icon, field, label, sku, variant }) {
  const d = iconPath(icon);
  const rot = variant === 1 ? -8 : 0;
  const scale = variant === 1 ? 1.7 : 2.0;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200">
  <defs>
    <radialGradient id="floor" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#000" stop-opacity="0.16"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="sweep" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="1200" fill="${field}"/>
  <rect width="1200" height="1200" fill="url(#sweep)"/>
  <ellipse cx="600" cy="905" rx="330" ry="52" fill="url(#floor)"/>
  <g transform="translate(600 600) rotate(${rot}) scale(${scale * 1.6}) translate(-128 -128)">
    <path d="${d}" fill="#131418"/>
  </g>
  <!-- discreet demo mark: honest about what this is, quiet enough to ignore -->
  <text x="1140" y="1152" text-anchor="end" font-family="Inter, Arial, sans-serif"
        font-size="20" letter-spacing="2" fill="#8b9098">DEMO · ${sku}</text>
</svg>`;
}

function categorySvg({ icon, bg, ink }) {
  const d = iconPath(icon);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
  <defs>
    <linearGradient id="field" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.75"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="floor" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#000" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="900" fill="${bg}"/>
  <rect width="1200" height="900" fill="url(#field)"/>
  <ellipse cx="600" cy="690" rx="260" ry="40" fill="url(#floor)"/>
  <g transform="translate(600 440) scale(2.1) translate(-128 -128)">
    <path d="${d}" fill="${ink}"/>
  </g>
</svg>`;
}

async function render(browser, svg, outFile, width, height) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await page.setContent(`<html><body style="margin:0;background:#fff">${svg}</body></html>`);
  await page.screenshot({ path: outFile, type: "jpeg", quality: 86, clip: { x: 0, y: 0, width, height } });
  await page.close();
}

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH ?? (existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : undefined),
  args: ["--no-sandbox"],
});

let n = 0;
for (const [slug, [icon, icon2, fieldIdx, label]] of Object.entries(PRODUCTS)) {
  const sku = `WL-${slug.slice(0, 3).toUpperCase()}${String(n + 1).padStart(3, "0")}`;
  await render(browser, productSvg({ icon, field: FIELDS[fieldIdx], label, sku, variant: 0 }), path.join(outDir, "products", `${slug}-1.jpg`), 1200, 1200);
  await render(browser, productSvg({ icon: icon2, field: FIELDS[(fieldIdx + 3) % FIELDS.length], label, sku, variant: 1 }), path.join(outDir, "products", `${slug}-2.jpg`), 1200, 1200);
  n++;
}
for (const [slug, [icon, bg, ink]] of Object.entries(CATEGORIES)) {
  await render(browser, categorySvg({ icon, bg, ink }), path.join(outDir, "categories", `${slug}.jpg`), 1200, 900);
}
await browser.close();

writeFileSync(
  path.join(outDir, "PROVENANCE.txt"),
  `Demo imagery generated by scripts/make-demo-images.mjs from Phosphor Icons (MIT).\nNot product photography. Replace by importing real supplier products.\n`
);
console.log(`Wrote ${n * 2} product plates and ${Object.keys(CATEGORIES).length} category plates to public/demo`);
