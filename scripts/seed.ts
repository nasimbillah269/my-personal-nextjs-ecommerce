/**
 * Seeds the database with the starter catalog, coupons, settings, an admin user and (optionally) demo orders.
 *
 *   npm run db:seed                 # only works on an empty database
 *   npm run db:seed -- --reset      # wipes catalog + orders first (admins are kept)
 *   npm run db:seed -- --no-demo    # skip the demo orders
 */
import { config } from "dotenv";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { count } from "drizzle-orm";
import { drizzle, type MySql2Database } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "../src/db/schema";
import { computeTotals, DEFAULT_SETTINGS } from "../src/lib/checkout";
import { serializeDescription } from "../src/lib/description";
import { categories, dailyBestSells, getProductDetails, popularProducts, products } from "./seed-data";
import { attachSeedImages } from "./seed-images";

config({ path: ".env.local" });

const args = new Set(process.argv.slice(2));

async function main() {
  const conn = await mysql.createConnection({ uri: process.env.DATABASE_URL!, charset: "utf8mb4", timezone: "Z" });
  await conn.query("SET time_zone = '+00:00'");
  const db = drizzle(conn, { schema, mode: "default" });

  const [{ n: existing }] = await db.select({ n: count() }).from(schema.categories);
  if (existing > 0 && !args.has("--reset")) {
    console.error("Database already has data. Run `npm run db:seed -- --reset` to wipe and reseed (admins are kept).");
    process.exit(1);
  }

  if (args.has("--reset")) {
    for (const table of [
      schema.orderItems,
      schema.orders,
      schema.productVariants,
      schema.products,
      schema.categories,
      schema.coupons,
      schema.settings,
    ]) {
      await db.delete(table);
    }
    console.log("✓ Cleared existing data");
  }

  // Categories
  const categoryIds = new Map<string, number>();
  for (const [i, c] of categories.entries()) {
    const [{ id }] = await db.insert(schema.categories).values({ slug: c.slug, name: c.name, icon: c.icon, sortOrder: i }).$returningId();
    categoryIds.set(c.slug, id);
  }
  console.log(`✓ ${categories.length} categories`);

  // Products + variants
  const popular = new Set(popularProducts.map((p) => p.id));
  const daily = new Set(dailyBestSells.map((p) => p.id));
  const productRows: { id: number; slug: string; name: string; emoji: string; tint: string; variant: string; price: number; image: string | null }[] = [];

  for (const [i, p] of products.entries()) {
    const d = getProductDetails(p);
    const [{ id }] = await db
      .insert(schema.products)
      .values({
        slug: p.id,
        name: p.name,
        categoryId: categoryIds.get(p.category)!,
        summary: d.summary,
        description: serializeDescription(d.description),
        stock: d.stock,
        image: p.image ?? null,
        emoji: p.emoji,
        tint: p.tint,
        tags: d.tags.join(", "),
        brand: d.brand,
        origin: d.origin,
        isPopular: popular.has(p.id),
        isDailyBest: daily.has(p.id),
        sortOrder: i,
      })
      .$returningId();
    await db.insert(schema.productVariants).values(
      d.variants.map((v, sortOrder) => ({ productId: id, label: v.label, price: v.price, oldPrice: v.oldPrice ?? null, sortOrder })),
    );
    productRows.push({ id, slug: p.id, name: p.name, emoji: p.emoji, tint: p.tint, variant: d.variants[0].label, price: d.variants[0].price, image: null });
  }
  console.log(`✓ ${products.length} products`);

  const withPhotos = await attachSeedImages(db);
  const images = new Map(
    (await db.select({ slug: schema.products.slug, image: schema.products.image }).from(schema.products)).map((r) => [r.slug, r.image]),
  );
  for (const row of productRows) row.image = images.get(row.slug) ?? null;
  console.log(`✓ ${withPhotos} product photos`);

  // Coupons
  await db.insert(schema.coupons).values([
    { code: "ORGANIC10", type: "percent", value: 10, minOrder: 0 },
    { code: "SAVE200", type: "flat", value: 200, minOrder: 2000 },
  ]);
  console.log("✓ 2 coupons (ORGANIC10, SAVE200)");

  // Settings
  await db.insert(schema.settings).values(Object.entries(DEFAULT_SETTINGS).map(([key, value]) => ({ key, value: value === null ? "" : String(value) })));
  console.log("✓ Store settings");

  // Admin
  const [{ n: adminCount }] = await db.select({ n: count() }).from(schema.admins);
  if (adminCount === 0) {
    const email = process.env.ADMIN_EMAIL ?? "admin@ultimateorganiclife.com";
    const password = process.env.ADMIN_PASSWORD ?? randomBytes(9).toString("base64url");
    await db.insert(schema.admins).values({ name: "Store Admin", email, passwordHash: await bcrypt.hash(password, 12) });
    console.log("\n  ┌──────────────── Admin login ────────────────");
    console.log(`  │ URL:      http://localhost:3000/admin`);
    console.log(`  │ Email:    ${email}`);
    console.log(`  │ Password: ${password}`);
    console.log("  └── Change it in Admin → Settings after logging in.\n");
  }

  if (!args.has("--no-demo")) {
    const created = await seedDemoOrders(db, productRows);
    console.log(`✓ ${created} demo orders (last 60 days)`);
  }

  await conn.end();
  console.log("Done.");
}

