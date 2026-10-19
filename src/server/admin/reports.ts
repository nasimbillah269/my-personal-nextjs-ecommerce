import "server-only";
import { and, asc, count, desc, eq, gte, inArray, like, lt, ne, or, sql, sum, type SQL } from "drizzle-orm";
import { db, schema } from "@/db";
import { outer } from "@/db/sql";
import { orderStatusMeta, paymentMethods } from "@/lib/checkout";
import { ORDER_STATUSES, PAYMENT_METHODS } from "@/lib/constants";

const { orders, orderItems, products, categories } = schema;

/* ---------- Filters ---------- */

const DAY = 86_400_000;
const DHAKA_OFFSET = 6 * 3_600_000;
/** Most rows a report lists; the summary totals always cover the whole range. */
export const REPORT_ROW_LIMIT = 5000;

export type ReportFilters = {
  /** "YYYY-MM-DD", Dhaka dates, inclusive. */
  from: string;
  to: string;
  /** "" = every status except cancelled, "all" = everything, or one order status. */
  status: string;
  payment: string;
  group: "day" | "month";
  category: number | null;
  q: string;
};

const isDate = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));
const dhakaToday = () => new Date(Date.now() + DHAKA_OFFSET).toISOString().slice(0, 10);
const addDays = (d: string, n: number) => new Date(Date.parse(`${d}T00:00:00Z`) + n * DAY).toISOString().slice(0, 10);
/** Start of a Dhaka calendar day as a UTC instant. */
const dhakaStart = (d: string) => new Date(`${d}T00:00:00+06:00`);

export function parseReportFilters(sp: Record<string, string | string[] | undefined>): ReportFilters {
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string).trim() : "");
  let to = isDate(sp.to) ? (sp.to as string) : dhakaToday();
  let from = isDate(sp.from) ? (sp.from as string) : addDays(to, -29);
  if (from > to) [from, to] = [to, from];
  // Keep the range sane: at most ~5 years.
  if (Date.parse(to) - Date.parse(from) > 5 * 366 * DAY) from = addDays(to, -5 * 366);

  const status = str("status");
  const payment = str("payment");
  const category = Number(str("category"));
  return {
    from,
    to,
    status: status === "all" || (ORDER_STATUSES as readonly string[]).includes(status) ? status : "",
    payment: (PAYMENT_METHODS as readonly string[]).includes(payment) ? payment : "",
    group: str("group") === "month" ? "month" : "day",
    category: Number.isInteger(category) && category > 0 ? category : null,
    q: str("q").slice(0, 100),
  };
}

/** Query string for the same filters (used by the export link). */
export function filtersToQuery(f: ReportFilters) {
  const p = new URLSearchParams({ from: f.from, to: f.to });
  if (f.status) p.set("status", f.status);
  if (f.payment) p.set("payment", f.payment);
  if (f.group !== "day") p.set("group", f.group);
  if (f.category) p.set("category", String(f.category));
  if (f.q) p.set("q", f.q);
  return p.toString();
}

