import "server-only";
import { and, asc, count, desc, eq, gte, inArray, like, lt, lte, ne, or, sql, sum, type SQL } from "drizzle-orm";
import { db, schema } from "@/db";
import { ORDER_STATUSES } from "@/lib/constants";

const { orders, orderItems, products, productVariants, categories, coupons } = schema;

export const PAGE_SIZE = 15;

/** Raw SQL datetimes come back as "YYYY-MM-DD HH:MM:SS" strings in UTC (session time_zone is +00:00). */
const toUtcDate = (v: unknown) => (v instanceof Date ? v : new Date(`${String(v).replace(" ", "T")}Z`));

const DAY = 86_400_000;
const notCancelled = ne(orders.status, "cancelled");

/* ---------- Dashboard ---------- */

async function periodStats(from: Date, to: Date) {
  const [row] = await db
    .select({
      revenue: sum(orders.total).mapWith(Number),
      orders: count(),
      customers: sql<number>`COUNT(DISTINCT ${orders.phone})`.mapWith(Number),
    })
    .from(orders)
    .where(and(notCancelled, gte(orders.createdAt, from), lt(orders.createdAt, to)));
  const revenue = row?.revenue ?? 0;
  const n = row?.orders ?? 0;
  return { revenue, orders: n, customers: row?.customers ?? 0, aov: n ? Math.round(revenue / n) : 0 };
}

export async function getDashboardData() {
  const now = new Date();
  const start = new Date(now.getTime() - 30 * DAY);
  const prevStart = new Date(now.getTime() - 60 * DAY);

  // Daily buckets start at UTC midnight 29 days ago so the chart has exactly 30 columns.
  const seriesStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - 29 * DAY);

  const [current, previous, daily, statusRows, recent, top, lowStock, pending] = await Promise.all([
    periodStats(start, now),
    periodStats(prevStart, start),
    db
      .select({
        day: sql<string>`DATE_FORMAT(${orders.createdAt}, '%Y-%m-%d')`,
        revenue: sum(orders.total).mapWith(Number),
        orders: count(),
      })
      .from(orders)
      .where(and(notCancelled, gte(orders.createdAt, seriesStart)))
      .groupBy(sql`1`),
    db.select({ status: orders.status, n: count() }).from(orders).groupBy(orders.status),
    db
      .select({
        id: orders.id,
        orderNo: orders.orderNo,
        customerName: orders.customerName,
        total: orders.total,
        status: orders.status,
        paymentMethod: orders.paymentMethod,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(7),
    db
      .select({
        name: orderItems.productName,
        slug: orderItems.productSlug,
        emoji: sql<string>`MAX(${orderItems.emoji})`,
        tint: sql<string>`MAX(${orderItems.tint})`,
        qty: sum(orderItems.qty).mapWith(Number),
        revenue: sql<number>`SUM(${orderItems.price} * ${orderItems.qty})`.mapWith(Number),
      })
      .from(orderItems)
      .innerJoin(orders, eq(orders.id, orderItems.orderId))
      .where(and(notCancelled, gte(orders.createdAt, start)))
      .groupBy(orderItems.productSlug, orderItems.productName)
      .orderBy(desc(sum(orderItems.qty)))
      .limit(5),
    db
      .select({ id: products.id, name: products.name, stock: products.stock, emoji: products.emoji, tint: products.tint })
      .from(products)
      .where(and(eq(products.isActive, true), lte(products.stock, 10)))
      .orderBy(asc(products.stock))
      .limit(6),
    db.select({ n: count() }).from(orders).where(eq(orders.status, "pending")),
  ]);

  const byDay = new Map(daily.map((d) => [d.day, d]));
  const series = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(seriesStart.getTime() + i * DAY);
    const key = date.toISOString().slice(0, 10);
    return { date: key, revenue: byDay.get(key)?.revenue ?? 0, orders: byDay.get(key)?.orders ?? 0 };
  });

  const statusCounts = Object.fromEntries(ORDER_STATUSES.map((s) => [s, 0])) as Record<(typeof ORDER_STATUSES)[number], number>;
  for (const r of statusRows) statusCounts[r.status] = r.n;

  return { current, previous, series, statusCounts, recent, top, lowStock, pendingCount: pending[0]?.n ?? 0 };
}

export async function getPendingOrderCount() {
  const [row] = await db.select({ n: count() }).from(orders).where(eq(orders.status, "pending"));
  return row?.n ?? 0;
}

/* ---------- Orders ---------- */

export type OrderFilters = { q?: string; status?: string; payment?: string; page: number };

export async function listOrders(f: OrderFilters) {
  const conds: SQL[] = [];
  if (f.q) {
    const term = `%${f.q}%`;
    conds.push(or(like(orders.orderNo, term), like(orders.customerName, term), like(orders.phone, term))!);
  }
  if (f.payment && ["cod", "bkash", "nagad", "card"].includes(f.payment)) {
    conds.push(eq(orders.paymentMethod, f.payment as (typeof orders.paymentMethod.enumValues)[number]));
  }
  const base = conds.length ? and(...conds) : undefined;
  const statusCond =
    f.status && (ORDER_STATUSES as readonly string[]).includes(f.status)
      ? eq(orders.status, f.status as (typeof ORDER_STATUSES)[number])
      : undefined;
  const where = base && statusCond ? and(base, statusCond) : (base ?? statusCond);

  const [rows, [{ total }], statusRows] = await Promise.all([
    db
      .select({
        id: orders.id,
        orderNo: orders.orderNo,
        customerName: orders.customerName,
        phone: orders.phone,
        division: orders.division,
        total: orders.total,
        status: orders.status,
        paymentMethod: orders.paymentMethod,
        paymentStatus: orders.paymentStatus,
        createdAt: orders.createdAt,
        items: sql<number>`(SELECT COALESCE(SUM(${orderItems.qty}), 0) FROM ${orderItems} WHERE ${orderItems.orderId} = ${orders.id})`.mapWith(Number),
      })
      .from(orders)
      .where(where)
      .orderBy(desc(orders.createdAt))
      .limit(PAGE_SIZE)
      .offset((f.page - 1) * PAGE_SIZE),
    db.select({ total: count() }).from(orders).where(where),
    db.select({ status: orders.status, n: count() }).from(orders).where(base).groupBy(orders.status),
  ]);

  const statusCounts: Record<string, number> = { all: 0 };
  for (const r of statusRows) {
    statusCounts[r.status] = r.n;
    statusCounts.all += r.n;
  }
  return { rows, total, statusCounts };
}