/* ---------- Demo orders so the dashboard has something to show ---------- */

function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

async function seedDemoOrders(
  db: MySql2Database<typeof schema>,
  catalog: { id: number; slug: string; name: string; emoji: string; tint: string; variant: string; price: number; image: string | null }[],
) {
  const rand = rng(42);
  const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)];
  const names = ["Rahim Uddin", "Karim Hasan", "Nusrat Jahan", "Farhana Akter", "Tanvir Ahmed", "Sadia Islam", "Mehedi Hasan", "Ayesha Siddika", "Rafiq Chowdhury", "Shirin Sultana", "Imran Hossain", "Jannatul Ferdous", "Arif Rahman", "Mitu Begum", "Sabbir Khan"];
  const areas: [string, string][] = [["Dhaka", "Dhanmondi"], ["Dhaka", "Mirpur"], ["Dhaka", "Uttara"], ["Dhaka", "Gulshan"], ["Chattogram", "Agrabad"], ["Sylhet", "Zindabazar"], ["Rajshahi", "Shaheb Bazar"], ["Khulna", "Sonadanga"]];
  const phones = names.map((_, i) => `017${String(10000000 + i * 7654321).slice(0, 8)}`);
  const s = DEFAULT_SETTINGS;
  const total = 70;

  for (let i = 0; i < total; i++) {
    const daysAgo = Math.floor(rand() * 60);
    const createdAt = new Date(Date.now() - daysAgo * 86400000 - Math.floor(rand() * 86400000));
    const who = Math.floor(rand() * names.length);
    const [division, area] = pick(areas);
    const delivery = division === "Dhaka" ? "inside" : "outside";
    const payment = pick(["cod", "cod", "cod", "bkash", "nagad", "card"] as const);

    const lines = Array.from({ length: 1 + Math.floor(rand() * 3) }, () => ({ product: pick(catalog), qty: 1 + Math.floor(rand() * 2) }));
    const subtotal = lines.reduce((sum, l) => sum + l.product.price * l.qty, 0);
    const coupon = rand() < 0.2 ? { code: "ORGANIC10", type: "percent" as const, value: 10, minOrder: 0 } : null;
    const totals = computeTotals(subtotal, coupon, s, delivery);

    const status =
      daysAgo > 10
        ? pick(["delivered", "delivered", "delivered", "delivered", "cancelled"] as const)
        : daysAgo > 3
          ? pick(["shipped", "delivered", "processing", "confirmed"] as const)
          : pick(["pending", "pending", "confirmed", "processing"] as const);
    const paymentStatus =
      status === "cancelled" ? (payment === "cod" ? "unpaid" : "refunded") : payment === "cod" ? (status === "delivered" ? "paid" : "unpaid") : status === "pending" ? "pending" : "paid";

    const [{ id: orderId }] = await db
      .insert(schema.orders)
      .values({
        orderNo: `UOL-${String(100001 + i)}`,
        status,
        paymentMethod: payment,
        paymentStatus,
        trxId: payment === "bkash" || payment === "nagad" ? randomBytes(5).toString("hex").toUpperCase() : null,
        customerName: names[who],
        phone: phones[who],
        division,
        area,
        address: `House ${1 + Math.floor(rand() * 90)}, Road ${1 + Math.floor(rand() * 20)}`,
        delivery,
        subtotal: totals.subtotal,
        discount: totals.discount,
        shipping: totals.shipping ?? 0,
        total: totals.total,
        couponCode: coupon?.code ?? null,
        createdAt,
        updatedAt: createdAt,
      })
      .$returningId();

    await db.insert(schema.orderItems).values(
      lines.map((l) => ({
        orderId,
        productId: l.product.id,
        productName: l.product.name,
        productSlug: l.product.slug,
        variant: l.product.variant,
        price: l.product.price,
        qty: l.qty,
        emoji: l.product.emoji,
        tint: l.product.tint,
        image: l.product.image,
      })),
    );
  }
  return total;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
