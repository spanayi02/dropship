import "dotenv/config";
import { PrismaClient, MarkupType, SupplierApiType, OrderStatus, SupplierOrderStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

function slug(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function orderNum() {
  const d = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const r = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ORD-${d}-${r}`;
}

/** Demo product photography lives locally — see scripts/make-demo-images.mjs and public/demo/PROVENANCE.txt */
function demoImg(productSlug: string, n: 1 | 2 = 1) {
  return `/demo/products/${productSlug}-${n}.jpg`;
}
function demoCategoryImg(categorySlug: string) {
  return `/demo/categories/${categorySlug}.jpg`;
}

async function main() {
  console.log("🌱 Seeding database...");

  // ─── Store Settings ──────────────────────────────────────────────
  await db.storeSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      storeName: "WishlistAZ",
      contactEmail: "hello@wishlistaz.com",
      currency: "EUR",
      globalMarkupType: MarkupType.MULTIPLIER,
      globalMarkupValue: 2.3,
      freeShippingThreshold: 5000,
      flatShippingRate: 490,
    },
  });

  // ─── Categories ──────────────────────────────────────────────────
  const categories = await Promise.all([
    db.category.upsert({ where: { slug: "electronics" }, update: {}, create: { name: "Electronics", slug: "electronics", image: demoCategoryImg("electronics") } }),
    db.category.upsert({ where: { slug: "fashion-apparel" }, update: {}, create: { name: "Fashion & Apparel", slug: "fashion-apparel", image: demoCategoryImg("fashion-apparel") } }),
    db.category.upsert({ where: { slug: "home-living" }, update: {}, create: { name: "Home & Living", slug: "home-living", image: demoCategoryImg("home-living") } }),
    db.category.upsert({ where: { slug: "sports-outdoors" }, update: {}, create: { name: "Sports & Outdoors", slug: "sports-outdoors", image: demoCategoryImg("sports-outdoors") } }),
    db.category.upsert({ where: { slug: "beauty-health" }, update: {}, create: { name: "Beauty & Health", slug: "beauty-health", image: demoCategoryImg("beauty-health") } }),
  ]);
  const [electronics, fashion, home, sports, beauty] = categories;
  console.log("✅ Categories seeded");

  // ─── Suppliers ───────────────────────────────────────────────────
  // A realistic mix: CJ (API, EU warehouse) is the only one that auto-orders.
  // FastShip / QualityFirst are manual EU/CY suppliers the owner already deals with.
  // Alibaba and Made-in-China are B2B sources: no dropship API, so they carry MOQ,
  // lead time and a quoted-in-USD cost — handled as structured manual suppliers.
  const [cjEu, fastShip, qualityFirst, alibabaSupplier, micSupplier] = await Promise.all([
    db.supplier.upsert({
      where: { id: "supplier-cj" }, update: {},
      create: {
        id: "supplier-cj", name: "CJ Dropshipping (EU warehouse)",
        website: "https://cjdropshipping.com", apiType: SupplierApiType.CJ,
        rating: 4.4, avgShippingDays: 5, warehouseCountry: "DE", leadTimeDays: 1,
        contactUrl: "https://cjdropshipping.com/my-cj.html",
        notes: "API credentials in .env / admin → Suppliers. Auto-orders on checkout.",
      },
    }),
    db.supplier.upsert({
      where: { id: "supplier-fast" }, update: {},
      create: {
        id: "supplier-fast", name: "FastShip Co",
        website: "https://fastship.example.com", apiType: SupplierApiType.MANUAL,
        rating: 4.5, avgShippingDays: 6, warehouseCountry: "NL", leadTimeDays: 1,
        contactEmail: "orders@fastship.example.com",
      },
    }),
    db.supplier.upsert({
      where: { id: "supplier-quality" }, update: {},
      create: {
        id: "supplier-quality", name: "QualityFirst CY",
        website: "https://qualityfirst.example.com", apiType: SupplierApiType.MANUAL,
        rating: 4.8, avgShippingDays: 3, warehouseCountry: "CY", leadTimeDays: 1,
        contactEmail: "hello@qualityfirst.example.com",
      },
    }),
    db.supplier.upsert({
      where: { id: "supplier-alibaba" }, update: {},
      create: {
        id: "supplier-alibaba", name: "Alibaba — Shenzhen Yuexin Electronics Co.",
        website: "https://yuexin-electronics.en.alibaba.com", apiType: SupplierApiType.ALIBABA,
        rating: 4.1, avgShippingDays: 22, warehouseCountry: "CN", leadTimeDays: 7,
        contactUrl: "https://yuexin-electronics.en.alibaba.com/contactus.html",
        paymentTerms: "30% deposit, 70% before shipment · Trade Assurance",
        notes: "B2B, no dropship API. Quote by chat, invoice by Trade Assurance order. MOQ per SKU below.",
      },
    }),
    db.supplier.upsert({
      where: { id: "supplier-mic" }, update: {},
      create: {
        id: "supplier-mic", name: "Made-in-China — Ningbo Haoyu Houseware Co.",
        website: "https://haoyu-houseware.en.made-in-china.com", apiType: SupplierApiType.MADE_IN_CHINA,
        rating: 4.0, avgShippingDays: 24, warehouseCountry: "CN", leadTimeDays: 10,
        contactUrl: "https://haoyu-houseware.en.made-in-china.com/contactus.html",
        paymentTerms: "T/T, 50% deposit",
        notes: "B2B, no dropship API. Sample first, then bulk PO. MOQ per SKU below.",
      },
    }),
  ]);
  console.log("✅ Suppliers seeded");

  // ─── Users ───────────────────────────────────────────────────────
  const customerPassword = await bcrypt.hash("password123", 10);
  const adminPassword = await bcrypt.hash("admin123", 10);

  const [customer, admin] = await Promise.all([
    db.user.upsert({ where: { email: "test@example.com" }, update: {}, create: { email: "test@example.com", name: "Elena Papadopoulou", hashedPassword: customerPassword, role: "CUSTOMER", emailVerified: new Date() } }),
    db.user.upsert({ where: { email: "admin@example.com" }, update: {}, create: { email: "admin@example.com", name: "Admin", hashedPassword: adminPassword, role: "ADMIN", emailVerified: new Date() } }),
  ]);
  console.log("✅ Users seeded");

  // ─── Products ────────────────────────────────────────────────────
  // Prices in cents (EUR). costs = [CJ, FastShip, QualityFirst] per-unit cost incl. shipping split below.
  const productDefs = [
    // Electronics (5)
    { title: "Wireless Noise-Canceling Earbuds Pro", cat: electronics.id, price: 5499, compare: 7299, imgs: [demoImg("wireless-noise-canceling-earbuds-pro", 1), demoImg("wireless-noise-canceling-earbuds-pro", 2)], costs: [1180, 1640, 1990], desc: "Hybrid active noise cancellation cuts most cabin and street noise, with 28 hours of combined battery life across the case. IPX5-rated for sweat and light rain, with touch controls for calls and skipping tracks." },
    { title: "Smart LED Desk Lamp with USB Charging", cat: electronics.id, price: 3199, compare: null, imgs: [demoImg("smart-led-desk-lamp-with-usb-charging", 1), demoImg("smart-led-desk-lamp-with-usb-charging", 2)], costs: [790, 1100, 1330], desc: "Three color temperatures from warm 3000K to daylight 6500K, plus a stepless brightness dial and a 10W USB-C port built into the base for charging a phone while you work. Folds flat for a drawer or a bag." },
    { title: "Portable Bluetooth Speaker Waterproof", cat: electronics.id, price: 3999, compare: 5199, imgs: [demoImg("portable-bluetooth-speaker-waterproof", 1), demoImg("portable-bluetooth-speaker-waterproof", 2)], costs: [960, 1350, 1630], desc: "IPX7-rated, so it survives a splash by the pool or a drop in the sink — not just a light drizzle. Ten hours of playback, a paired-stereo mode for two speakers at once, and a carabiner clip built into the housing." },
    { title: "4K Action Camera with Accessories Kit", cat: electronics.id, price: 8299, compare: 10999, imgs: [demoImg("4k-action-camera-with-accessories-kit", 1), demoImg("4k-action-camera-with-accessories-kit", 2)], costs: [2430, 3400, 4120], desc: "Shoots 4K at 30fps or 1080p at 120fps for slow motion, waterproof to 30m in the included housing. Comes with a chest mount, a bike mount, and two extra batteries — the accessories most buyers end up ordering separately anyway." },
    { title: "Mechanical Keyboard RGB Backlit TKL", cat: electronics.id, price: 5999, compare: null, imgs: [demoImg("mechanical-keyboard-rgb-backlit-tkl", 1), demoImg("mechanical-keyboard-rgb-backlit-tkl", 2)], costs: [1750, 2450, 2970], desc: "Tenkeyless layout with hot-swappable switches, so you can go from clicky to linear without a soldering iron. Per-key RGB, a detachable USB-C cable, and doubleshot PBT keycaps that won't shine after a few months." },
    // Fashion (4)
    { title: "Minimalist Leather Crossbody Bag", cat: fashion.id, price: 4599, compare: 6399, imgs: [demoImg("minimalist-leather-crossbody-bag", 1), demoImg("minimalist-leather-crossbody-bag", 2)], costs: [1070, 1500, 1820], desc: "Full-grain leather that develops a patina instead of cracking, with a magnetic clasp and an adjustable strap that goes from cross-body to shoulder length. Fits a phone, a slim wallet, and keys — not a laptop, and we won't pretend otherwise." },
    { title: "Classic Oversized Hoodie Unisex", cat: fashion.id, price: 3049, compare: null, imgs: [demoImg("classic-oversized-hoodie-unisex", 1), demoImg("classic-oversized-hoodie-unisex", 2)], costs: [680, 950, 1150], desc: "Heavyweight 320gsm cotton-poly fleece with a brushed interior, cut long in the body and sleeve on purpose. Runs a size large — most people size down from their usual." },
    { title: "Premium Stainless Steel Watch Minimalist", cat: fashion.id, price: 9199, compare: 12899, imgs: [demoImg("premium-stainless-steel-watch-minimalist", 1), demoImg("premium-stainless-steel-watch-minimalist", 2)], costs: [2730, 3820, 4630], desc: "316L surgical-grade stainless case and band, with a sapphire-coated crystal that resists the scuffs a mineral-glass face picks up in month one. Japanese quartz movement, 5ATM water resistance — fine for handwashing and rain, not for diving." },
    { title: "Polarized Sunglasses UV400 Protection", cat: fashion.id, price: 2299, compare: null, imgs: [demoImg("polarized-sunglasses-uv400-protection", 1), demoImg("polarized-sunglasses-uv400-protection", 2)], costs: [540, 750, 910], desc: "Polarized lenses cut glare off water and pavement instead of just tinting it darker, with full UV400 coverage. Spring-loaded hinges so they don't loosen up after the first few weeks in a bag." },
    // Home & Living (4)
    { title: "Ceramic Pour-Over Coffee Set", cat: home.id, price: 3499, compare: 4599, imgs: [demoImg("ceramic-pour-over-coffee-set", 1), demoImg("ceramic-pour-over-coffee-set", 2)], costs: [820, 1150, 1390], desc: "A dripper, server and two cups glazed in one kiln run, so the finish actually matches. Slow-pour spout that doesn't dump water in one go — the usual complaint with the cheaper molds." },
    { title: "Linen Throw Blanket Extra Soft", cat: home.id, price: 2799, compare: null, imgs: [demoImg("linen-throw-blanket-extra-soft", 1), demoImg("linen-throw-blanket-extra-soft", 2)], costs: [610, 850, 1030], desc: "Stonewashed European linen that softens with every wash instead of pilling. 130×170cm — big enough for a couch, not so big it drags on the floor." },
    { title: "Bamboo Cutting Board Set of 3", cat: home.id, price: 2149, compare: 2799, imgs: [demoImg("bamboo-cutting-board-set-of-3", 1), demoImg("bamboo-cutting-board-set-of-3", 2)], costs: [470, 660, 800], desc: "Three sizes, end-grain bamboo that's gentler on knife edges than the usual flat-grain boards. Each one has a juice groove and a finger notch for pulling it off a drying rack." },
    { title: "Aromatherapy Diffuser 500ml Ultrasonic", cat: home.id, price: 2999, compare: null, imgs: [demoImg("aromatherapy-diffuser-500ml-ultrasonic", 1), demoImg("aromatherapy-diffuser-500ml-ultrasonic", 2)], costs: [700, 980, 1190], desc: "Runs up to 10 hours on the low mist setting, with a shutoff when the water runs out instead of scorching the plate. Seven-color light is optional — it works with the light off." },
    // Sports (3)
    { title: "Resistance Bands Set 5 Levels", cat: sports.id, price: 2599, compare: 3299, imgs: [demoImg("resistance-bands-set-5-levels", 1), demoImg("resistance-bands-set-5-levels", 2)], costs: [560, 780, 950], desc: "Five bands from 5 to 40kg of resistance, color-coded and labeled so you're not guessing which is which after the packaging's gone. Door anchor and ankle straps included." },
    { title: "Insulated Water Bottle 32oz Stainless", cat: sports.id, price: 2799, compare: null, imgs: [demoImg("insulated-water-bottle-32oz-stainless", 1), demoImg("insulated-water-bottle-32oz-stainless", 2)], costs: [600, 840, 1020], desc: "Double-wall vacuum insulation that keeps ice for about 24 hours — tested, not a marketing round number. Powder-coated finish that doesn't sweat onto a desk." },
    { title: "Yoga Mat Non-Slip Extra Thick 6mm", cat: sports.id, price: 3299, compare: 4099, imgs: [demoImg("yoga-mat-non-slip-extra-thick-6mm", 1), demoImg("yoga-mat-non-slip-extra-thick-6mm", 2)], costs: [710, 990, 1200], desc: "6mm of TPE cushioning that still lets you feel the floor for balance poses, with a textured surface that grips sweaty palms instead of sliding. Comes with its own strap, not a flimsy elastic band." },
    // Beauty (4)
    { title: "Facial Gua Sha Tool Rose Quartz", cat: beauty.id, price: 1899, compare: 2599, imgs: [demoImg("facial-gua-sha-tool-rose-quartz", 1), demoImg("facial-gua-sha-tool-rose-quartz", 2)], costs: [420, 590, 720], desc: "Genuine rose quartz, hand-polished so the edges glide instead of dragging. Comes with a two-minute routine card — most people stop using theirs because they don't know where to start." },
    { title: "LED Face Mask Light Therapy 7 Colors", cat: beauty.id, price: 5599, compare: 7499, imgs: [demoImg("led-face-mask-light-therapy-7-colors", 1), demoImg("led-face-mask-light-therapy-7-colors", 2)], costs: [1640, 2300, 2790], desc: "Seven light settings for different concerns, each with its own 10-minute timer so you're not squinting at a phone to track time. Silicone strap fits most face shapes without pinching." },
    { title: "Natural Bristle Hair Brush Detangling", cat: beauty.id, price: 1699, compare: null, imgs: [demoImg("natural-bristle-hair-brush-detangling", 1), demoImg("natural-bristle-hair-brush-detangling", 2)], costs: [370, 520, 630], desc: "Boar bristle mixed with nylon pins, which detangles without the static cling of pure synthetic brushes. Vented cushion base so it doesn't pull at the scalp on the first stroke." },
    { title: "Vitamin C Serum with Hyaluronic Acid", cat: beauty.id, price: 2349, compare: 3099, imgs: [demoImg("vitamin-c-serum-with-hyaluronic-acid", 1), demoImg("vitamin-c-serum-with-hyaluronic-acid", 2)], costs: [520, 730, 890], desc: "15% L-ascorbic acid in a dark glass bottle with an airless pump — the packaging that actually keeps vitamin C from oxidizing, not just clear glass with a dropper. Layers under sunscreen without balling up." },
  ];

  const products = await Promise.all(
    productDefs.map((p) =>
      db.product.upsert({
        where: { slug: slug(p.title) },
        update: {},
        create: {
          title: p.title,
          slug: slug(p.title),
          description: p.desc,
          images: p.imgs,
          categoryId: p.cat,
          sellingPrice: p.price,
          compareAtPrice: p.compare,
          isActive: true,
          markupType: MarkupType.MANUAL,
          autoPrice: false,
        },
      })
    )
  );
  console.log(`✅ ${products.length} products seeded`);

  // ─── ProductSuppliers ────────────────────────────────────
  // Every product gets a CJ (EU) listing, and most also get one manual EU
  // supplier — the everyday dropship path. A handful of higher-cost items
  // additionally carry an Alibaba or Made-in-China bulk quote (MOQ > 1,
  // longer lead time, quoted in USD) to demonstrate the B2B-sourcing flow.
  const B2B_INDICES = new Set([0, 4, 7, 9, 12, 15]); // earbuds, keyboard, watch, coffee set, bands, LED mask

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const def = productDefs[i];
    const [cjCost, fastCost, qualityCost] = def.costs;

    await db.productSupplier.upsert({
      where: { productId_supplierId: { productId: p.id, supplierId: cjEu.id } },
      update: {},
      create: {
        productId: p.id, supplierId: cjEu.id,
        supplierProductUrl: `https://cjdropshipping.com/product/${p.slug}.html`,
        supplierSku: `CJ${100000 + i}`, variantId: `vid-${p.id.slice(-8)}`,
        costPrice: cjCost, shippingCost: 349, totalCost: cjCost + 349,
        estimatedDeliveryDays: 5, warehouseCountry: "DE", inStock: true, stockQty: 340 + i * 17,
      },
    });

    await db.productSupplier.upsert({
      where: { productId_supplierId: { productId: p.id, supplierId: fastShip.id } },
      update: {},
      create: {
        productId: p.id, supplierId: fastShip.id,
        supplierProductUrl: `https://fastship.example.com/products/${p.slug}`,
        supplierSku: `FS-${p.id.slice(-6).toUpperCase()}`,
        costPrice: fastCost, shippingCost: 299, totalCost: fastCost + 299,
        estimatedDeliveryDays: 6, warehouseCountry: "NL", inStock: i % 9 !== 3, stockQty: 60 + i * 4,
      },
    });

    // Third listing alternates between the CY supplier (typical) and, for a
    // subset, a B2B bulk quote instead — never both, to keep it realistic.
    if (B2B_INDICES.has(i)) {
      const isAlibaba = i % 2 === 0;
      const supplier = isAlibaba ? alibabaSupplier : micSupplier;
      const usdCost = Math.round((qualityCost / 100) * 0.92 * 100) / 100; // rough EUR->USD on the quoted unit cost
      await db.productSupplier.upsert({
        where: { productId_supplierId: { productId: p.id, supplierId: supplier.id } },
        update: {},
        create: {
          productId: p.id, supplierId: supplier.id,
          supplierProductUrl: isAlibaba
            ? `https://yuexin-electronics.en.alibaba.com/product/${p.slug}.html`
            : `https://haoyu-houseware.en.made-in-china.com/product/${p.slug}.html`,
          supplierSku: isAlibaba ? `ALB-${p.id.slice(-6).toUpperCase()}` : `MIC-${p.id.slice(-6).toUpperCase()}`,
          costPrice: qualityCost - 60, shippingCost: 0, totalCost: qualityCost - 60,
          moq: isAlibaba ? 50 : 100,
          sourceCurrency: "USD", sourceCostPrice: usdCost,
          estimatedDeliveryDays: isAlibaba ? 21 : 25, warehouseCountry: "CN",
          inStock: true, stockQty: null, isLocked: false,
        },
      });
    } else {
      await db.productSupplier.upsert({
        where: { productId_supplierId: { productId: p.id, supplierId: qualityFirst.id } },
        update: {},
        create: {
          productId: p.id, supplierId: qualityFirst.id,
          supplierProductUrl: `https://qualityfirst.example.com/products/${p.slug}`,
          supplierSku: `QF-${p.id.slice(-6).toUpperCase()}`,
          costPrice: qualityCost, shippingCost: 399,
          totalCost: qualityCost + 399,
          estimatedDeliveryDays: 3, warehouseCountry: "CY", inStock: true, stockQty: 30 + i * 2,
        },
      });
    }
  }
  console.log("✅ Product suppliers seeded");

  // ─── Sample Orders ────────────────────────────────────────────────
  const addr = { firstName: "Elena", lastName: "Papadopoulou", street: "Faneromenis 12", city: "Nicosia", state: "Nicosia", country: "CY", postalCode: "1011", phone: "+35799123456" };

  const orderStatuses: OrderStatus[] = [OrderStatus.DELIVERED, OrderStatus.SHIPPED, OrderStatus.PROCESSING, OrderStatus.PENDING, OrderStatus.CANCELLED];

  for (let i = 0; i < 5; i++) {
    const prod = products[i * 3];
    const prodDef = productDefs[i * 3];
    const sellingPrice = prod.sellingPrice;
    const costPrice = prodDef.costs[0];

    const order = await db.order.create({
      data: {
        orderNumber: orderNum(),
        userId: customer.id,
        status: orderStatuses[i],
        subtotal: sellingPrice,
        shippingCost: 490,
        total: sellingPrice + 490,
        shippingAddress: addr,
        stripePaymentIntentId: `pi_test_${Math.random().toString(36).slice(2)}`,
        createdAt: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000),
      },
    });

    const orderItem = await db.orderItem.create({
      data: {
        orderId: order.id,
        productId: prod.id,
        quantity: 1,
        priceAtPurchase: sellingPrice,
        costAtPurchase: costPrice,
        selectedSupplierId: cjEu.id,
      },
    });

    if (orderStatuses[i] !== OrderStatus.CANCELLED && orderStatuses[i] !== OrderStatus.PENDING) {
      await db.supplierOrder.create({
        data: {
          orderItemId: orderItem.id,
          supplierId: cjEu.id,
          status: orderStatuses[i] === OrderStatus.DELIVERED ? SupplierOrderStatus.DELIVERED : orderStatuses[i] === OrderStatus.SHIPPED ? SupplierOrderStatus.SHIPPED : SupplierOrderStatus.ORDERED,
          supplierOrderRef: `CJ${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
          trackingNumber: `CJPKT${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
          orderedAt: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000 + 3600000),
        },
      });
    }
  }
  console.log("✅ Sample orders seeded");

  // ─── Reviews ──────────────────────────────────────────────────────
  const reviewers = ["Marios K.", "Sophia L.", "Andreas D.", "Katerina P.", "Yiannis M.", "Nadia R.", "Petros A.", "Chloe T.", "Georgios V.", "Maria S."];
  const reviewData = [
    { rating: 5, title: "Arrived in 4 days, no customs mess", comment: "Ordered from Cyprus, tracked the whole way from Germany. Actually matched the photos." },
    { rating: 4, title: "Good value", comment: "Does exactly what the listing says. Packaging was a bit basic but the product's solid." },
    { rating: 5, title: "Gift that landed well", comment: "Bought this for my sister's birthday, she's used it every day since. Would order again." },
    { rating: 3, title: "Fine, not amazing", comment: "Works as described. Nothing about it stands out either way." },
    { rating: 5, title: "Better build than I expected at this price", comment: "Was ready to be disappointed given the price. Genuinely wasn't." },
    { rating: 4, title: "Quick shipping", comment: "Tracking updated the same day it shipped. Product itself is decent." },
    { rating: 5, title: "Looks better in person", comment: "The photos undersell it a bit, if anything. Happy with this one." },
    { rating: 4, title: "A little pricier than similar items but worth it", comment: "Checked a few alternatives after ordering — glad I didn't go cheaper." },
    { rating: 5, title: "Second order from here", comment: "First one held up fine after two months so I ordered a second as a gift." },
    { rating: 3, title: "Average, does the job", comment: "Nothing wrong with it, just nothing special either. Delivery was on time." },
  ];

  for (let i = 0; i < 10; i++) {
    await db.review.create({
      data: {
        userId: customer.id,
        productId: products[i].id,
        rating: reviewData[i].rating,
        title: reviewData[i].title,
        comment: `${reviewData[i].comment} — ${reviewers[i]}`,
        isVerified: i < 5,
        createdAt: new Date(Date.now() - i * 3 * 24 * 60 * 60 * 1000),
      },
    });
  }
  console.log("✅ Reviews seeded");

  // ─── Addresses ────────────────────────────────────────────────────
  await db.address.create({
    data: {
      userId: customer.id,
      label: "Home",
      firstName: "Elena",
      lastName: "Papadopoulou",
      street: "Faneromenis 12",
      city: "Nicosia",
      state: "Nicosia",
      country: "CY",
      postalCode: "1011",
      phone: "+35799123456",
      isDefault: true,
    },
  });
  console.log("✅ Addresses seeded");

  console.log("\n✨ Database seeded successfully!");
  console.log("   Customer: test@example.com / password123");
  console.log("   Admin:    admin@example.com / admin123");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
