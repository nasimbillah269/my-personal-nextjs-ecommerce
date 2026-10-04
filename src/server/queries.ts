import "server-only";
import { and, asc, eq, inArray, type SQL } from "drizzle-orm";
import { cache } from "react";
import { db, schema } from "@/db";
import { DEFAULT_SETTINGS } from "@/lib/checkout";
import { parseDescription } from "@/lib/description";
import type { Category, OrderView, Product, ProductDetails, StoreSettings } from "@/lib/types";

const { categories, products, productVariants, settings, orders, orderItems } = schema;

type ProductRow = typeof products.$inferSelect;
type VariantRow = typeof productVariants.$inferSelect;

/* ---------- Settings ---------- */

export const getSettings = cache(async (): Promise<StoreSettings> => {
  const rows = await db.select().from(settings);
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const str = (k: keyof StoreSettings) => map.get(k) ?? (DEFAULT_SETTINGS[k] as string);
  const num = (k: keyof StoreSettings) => {
    const n = Number(map.get(k));
    return map.has(k) && Number.isFinite(n) ? n : (DEFAULT_SETTINGS[k] as number);
  };
  return {
    storeName: str("storeName"),
    phone: str("phone"),
    email: str("email"),
    address: str("address"),
    insideDhakaFee: num("insideDhakaFee"),
    outsideDhakaFee: num("outsideDhakaFee"),
    freeShippingMin: num("freeShippingMin"),
    mobilePaymentNumber: str("mobilePaymentNumber"),
    logoUrl: map.get("logoUrl") || null,
    faviconUrl: map.get("faviconUrl") || null,
  };
});

/* ---------- Catalog ---------- */

export const getCategories = cache(
  async (): Promise<Category[]> =>
    db
      .select({ id: categories.id, slug: categories.slug, name: categories.name, icon: categories.icon })
      .from(categories)
      .orderBy(asc(categories.sortOrder), asc(categories.name)),
);

function toProduct(p: ProductRow, categorySlug: string, v: VariantRow): Product {
  return {
    id: p.slug,
    dbId: p.id,
    name: p.name,
    variant: v.label,
    price: v.price,
    oldPrice: v.oldPrice ?? undefined,
    category: categorySlug,
    image: p.image ?? undefined,
    emoji: p.emoji,
    tint: p.tint,
    stock: p.stock,
  };
}

async function variantsFor(productIds: number[]) {
  if (productIds.length === 0) return new Map<number, VariantRow[]>();
  const rows = await db
    .select()
    .from(productVariants)
    .where(inArray(productVariants.productId, productIds))
    .orderBy(asc(productVariants.sortOrder), asc(productVariants.id));
  const map = new Map<number, VariantRow[]>();
  for (const v of rows) map.set(v.productId, [...(map.get(v.productId) ?? []), v]);
  return map;
}

async function loadProducts(where?: SQL): Promise<Product[]> {
  const rows = await db
    .select({ p: products, categorySlug: categories.slug })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(where ? and(eq(products.isActive, true), where) : eq(products.isActive, true))
    .orderBy(asc(products.sortOrder), asc(products.id));
  const variants = await variantsFor(rows.map((r) => r.p.id));
  return rows.flatMap(({ p, categorySlug }) => {
    const first = variants.get(p.id)?.[0];
    return first ? [toProduct(p, categorySlug, first)] : [];
  });
}

export const getActiveProducts = cache(() => loadProducts());
export const getPopularProducts = cache(() => loadProducts(eq(products.isPopular, true)));
export const getDailyBestProducts = cache(() => loadProducts(eq(products.isDailyBest, true)));

export const getProductPage = cache(async (slug: string) => {
  const [row] = await db
    .select({ p: products, categorySlug: categories.slug, categoryName: categories.name })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(and(eq(products.slug, slug), eq(products.isActive, true)))
    .limit(1);
  if (!row) return null;

  const variants = (await variantsFor([row.p.id])).get(row.p.id) ?? [];
  if (variants.length === 0) return null;

  const details: ProductDetails = {
    summary: row.p.summary,
    variants: variants.map((v) => ({ label: v.label, price: v.price, oldPrice: v.oldPrice ?? undefined })),
    stock: row.p.stock,
    tags: row.p.tags.split(",").map((t) => t.trim()).filter(Boolean),
    brand: row.p.brand,
    origin: row.p.origin,
    description: parseDescription(row.p.description),
    imageCredit: row.p.image && row.p.imageCredit ? { text: row.p.imageCredit, url: row.p.imageCreditUrl } : null,
  };
  return {
    product: toProduct(row.p, row.categorySlug, variants[0]),
    details,
    categoryName: row.categoryName,
  };
});

export async function getRelatedProducts(product: Product, limit = 12) {
  const all = await getActiveProducts();
  return all
    .filter((p) => p.id !== product.id)
    .sort((a, b) => Number(b.category === product.category) - Number(a.category === product.category))
    .slice(0, limit);
}

/* ---------- Orders ---------- */

export async function getOrderView(orderNo: string): Promise<OrderView | null> {
  const [o] = await db.select().from(orders).where(eq(orders.orderNo, orderNo)).limit(1);
  if (!o) return null;
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, o.id)).orderBy(asc(orderItems.id));
  return {
    orderNo: o.orderNo,
    createdAt: o.createdAt.toISOString(),
    status: o.status,
    paymentMethod: o.paymentMethod,
    paymentStatus: o.paymentStatus,
    trxId: o.trxId,
    delivery: o.delivery,
    customer: {
      name: o.customerName,
      phone: o.phone,
      email: o.email,
      division: o.division,
      area: o.area,
      address: o.address,
      note: o.note,
    },
    totals: { subtotal: o.subtotal, discount: o.discount, shipping: o.shipping, total: o.total, coupon: o.couponCode },
    items: items.map((i) => ({
      name: i.productName,
      slug: i.productSlug,
      variant: i.variant,
      price: i.price,
      qty: i.qty,
      emoji: i.emoji,
      tint: i.tint,
      image: i.image,
    })),
  };
}
