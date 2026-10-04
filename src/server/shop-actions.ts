"use server";

import { randomInt } from "node:crypto";
import { and, eq, gte, inArray, isNull, lt, or, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { z } from "zod";
import { db, schema } from "@/db";
import { PAYMENT_METHODS } from "@/lib/constants";
import { computeTotals, divisions, isValidBdPhone, normalizePhone } from "@/lib/checkout";
import { LAST_ORDER_COOKIE } from "./constants";
import { findValidCoupon, type CouponCheck } from "./coupons";
import { getSettings } from "./queries";


export async function checkCoupon(code: string, subtotal: number): Promise<CouponCheck> {
  if (typeof code !== "string" || code.length > 40 || !Number.isFinite(subtotal)) {
    return { ok: false, error: "This coupon code is not valid." };
  }
  return findValidCoupon(code, Math.max(0, Math.round(subtotal)));
}

const orderInput = z
  .object({
    lines: z
      .array(
        z.object({
          key: z.string().max(240),
          slug: z.string().min(1).max(160),
          variant: z.string().min(1).max(60),
          qty: z.number().int().min(1).max(99),
          price: z.number().int().min(0),
        }),
      )
      .min(1)
      .max(50),
    couponCode: z.string().max(40).nullable(),
    name: z.string().trim().min(3).max(120),
    phone: z.string().refine(isValidBdPhone),
    email: z.union([z.literal(""), z.email().max(191)]),
    division: z.enum(divisions as [string, ...string[]]),
    area: z.string().trim().min(2).max(120),
    address: z.string().trim().min(10).max(500),
    note: z.string().trim().max(500),
    delivery: z.enum(["inside", "outside"]),
    payment: z.enum(PAYMENT_METHODS),
    trxId: z.string().trim().max(40),
  })
  .refine((o) => (o.payment === "bkash" || o.payment === "nagad" ? /^[A-Za-z0-9]{8,12}$/.test(o.trxId) : true), {
    path: ["trxId"],
  });

export type PlaceOrderInput = z.input<typeof orderInput>;

export type PlaceOrderResult =
  | { ok: true; orderNo: string }
  | {
      ok: false;
      error: string;
      /** Cart lines whose price changed since they were added. */
      priceUpdates?: { key: string; price: number }[];
      /** Cart lines that can no longer be bought. */
      removeKeys?: string[];
      couponInvalid?: boolean;
    };

class StockError extends Error {}

export async function placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  const parsed = orderInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check your details and try again." };
  const o = parsed.data;

  // Load current products + variants for everything in the cart.
  const slugs = [...new Set(o.lines.map((l) => l.slug))];
  const productRows = await db
    .select()
    .from(schema.products)
    .where(and(inArray(schema.products.slug, slugs), eq(schema.products.isActive, true)));
  const bySlug = new Map(productRows.map((p) => [p.slug, p]));
  const variantRows = productRows.length
    ? await db.select().from(schema.productVariants).where(inArray(schema.productVariants.productId, productRows.map((p) => p.id)))
    : [];

  const removeKeys: string[] = [];
  const priceUpdates: { key: string; price: number }[] = [];
  const lines = o.lines.flatMap((l) => {
    const product = bySlug.get(l.slug);
    const variant = product && variantRows.find((v) => v.productId === product.id && v.label === l.variant);
    if (!product || !variant) {
      removeKeys.push(l.key);
      return [];
    }
    if (variant.price !== l.price) priceUpdates.push({ key: l.key, price: variant.price });
    return [{ ...l, product, price: variant.price }];
  });

  if (removeKeys.length) {
    return { ok: false, error: "Some items in your cart are no longer available and were removed.", removeKeys };
  }
  if (priceUpdates.length) {
    return { ok: false, error: "Some prices have changed. Please review your updated total.", priceUpdates };
  }

  const qtyByProduct = new Map<number, number>();
  for (const l of lines) qtyByProduct.set(l.product.id, (qtyByProduct.get(l.product.id) ?? 0) + l.qty);
  for (const [id, qty] of qtyByProduct) {
    const p = productRows.find((x) => x.id === id)!;
    if (p.stock < qty) {
      return { ok: false, error: p.stock > 0 ? `Only ${p.stock} left of “${p.name}”.` : `“${p.name}” is out of stock.` };
    }
  }

  const subtotal = lines.reduce((sum, l) => sum + l.price * l.qty, 0);
  let coupon = null;
  if (o.couponCode) {
    const check = await findValidCoupon(o.couponCode, subtotal);
    if (!check.ok) return { ok: false, error: check.error, couponInvalid: true };
    coupon = check.coupon;
  }

  const settings = await getSettings();
  const totals = computeTotals(subtotal, coupon, settings, o.delivery);
  const isMobilePay = o.payment === "bkash" || o.payment === "nagad";

  let orderNo = "";
  try {
    await db.transaction(async (tx) => {
      for (let attempt = 0; ; attempt++) {
        orderNo = `UOL-${randomInt(10_000_000, 99_999_999)}`;
        const [exists] = await tx.select({ id: schema.orders.id }).from(schema.orders).where(eq(schema.orders.orderNo, orderNo)).limit(1);
        if (!exists) break;
        if (attempt > 4) throw new Error("Could not allocate an order number");
      }

      const [{ id: orderId }] = await tx
        .insert(schema.orders)
        .values({
          orderNo,
          paymentMethod: o.payment,
          paymentStatus: isMobilePay ? "pending" : "unpaid",
          trxId: isMobilePay ? o.trxId.toUpperCase() : null,
          customerName: o.name,
          phone: normalizePhone(o.phone),
          email: o.email,
          division: o.division,
          area: o.area,
          address: o.address,
          note: o.note,
          delivery: o.delivery,
          subtotal: totals.subtotal,
          discount: totals.discount,
          shipping: totals.shipping ?? 0,
          total: totals.total,
          couponCode: totals.couponActive ? coupon!.code : null,
        })
        .$returningId();

      await tx.insert(schema.orderItems).values(
        lines.map((l) => ({
          orderId,
          productId: l.product.id,
          productName: l.product.name,
          productSlug: l.product.slug,
          variant: l.variant,
          price: l.price,
          qty: l.qty,
          emoji: l.product.emoji,
          tint: l.product.tint,
          image: l.product.image,
        })),
      );

      for (const [id, qty] of qtyByProduct) {
        const [res] = await tx
          .update(schema.products)
          .set({ stock: sql`${schema.products.stock} - ${qty}` })
          .where(and(eq(schema.products.id, id), gte(schema.products.stock, qty)));
        if (res.affectedRows !== 1) throw new StockError();
      }

      if (totals.couponActive && coupon) {
        const c = schema.coupons;
        const [res] = await tx
          .update(c)
          .set({ usedCount: sql`${c.usedCount} + 1` })
          .where(and(eq(c.code, coupon.code), or(isNull(c.usageLimit), lt(c.usedCount, c.usageLimit))));
        if (res.affectedRows !== 1) throw new Error("Coupon usage limit reached");
      }
    });
  } catch (err) {
    if (err instanceof StockError) return { ok: false, error: "Sorry, an item just went out of stock. Please review your cart." };
    console.error("placeOrder failed", err);
    return { ok: false, error: "We couldn’t place your order right now. Please try again." };
  }

  (await cookies()).set(LAST_ORDER_COOKIE, orderNo, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
  return { ok: true, orderNo };
}
