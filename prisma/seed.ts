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

async function main() {
  console.log("🌱 Seeding database...");

  // ─── Store Settings ──────────────────────────────────────────────
  await db.storeSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      storeName: "DropShip",
      contactEmail: "support@dropship.com",
      currency: "USD",
      globalMarkupType: MarkupType.MULTIPLIER,
      globalMarkupValue: 2.5,
      freeShippingThreshold: 5000,
      flatShippingRate: 499,
    },
  });

  // ─── Categories ──────────────────────────────────────────────────
  const categories = await Promise.all([
    db.category.upsert({ where: { slug: "electronics" }, update: {}, create: { name: "Electronics", slug: "electronics", image: "https://picsum.photos/seed/electronics/600/400" } }),
    db.category.upsert({ where: { slug: "fashion-apparel" }, update: {}, create: { name: "Fashion & Apparel", slug: "fashion-apparel", image: "https://picsum.photos/seed/fashion/600/400" } }),
    db.category.upsert({ where: { slug: "home-living" }, update: {}, create: { name: "Home & Living", slug: "home-living", image: "https://picsum.photos/seed/home/600/400" } }),
    db.category.upsert({ where: { slug: "sports-outdoors" }, update: {}, create: { name: "Sports & Outdoors", slug: "sports-outdoors", image: "https://picsum.photos/seed/sports/600/400" } }),
    db.category.upsert({ where: { slug: "beauty-health" }, update: {}, create: { name: "Beauty & Health", slug: "beauty-health", image: "https://picsum.photos/seed/beauty/600/400" } }),
  ]);
  const [electronics, fashion, home, sports, beauty] = categories;
  console.log("✅ Categories seeded");

  // ─── Suppliers ───────────────────────────────────────────────────
  const [aliDirect, fastShip, qualityFirst] = await Promise.all([
    db.supplier.upsert({ where: { id: "supplier-ali" }, update: {}, create: { id: "supplier-ali", name: "AliDirect", website: "https://alidirect.example.com", apiType: SupplierApiType.MANUAL, rating: 3.5, avgShippingDays: 20 } }),
    db.supplier.upsert({ where: { id: "supplier-fast" }, update: {}, create: { id: "supplier-fast", name: "FastShip Co", website: "https://fastship.example.com", apiType: SupplierApiType.MANUAL, rating: 4.5, avgShippingDays: 6 } }),
    db.supplier.upsert({ where: { id: "supplier-quality" }, update: {}, create: { id: "supplier-quality", name: "QualityFirst", website: "https://qualityfirst.example.com", apiType: SupplierApiType.MANUAL, rating: 4.8, avgShippingDays: 9 } }),
  ]);
  console.log("✅ Suppliers seeded");

  // ─── Users ───────────────────────────────────────────────────────
  const customerPassword = await bcrypt.hash("password123", 10);
  const adminPassword = await bcrypt.hash("admin123", 10);

  const [customer, admin] = await Promise.all([
    db.user.upsert({ where: { email: "test@example.com" }, update: {}, create: { email: "test@example.com", name: "Test Customer", hashedPassword: customerPassword, role: "CUSTOMER", emailVerified: new Date() } }),
    db.user.upsert({ where: { email: "admin@example.com" }, update: {}, create: { email: "admin@example.com", name: "Admin User", hashedPassword: adminPassword, role: "ADMIN", emailVerified: new Date() } }),
  ]);
  console.log("✅ Users seeded");

  // ─── Products ────────────────────────────────────────────────────
  const productDefs = [
    // Electronics (5)
    { title: "Wireless Noise-Canceling Earbuds Pro", cat: electronics.id, price: 5999, compare: 7999, imgs: ["https://picsum.photos/seed/earbuds/600/600", "https://picsum.photos/seed/earbuds2/600/600"], costs: [1200, 1680, 2040] },
    { title: "Smart LED Desk Lamp with USB Charging", cat: electronics.id, price: 3499, compare: null, imgs: ["https://picsum.photos/seed/lamp/600/600"], costs: [800, 1120, 1360] },
    { title: "Portable Bluetooth Speaker Waterproof", cat: electronics.id, price: 4299, compare: 5499, imgs: ["https://picsum.photos/seed/speaker/600/600", "https://picsum.photos/seed/speaker2/600/600"], costs: [990, 1390, 1680] },
    { title: "4K Action Camera with Accessories Kit", cat: electronics.id, price: 8999, compare: 11999, imgs: ["https://picsum.photos/seed/camera/600/600"], costs: [2500, 3500, 4250] },
    { title: "Mechanical Keyboard RGB Backlit TKL", cat: electronics.id, price: 6499, compare: null, imgs: ["https://picsum.photos/seed/keyboard/600/600", "https://picsum.photos/seed/keyboard2/600/600"], costs: [1800, 2520, 3060] },
    // Fashion (4)
    { title: "Minimalist Leather Crossbody Bag", cat: fashion.id, price: 4999, compare: 6999, imgs: ["https://picsum.photos/seed/bag/600/600", "https://picsum.photos/seed/bag2/600/600"], costs: [1100, 1540, 1870] },
    { title: "Classic Oversized Hoodie Unisex", cat: fashion.id, price: 3299, compare: null, imgs: ["https://picsum.photos/seed/hoodie/600/600"], costs: [700, 980, 1190] },
    { title: "Premium Stainless Steel Watch Minimalist", cat: fashion.id, price: 9999, compare: 13999, imgs: ["https://picsum.photos/seed/watch/600/600", "https://picsum.photos/seed/watch2/600/600"], costs: [2800, 3920, 4760] },
    { title: "Polarized Sunglasses UV400 Protection", cat: fashion.id, price: 2499, compare: null, imgs: ["https://picsum.photos/seed/sunglasses/600/600"], costs: [550, 770, 935] },
    // Home & Living (4)
    { title: "Ceramic Pour-Over Coffee Set", cat: home.id, price: 3799, compare: 4999, imgs: ["https://picsum.photos/seed/coffee/600/600", "https://picsum.photos/seed/coffee2/600/600"], costs: [900, 1260, 1530] },
    { title: "Linen Throw Blanket Extra Soft", cat: home.id, price: 2999, compare: null, imgs: ["https://picsum.photos/seed/blanket/600/600"], costs: [650, 910, 1105] },
    { title: "Bamboo Cutting Board Set of 3", cat: home.id, price: 2299, compare: 2999, imgs: ["https://picsum.photos/seed/cuttingboard/600/600"], costs: [500, 700, 850] },
    { title: "Aromatherapy Diffuser 500ml Ultrasonic", cat: home.id, price: 3199, compare: null, imgs: ["https://picsum.photos/seed/diffuser/600/600", "https://picsum.photos/seed/diffuser2/600/600"], costs: [720, 1008, 1224] },
    // Sports (4)
    { title: "Resistance Bands Set 5 Levels", cat: sports.id, price: 2799, compare: 3499, imgs: ["https://picsum.photos/seed/bands/600/600"], costs: [600, 840, 1020] },
    { title: "Insulated Water Bottle 32oz Stainless", cat: sports.id, price: 2999, compare: null, imgs: ["https://picsum.photos/seed/bottle/600/600", "https://picsum.photos/seed/bottle2/600/600"], costs: [650, 910, 1105] },
    { title: "Yoga Mat Non-Slip Extra Thick 6mm", cat: sports.id, price: 3499, compare: 4299, imgs: ["https://picsum.photos/seed/yogamat/600/600"], costs: [800, 1120, 1360] },
    // Beauty (3)
    { title: "Facial Gua Sha Tool Rose Quartz", cat: beauty.id, price: 1999, compare: 2799, imgs: ["https://picsum.photos/seed/guasha/600/600"], costs: [400, 560, 680] },
    { title: "LED Face Mask Light Therapy 7 Colors", cat: beauty.id, price: 5999, compare: 7999, imgs: ["https://picsum.photos/seed/facemask/600/600", "https://picsum.photos/seed/facemask2/600/600"], costs: [1500, 2100, 2550] },
    { title: "Natural Bristle Hair Brush Detangling", cat: beauty.id, price: 1799, compare: null, imgs: ["https://picsum.photos/seed/hairbrush/600/600"], costs: [380, 532, 646] },
    { title: "Vitamin C Serum with Hyaluronic Acid", cat: beauty.id, price: 2499, compare: 3299, imgs: ["https://picsum.photos/seed/serum/600/600"], costs: [550, 770, 935] },
  ];

  const products = await Promise.all(
    productDefs.map((p) =>
      db.product.upsert({
        where: { slug: slug(p.title) },
        update: {},
        create: {
          title: p.title,
          slug: slug(p.title),
          description: `High-quality ${p.title.toLowerCase()}. Perfect for everyday use. This product is carefully sourced from top manufacturers to ensure durability, performance, and customer satisfaction. Fast shipping available.`,
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

  // ─── ProductSuppliers ─────────────────────────────────────────────
  const supplierIds = [aliDirect.id, fastShip.id, qualityFirst.id];
  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const costs = productDefs[i].costs;
    const shippings = [499, 299, 399];
    for (let s = 0; s < 3; s++) {
      const cost = costs[s];
      const ship = shippings[s];
      await db.productSupplier.upsert({
        where: { productId_supplierId: { productId: p.id, supplierId: supplierIds[s] } },
        update: {},
        create: {
          productId: p.id,
          supplierId: supplierIds[s],
          supplierProductUrl: `https://example.com/products/${p.slug}-${s}`,
          supplierSku: `SKU-${p.id.slice(-6).toUpperCase()}-${s}`,
          costPrice: cost,
          shippingCost: ship,
          totalCost: cost + ship,
          estimatedDeliveryDays: [20, 6, 9][s],
          inStock: true,
        },
      });
    }
  }
  console.log("✅ Product suppliers seeded");

  // ─── Sample Orders ────────────────────────────────────────────────
  const addr = { firstName: "Jane", lastName: "Smith", street: "123 Main St", city: "Austin", state: "TX", country: "US", postalCode: "78701", phone: "+15125551234" };

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
        shippingCost: 499,
        total: sellingPrice + 499,
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
        selectedSupplierId: aliDirect.id,
      },
    });

    if (orderStatuses[i] !== OrderStatus.CANCELLED && orderStatuses[i] !== OrderStatus.PENDING) {
      await db.supplierOrder.create({
        data: {
          orderItemId: orderItem.id,
          supplierId: aliDirect.id,
          status: orderStatuses[i] === OrderStatus.DELIVERED ? SupplierOrderStatus.DELIVERED : orderStatuses[i] === OrderStatus.SHIPPED ? SupplierOrderStatus.SHIPPED : SupplierOrderStatus.ORDERED,
          supplierOrderRef: `ALI-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
          trackingNumber: `TRK${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
          orderedAt: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000 + 3600000),
        },
      });
    }
  }
  console.log("✅ Sample orders seeded");

  // ─── Reviews ──────────────────────────────────────────────────────
  const reviewData = [
    { rating: 5, title: "Absolutely love it!", comment: "Exceeded my expectations. Fast shipping and great quality." },
    { rating: 4, title: "Great value for money", comment: "Really happy with this purchase. Works exactly as described." },
    { rating: 5, title: "Perfect gift", comment: "Bought this as a gift and it was a huge hit. Will order again!" },
    { rating: 3, title: "Decent product", comment: "Does the job but nothing special. Arrived on time." },
    { rating: 5, title: "Top quality!", comment: "Amazing build quality. You can tell it's well made." },
    { rating: 4, title: "Very satisfied", comment: "Delivered quickly and well packaged. Product is solid." },
    { rating: 5, title: "Better than expected", comment: "The photos don't do it justice. Looks even better in person!" },
    { rating: 4, title: "Good but pricey", comment: "Quality is there but a bit expensive. Still happy with it." },
    { rating: 5, title: "Highly recommend", comment: "Bought twice already. Never disappoints." },
    { rating: 3, title: "It's okay", comment: "Average product. Nothing extraordinary but does what it says." },
  ];

  for (let i = 0; i < 10; i++) {
    await db.review.create({
      data: {
        userId: customer.id,
        productId: products[i].id,
        rating: reviewData[i].rating,
        title: reviewData[i].title,
        comment: reviewData[i].comment,
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
      firstName: "Jane",
      lastName: "Smith",
      street: "123 Main St",
      city: "Austin",
      state: "TX",
      country: "US",
      postalCode: "78701",
      phone: "+15125551234",
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