export async function getOrderDetail(id: number) {
  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!order) return null;
  const [items, [history]] = await Promise.all([
    db.select().from(orderItems).where(eq(orderItems.orderId, id)).orderBy(asc(orderItems.id)),
    db
      .select({ n: count(), spent: sum(orders.total).mapWith(Number) })
      .from(orders)
      .where(and(eq(orders.phone, order.phone), notCancelled)),
  ]);
  return { order, items, customerOrders: history?.n ?? 0, customerSpent: history?.spent ?? 0 };
}

/* ---------- Products ---------- */

export type ProductFilters = { q?: string; category?: string; status?: string; page: number };

export async function listProducts(f: ProductFilters) {
  const conds: SQL[] = [];
  if (f.q) conds.push(or(like(products.name, `%${f.q}%`), like(products.slug, `%${f.q}%`))!);
  if (f.category) conds.push(eq(categories.slug, f.category));
  if (f.status === "active") conds.push(eq(products.isActive, true));
  if (f.status === "hidden") conds.push(eq(products.isActive, false));
  if (f.status === "low") conds.push(lte(products.stock, 10));
  const where = conds.length ? and(...conds) : undefined;

  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        id: products.id,
        slug: products.slug,
        name: products.name,
        image: products.image,
        emoji: products.emoji,
        tint: products.tint,
        stock: products.stock,
        isActive: products.isActive,
        isPopular: products.isPopular,
        isDailyBest: products.isDailyBest,
        categoryName: categories.name,
        updatedAt: products.updatedAt,
      })
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .where(where)
      .orderBy(asc(products.sortOrder), desc(products.id))
      .limit(PAGE_SIZE)
      .offset((f.page - 1) * PAGE_SIZE),
    db.select({ total: count() }).from(products).innerJoin(categories, eq(products.categoryId, categories.id)).where(where),
  ]);

  const variants = rows.length
    ? await db
        .select()
        .from(productVariants)
        .where(inArray(productVariants.productId, rows.map((r) => r.id)))
        .orderBy(asc(productVariants.sortOrder), asc(productVariants.id))
    : [];

  return {
    total,
    rows: rows.map((r) => {
      const vs = variants.filter((v) => v.productId === r.id);
      return { ...r, price: vs[0]?.price ?? 0, oldPrice: vs[0]?.oldPrice ?? null, variantCount: vs.length };
    }),
  };
}

export async function getProductForEdit(id: number) {
  const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!product) return null;
  const variants = await db
    .select()
    .from(productVariants)
    .where(eq(productVariants.productId, id))
    .orderBy(asc(productVariants.sortOrder), asc(productVariants.id));
  return { product, variants };
}

/* ---------- Categories & coupons ---------- */

export async function listCategoriesWithCounts() {
  return db
    .select({
      id: categories.id,
      slug: categories.slug,
      name: categories.name,
      icon: categories.icon,
      sortOrder: categories.sortOrder,
      productCount: sql<number>`(SELECT COUNT(*) FROM ${products} WHERE ${products.categoryId} = ${categories.id})`.mapWith(Number),
    })
    .from(categories)
    .orderBy(asc(categories.sortOrder), asc(categories.name));
}

export async function listCoupons() {
  return db.select().from(coupons).orderBy(desc(coupons.createdAt));
}

/* ---------- Customers (derived from orders, grouped by phone) ---------- */

export async function listCustomers(f: { q?: string; page: number }) {
  const where = f.q ? or(like(orders.customerName, `%${f.q}%`), like(orders.phone, `%${f.q}%`)) : undefined;

  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        phone: orders.phone,
        name: sql<string>`SUBSTRING_INDEX(GROUP_CONCAT(${orders.customerName} ORDER BY ${orders.createdAt} DESC SEPARATOR '\n'), '\n', 1)`,
        email: sql<string>`MAX(${orders.email})`,
        location: sql<string>`SUBSTRING_INDEX(GROUP_CONCAT(CONCAT(${orders.area}, ', ', ${orders.division}) ORDER BY ${orders.createdAt} DESC SEPARATOR '\n'), '\n', 1)`,
        orders: count(),
        spent: sql<number>`COALESCE(SUM(CASE WHEN ${orders.status} <> 'cancelled' THEN ${orders.total} END), 0)`.mapWith(Number),
        lastOrder: sql<Date>`MAX(${orders.createdAt})`.mapWith(toUtcDate),
      })
      .from(orders)
      .where(where)
      .groupBy(orders.phone)
      .orderBy(desc(sql`MAX(${orders.createdAt})`))
      .limit(PAGE_SIZE)
      .offset((f.page - 1) * PAGE_SIZE),
    db.select({ total: sql<number>`COUNT(DISTINCT ${orders.phone})`.mapWith(Number) }).from(orders).where(where),
  ]);
  return { rows, total };
}