export const formatRange = (f: ReportFilters) => {
  const fmt = (s: string) => new Date(`${s}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  return f.from === f.to ? fmt(f.from) : `${fmt(f.from)} – ${fmt(f.to)}`;
};

export const statusFilterLabel = (s: string) => (!s ? "All except cancelled" : s === "all" ? "All statuses" : (orderStatusMeta[s]?.label ?? s));

/** Lines above each exported sheet: store, report name, range and active filters. */
export function reportTitleLines(title: string, f: ReportFilters, storeName: string, extra: (string | false | null | undefined)[] = []) {
  const filters = [
    `Period: ${formatRange(f)}`,
    `Status: ${statusFilterLabel(f.status)}`,
    f.payment && `Payment: ${paymentMethods.find((m) => m.id === f.payment)?.label}`,
    ...extra,
  ].filter(Boolean);
  return [`${storeName} — ${title}`, filters.join(" · ")];
}

function orderConds(f: ReportFilters): SQL[] {
  const conds: SQL[] = [gte(orders.createdAt, dhakaStart(f.from)), lt(orders.createdAt, dhakaStart(addDays(f.to, 1)))];
  if (!f.status) conds.push(ne(orders.status, "cancelled"));
  else if (f.status !== "all") conds.push(eq(orders.status, f.status as (typeof ORDER_STATUSES)[number]));
  if (f.payment) conds.push(eq(orders.paymentMethod, f.payment as (typeof PAYMENT_METHODS)[number]));
  return conds;
}

/** Order time shifted to Dhaka (the DB session runs in UTC). */
const dhakaTime = sql`DATE_ADD(${orders.createdAt}, INTERVAL 6 HOUR)`;

/** Every period key from `from` to `to`, so days/months without orders still show as zero. */
function periodKeys(f: ReportFilters) {
  const keys: string[] = [];
  if (f.group === "month") {
    for (let m = f.from.slice(0, 7); m <= f.to.slice(0, 7); ) {
      keys.push(m);
      const [y, mo] = m.split("-").map(Number);
      m = mo === 12 ? `${y + 1}-01` : `${y}-${String(mo + 1).padStart(2, "0")}`;
    }
  } else {
    for (let d = f.from; d <= f.to; d = addDays(d, 1)) keys.push(d);
  }
  return keys;
}

/* ---------- Sales ---------- */

export async function getSalesReport(f: ReportFilters) {
  const where = and(...orderConds(f));
  const period = f.group === "month" ? sql<string>`DATE_FORMAT(${dhakaTime}, '%Y-%m')` : sql<string>`DATE_FORMAT(${dhakaTime}, '%Y-%m-%d')`;
  const itemsPerOrder = sql<number>`(SELECT COALESCE(SUM(${orderItems.qty}), 0) FROM ${orderItems} WHERE ${orderItems.orderId} = ${outer(orders.id)})`;

  const [periodRows, byPayment, byStatus, orderRows] = await Promise.all([
    db
      .select({
        period,
        orders: count(),
        items: sql<number>`SUM(${itemsPerOrder})`.mapWith(Number),
        subtotal: sum(orders.subtotal).mapWith(Number),
        discount: sum(orders.discount).mapWith(Number),
        shipping: sum(orders.shipping).mapWith(Number),
        total: sum(orders.total).mapWith(Number),
      })
      .from(orders)
      .where(where)
      .groupBy(sql`1`),
    db
      .select({ method: orders.paymentMethod, orders: count(), total: sum(orders.total).mapWith(Number) })
      .from(orders)
      .where(where)
      .groupBy(orders.paymentMethod),
    db
      .select({ status: orders.status, orders: count(), total: sum(orders.total).mapWith(Number) })
      .from(orders)
      .where(where)
      .groupBy(orders.status),
    db
      .select({
        orderNo: orders.orderNo,
        createdAt: orders.createdAt,
        customerName: orders.customerName,
        phone: orders.phone,
        division: orders.division,
        status: orders.status,
        paymentMethod: orders.paymentMethod,
        paymentStatus: orders.paymentStatus,
        couponCode: orders.couponCode,
        items: sql<number>`${itemsPerOrder}`.mapWith(Number),
        subtotal: orders.subtotal,
        discount: orders.discount,
        shipping: orders.shipping,
        total: orders.total,
      })
      .from(orders)
      .where(where)
      .orderBy(desc(orders.createdAt))
      .limit(REPORT_ROW_LIMIT),
  ]);

  const empty = { orders: 0, items: 0, subtotal: 0, discount: 0, shipping: 0, total: 0 };
  const byKey = new Map(periodRows.map((r) => [r.period, r]));
  const rows = periodKeys(f).map((period) => {
    const r = byKey.get(period);
    return { period, ...empty, ...(r && { orders: r.orders, items: r.items ?? 0, subtotal: r.subtotal ?? 0, discount: r.discount ?? 0, shipping: r.shipping ?? 0, total: r.total ?? 0 }) };
  });
  const totals = rows.reduce(
    (t, r) => ({
      orders: t.orders + r.orders,
      items: t.items + r.items,
      subtotal: t.subtotal + r.subtotal,
      discount: t.discount + r.discount,
      shipping: t.shipping + r.shipping,
      total: t.total + r.total,
    }),
    empty,
  );

  return {
    rows,
    totals: { ...totals, aov: totals.orders ? Math.round(totals.total / totals.orders) : 0 },
    byPayment: byPayment.map((r) => ({ ...r, total: r.total ?? 0 })).sort((a, b) => b.total - a.total),
    byStatus: byStatus.map((r) => ({ ...r, total: r.total ?? 0 })).sort((a, b) => ORDER_STATUSES.indexOf(a.status) - ORDER_STATUSES.indexOf(b.status)),
    orders: orderRows,
    truncated: totals.orders > orderRows.length,
  };
}

/* ---------- Products ---------- */

export async function getProductReport(f: ReportFilters) {
  const conds = orderConds(f);
  if (f.category) conds.push(eq(products.categoryId, f.category));
  if (f.q) conds.push(or(like(orderItems.productName, `%${f.q}%`), like(orderItems.productSlug, `%${f.q}%`))!);
  const where = and(...conds);
  const revenue = sql<number>`SUM(${orderItems.price} * ${orderItems.qty})`.mapWith(Number);

  const [productRows, variantRows] = await Promise.all([
    db
      .select({
        slug: orderItems.productSlug,
        name: orderItems.productName,
        productId: sql<number | null>`MAX(${orderItems.productId})`,
        qty: sum(orderItems.qty).mapWith(Number),
        orders: sql<number>`COUNT(DISTINCT ${orderItems.orderId})`.mapWith(Number),
        revenue,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orders.id, orderItems.orderId))
      .leftJoin(products, eq(products.id, orderItems.productId))
      .where(where)
      .groupBy(orderItems.productSlug, orderItems.productName)
      .orderBy(desc(revenue))
      .limit(REPORT_ROW_LIMIT),
    db
      .select({
        name: orderItems.productName,
        variant: orderItems.variant,
        qty: sum(orderItems.qty).mapWith(Number),
        revenue,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orders.id, orderItems.orderId))
      .leftJoin(products, eq(products.id, orderItems.productId))
      .where(where)
      .groupBy(orderItems.productName, orderItems.variant)
      .orderBy(asc(orderItems.productName), desc(sum(orderItems.qty)))
      .limit(REPORT_ROW_LIMIT),
  ]);

  // Current stock and category, for products that still exist.
  const ids = [...new Set(productRows.map((r) => Number(r.productId)).filter((id) => id > 0))];
  const live = ids.length
    ? await db
        .select({ id: products.id, stock: products.stock, isActive: products.isActive, category: categories.name })
        .from(products)
        .innerJoin(categories, eq(categories.id, products.categoryId))
        .where(inArray(products.id, ids))
    : [];
  const liveById = new Map(live.map((p) => [p.id, p]));

  const rows = productRows.map((r) => {
    const p = r.productId ? liveById.get(Number(r.productId)) : undefined;
    const qty = r.qty ?? 0;
    const rev = r.revenue ?? 0;
    return {
      name: r.name,
      slug: r.slug,
      category: p?.category ?? null,
      qty,
      orders: r.orders,
      revenue: rev,
      avgPrice: qty ? Math.round(rev / qty) : 0,
      stock: p ? p.stock : null,
      deleted: !p,
    };
  });
  const totals = rows.reduce((t, r) => ({ qty: t.qty + r.qty, revenue: t.revenue + r.revenue }), { qty: 0, revenue: 0 });

  return { rows, variants: variantRows.map((v) => ({ ...v, qty: v.qty ?? 0, revenue: v.revenue ?? 0 })), totals };
}

export async function listReportCategories() {
  return db.select({ id: categories.id, name: categories.name }).from(categories).orderBy(asc(categories.sortOrder), asc(categories.name));
}

/* ---------- Customers (grouped by phone, like Admin → Customers) ---------- */

export async function getCustomerReport(f: ReportFilters) {
  const conds = orderConds(f);
  if (f.q) conds.push(or(like(orders.customerName, `%${f.q}%`), like(orders.phone, `%${f.q}%`), like(orders.email, `%${f.q}%`))!);
  const where = and(...conds);
  const spent = sum(orders.total).mapWith(Number);
  const SEP = "\u001f";
  // Latest value of a column for the phone (names/emails can change between orders).
  const latest = (col: typeof orders.customerName | typeof orders.email | typeof orders.division) =>
    sql<string>`SUBSTRING_INDEX(GROUP_CONCAT(${col} ORDER BY ${orders.createdAt} DESC SEPARATOR ${SEP}), ${SEP}, 1)`;

  const rows = await db
    .select({
      phone: orders.phone,
      name: latest(orders.customerName),
      email: latest(orders.email),
      division: latest(orders.division),
      orders: count(),
      spent,
      items: sql<number>`SUM((SELECT COALESCE(SUM(${orderItems.qty}), 0) FROM ${orderItems} WHERE ${orderItems.orderId} = ${outer(orders.id)}))`.mapWith(Number),
      firstOrder: sql<string>`MIN(${orders.createdAt})`,
      lastOrder: sql<string>`MAX(${orders.createdAt})`,
      registered: sql<number>`MAX(${orders.customerId} IS NOT NULL)`.mapWith((v) => Number(v) === 1),
      // New = their first order ever falls inside the range.
      firstEver: sql<string>`(SELECT MIN(o2.created_at) FROM orders o2 WHERE o2.phone = ${outer(orders.phone)})`,
    })
    .from(orders)
    .where(where)
    .groupBy(orders.phone)
    .orderBy(desc(spent))
    .limit(REPORT_ROW_LIMIT);

  const toDate = (v: unknown) => (v instanceof Date ? v : new Date(`${String(v).replace(" ", "T")}Z`));
  const start = dhakaStart(f.from);
  const out = rows.map((r) => {
    const s = r.spent ?? 0;
    return {
      ...r,
      spent: s,
      items: r.items ?? 0,
      aov: r.orders ? Math.round(s / r.orders) : 0,
      firstOrder: toDate(r.firstOrder),
      lastOrder: toDate(r.lastOrder),
      isNew: toDate(r.firstEver) >= start,
    };
  });
  const totals = out.reduce(
    (t, r) => ({
      customers: t.customers + 1,
      orders: t.orders + r.orders,
      spent: t.spent + r.spent,
      newCustomers: t.newCustomers + (r.isNew ? 1 : 0),
      registered: t.registered + (r.registered ? 1 : 0),
    }),
    { customers: 0, orders: 0, spent: 0, newCustomers: 0, registered: 0 },
  );
  return { rows: out, totals };
}
