import "server-only";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { normalizeCoupon } from "@/lib/checkout";
import type { AppliedCoupon } from "@/lib/types";
import { formatPrice } from "@/lib/ui";

export type CouponCheck = { ok: true; coupon: AppliedCoupon } | { ok: false; error: string };

export async function findValidCoupon(rawCode: string, subtotal: number): Promise<CouponCheck> {
  const code = normalizeCoupon(rawCode);
  if (!code) return { ok: false, error: "Enter a coupon code." };

  const [c] = await db.select().from(schema.coupons).where(eq(schema.coupons.code, code)).limit(1);
  if (!c || !c.isActive) return { ok: false, error: "This coupon code is not valid." };
  if (c.expiresAt && c.expiresAt.getTime() < Date.now()) return { ok: false, error: "This coupon has expired." };
  if (c.usageLimit !== null && c.usedCount >= c.usageLimit) return { ok: false, error: "This coupon has reached its usage limit." };
  if (subtotal < c.minOrder) return { ok: false, error: `Add ${formatPrice(c.minOrder - subtotal)} more to use this coupon.` };

  return { ok: true, coupon: { code: c.code, type: c.type, value: c.value, minOrder: c.minOrder } };
}
