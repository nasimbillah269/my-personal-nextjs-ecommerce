import "server-only";
import { and, count, desc, eq, inArray, sql, sum } from "drizzle-orm";
import { db, schema } from "@/db";
import { getOrderView } from "./queries";

const { orders, orderItems } = schema;

export const ACCOUNT_PAGE_SIZE = 10;

const orderListFields = {
  id: orders.id,
  orderNo: orders.orderNo,
  status: orders.status,
  paymentMethod: orders.paymentMethod,
  paymentStatus: orders.paymentStatus,
  total: orders.total,
  createdAt: orders.createdAt,
  items: sql<number>`(SELECT COALESCE(SUM(${orderItems.qty}), 0) FROM ${orderItems} WHERE ${orderItems.orderId} = ${orders.id})`.mapWith(Number),
};

export async function getAccountOverview(customerId: number) {
  const mine = eq(orders.customerId, customerId);
  const [[stats], [open], recent] = await Promise.all([
    db
      .select({ orders: count(), spent: sum(sql`CASE WHEN ${orders.status} <> 'cancelled' THEN ${orders.total} END`).mapWith(Number) })
      .from(orders)
      .where(mine),
    db
      .select({ n: count() })
      .from(orders)
      .where(and(mine, inArray(orders.status, ["pending", "confirmed", "processing", "shipped"]))),
    db.select(orderListFields).from(orders).where(mine).orderBy(desc(orders.createdAt)).limit(5),
  ]);
  return { orders: stats?.orders ?? 0, spent: stats?.spent ?? 0, open: open?.n ?? 0, recent };
}

export async function listCustomerOrders(customerId: number, page: number, status?: string) {
  const where = and(
    eq(orders.customerId, customerId),
    status === "active"
      ? inArray(orders.status, ["pending", "confirmed", "processing", "shipped"])
      : status === "delivered"
        ? eq(orders.status, "delivered")
        : status === "cancelled"
          ? eq(orders.status, "cancelled")
          : undefined,
  );
  const [rows, [{ total }]] = await Promise.all([
    db
      .select(orderListFields)
      .from(orders)
      .where(where)
      .orderBy(desc(orders.createdAt))
      .limit(ACCOUNT_PAGE_SIZE)
      .offset((page - 1) * ACCOUNT_PAGE_SIZE),
    db.select({ total: count() }).from(orders).where(where),
  ]);
  return { rows, total };
}

/** An order's details, but only if it belongs to this customer. */
export async function getCustomerOrder(customerId: number, orderNo: string) {
  const [own] = await db
    .select({ id: orders.id })
    .from(orders)
    .where(and(eq(orders.orderNo, orderNo), eq(orders.customerId, customerId)))
    .limit(1);
  return own ? getOrderView(orderNo) : null;
}
