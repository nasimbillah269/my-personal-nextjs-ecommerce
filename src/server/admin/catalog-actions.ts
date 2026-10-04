"use server";

import { and, count, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/db";
import { COUPON_TYPES } from "@/lib/constants";
import { categoryIcons } from "@/lib/category-icons";
import { normalizeCoupon } from "@/lib/checkout";
import { requireAdmin } from "../auth";
import { firstErrors, type FormState } from "./form-state";

/* ---------- Categories ---------- */

const categorySchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(120),
  slug: z
    .string()
    .trim()
    .min(2, "Slug is required")
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes only"),
  icon: z.string().refine((v) => v in categoryIcons, "Pick an icon"),
  sortOrder: z.coerce.number().int().min(0).max(10000),
});

export async function saveCategory(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const id = Number(formData.get("id")) || null;
  const parsed = categorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Please fix the highlighted fields.", errors: firstErrors(parsed.error) };

  const c = schema.categories;
  const [clash] = await db
    .select({ id: c.id })
    .from(c)
    .where(id ? and(eq(c.slug, parsed.data.slug), ne(c.id, id)) : eq(c.slug, parsed.data.slug))
    .limit(1);
  if (clash) return { ok: false, message: "Please fix the highlighted fields.", errors: { slug: "This slug is already used." } };

  if (id) await db.update(c).set(parsed.data).where(eq(c.id, id));
  else await db.insert(c).values(parsed.data);

  revalidatePath("/admin/categories");
  return { ok: true, message: id ? "Category updated." : "Category created." };
}

export async function deleteCategory(id: number): Promise<FormState> {
  await requireAdmin();
  const [{ n }] = await db.select({ n: count() }).from(schema.products).where(eq(schema.products.categoryId, id));
  if (n > 0) return { ok: false, message: `Move or delete its ${n} product${n === 1 ? "" : "s"} first.` };
  await db.delete(schema.categories).where(eq(schema.categories.id, id));
  revalidatePath("/admin/categories");
  return { ok: true, message: "Category deleted." };
}

/* ---------- Coupons ---------- */

const optionalInt = z.preprocess((v) => (v === "" || v === null ? null : v), z.coerce.number().int().min(1).nullable());

const couponSchema = z
  .object({
    code: z
      .string()
      .transform(normalizeCoupon)
      .pipe(z.string().min(3, "Code must be 3+ characters").max(40).regex(/^[A-Z0-9_-]+$/, "Letters, numbers, - and _ only")),
    type: z.enum(COUPON_TYPES),
    value: z.coerce.number().int().min(1, "Enter a discount"),
    minOrder: z.coerce.number().int().min(0),
    usageLimit: optionalInt,
    expiresAt: z.preprocess((v) => (v ? new Date(`${v}T23:59:59Z`) : null), z.date().nullable()),
    isActive: z.boolean(),
  })
  .refine((c) => c.type !== "percent" || c.value <= 100, { path: ["value"], message: "Percent can’t be over 100" });

export async function saveCoupon(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const id = Number(formData.get("id")) || null;
  const parsed = couponSchema.safeParse({ ...Object.fromEntries(formData), isActive: formData.get("isActive") === "on" });
  if (!parsed.success) return { ok: false, message: "Please fix the highlighted fields.", errors: firstErrors(parsed.error) };

  const c = schema.coupons;
  const [clash] = await db
    .select({ id: c.id })
    .from(c)
    .where(id ? and(eq(c.code, parsed.data.code), ne(c.id, id)) : eq(c.code, parsed.data.code))
    .limit(1);
  if (clash) return { ok: false, message: "Please fix the highlighted fields.", errors: { code: "This code already exists." } };

  if (id) await db.update(c).set(parsed.data).where(eq(c.id, id));
  else await db.insert(c).values(parsed.data);

  revalidatePath("/admin/coupons");
  return { ok: true, message: id ? "Coupon updated." : "Coupon created." };
}

export async function deleteCoupon(id: number): Promise<FormState> {
  await requireAdmin();
  await db.delete(schema.coupons).where(eq(schema.coupons.id, id));
  revalidatePath("/admin/coupons");
  return { ok: true, message: "Coupon deleted." };
}

export async function setCouponActive(id: number, isActive: boolean): Promise<FormState> {
  await requireAdmin();
  await db.update(schema.coupons).set({ isActive }).where(eq(schema.coupons.id, id));
  revalidatePath("/admin/coupons");
  return { ok: true, message: isActive ? "Coupon activated." : "Coupon paused." };
}
