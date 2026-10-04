"use server";

import { eq, isNotNull, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, schema } from "@/db";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "@/lib/constants";
import { requireAdmin } from "../auth";
import { firstErrors, type FormState } from "./form-state";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Put stock back (direction 1) or take it out again (direction -1) for every item in an order. */
async function adjustStock(tx: Tx, orderId: number, direction: 1 | -1) {
  const items = await tx
    .select({ productId: schema.orderItems.productId, qty: schema.orderItems.qty })
    .from(schema.orderItems)
    .where(and(eq(schema.orderItems.orderId, orderId), isNotNull(schema.orderItems.productId)));
  for (const item of items) {
    await tx
      .update(schema.products)
      .set({ stock: sql`GREATEST(0, ${schema.products.stock} + ${direction * item.qty})` })
      .where(eq(schema.products.id, item.productId!));
  }
}

const updateSchema = z.object({
  id: z.coerce.number().int().positive(),
  status: z.enum(ORDER_STATUSES),
  paymentStatus: z.enum(PAYMENT_STATUSES),
  adminNote: z.string().trim().max(1000),
});

export async function updateOrder(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = updateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Invalid update.", errors: firstErrors(parsed.error) };
  const { id, ...changes } = parsed.data;

  const [order] = await db.select({ status: schema.orders.status }).from(schema.orders).where(eq(schema.orders.id, id)).limit(1);
  if (!order) return { ok: false, message: "Order not found." };

  await db.transaction(async (tx) => {
    // Cancelling returns items to stock; un-cancelling takes them out again.
    if (order.status !== "cancelled" && changes.status === "cancelled") await adjustStock(tx, id, 1);
    if (order.status === "cancelled" && changes.status !== "cancelled") await adjustStock(tx, id, -1);
    await tx.update(schema.orders).set(changes).where(eq(schema.orders.id, id));
  });

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  return { ok: true, message: "Order updated." };
}

export async function deleteOrder(id: number) {
  await requireAdmin();
  await db.transaction(async (tx) => {
    const [order] = await tx.select({ status: schema.orders.status }).from(schema.orders).where(eq(schema.orders.id, id)).limit(1);
    if (!order) return;
    // Stock for undelivered, uncancelled orders is still reserved — release it.
    if (order.status !== "cancelled" && order.status !== "delivered") await adjustStock(tx, id, 1);
    await tx.delete(schema.orders).where(eq(schema.orders.id, id));
  });
  revalidatePath("/admin/orders");
  redirect("/admin/orders");
}
