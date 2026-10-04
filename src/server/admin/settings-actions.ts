"use server";

import bcrypt from "bcryptjs";
import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/db";
import { requireAdmin } from "../auth";
import { getSettings } from "../queries";
import { deleteImage, FAVICON_TYPES, saveImage, validateImage } from "../uploads";
import { firstErrors, type FormState } from "./form-state";

const fee = z.coerce.number().int().min(0, "Can’t be negative").max(100000);

const settingsSchema = z.object({
  storeName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(5, "Enter a phone number").max(30),
  email: z.email("Enter a valid email").max(191),
  address: z.string().trim().min(3).max(300),
  insideDhakaFee: fee,
  outsideDhakaFee: fee,
  freeShippingMin: fee,
  mobilePaymentNumber: z.string().trim().min(5, "Enter the bKash/Nagad number").max(30),
});

export async function saveSettings(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = settingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Please fix the highlighted fields.", errors: firstErrors(parsed.error) };

  await db.transaction(async (tx) => {
    for (const [key, value] of Object.entries(parsed.data)) {
      await tx
        .insert(schema.settings)
        .values({ key, value: String(value) })
        .onDuplicateKeyUpdate({ set: { value: String(value) } });
    }
  });
  revalidatePath("/", "layout");
  return { ok: true, message: "Settings saved." };
}

/* ---------- Branding: logo + favicon ---------- */

const uploaded = (v: FormDataEntryValue | null) => (v instanceof File && v.size > 0 ? v : null);

export async function saveBranding(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const logo = uploaded(formData.get("logo"));
  const favicon = uploaded(formData.get("favicon"));

  const errors: Record<string, string> = {};
  const logoError = logo && validateImage(logo, { maxBytes: 2 * 1024 * 1024 });
  if (logoError) errors.logo = logoError;
  const faviconError =
    favicon && validateImage(favicon, { types: FAVICON_TYPES, maxBytes: 512 * 1024, typesLabel: "PNG, ICO, JPG or WEBP" });
  if (faviconError) errors.favicon = faviconError;
  if (Object.keys(errors).length) return { ok: false, message: "Please fix the highlighted fields.", errors };

  const current = await getSettings();
  const next = {
    logoUrl: logo ? await saveImage(logo, "branding") : formData.get("removeLogo") === "on" ? null : current.logoUrl,
    faviconUrl: favicon ? await saveImage(favicon, "branding") : formData.get("removeFavicon") === "on" ? null : current.faviconUrl,
  };

  for (const [key, value] of Object.entries(next)) {
    await db
      .insert(schema.settings)
      .values({ key, value: value ?? "" })
      .onDuplicateKeyUpdate({ set: { value: value ?? "" } });
  }

  // Remove files that are no longer used.
  if (current.logoUrl !== next.logoUrl) await deleteImage(current.logoUrl);
  if (current.faviconUrl !== next.faviconUrl) await deleteImage(current.faviconUrl);

  revalidatePath("/", "layout");
  return { ok: true, message: "Branding updated." };
}

const profileSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(120),
  email: z.email("Enter a valid email").max(191).transform((e) => e.toLowerCase()),
});

export async function saveProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Please fix the highlighted fields.", errors: firstErrors(parsed.error) };

  const [clash] = await db
    .select({ id: schema.admins.id })
    .from(schema.admins)
    .where(and(eq(schema.admins.email, parsed.data.email), ne(schema.admins.id, admin.id)))
    .limit(1);
  if (clash) return { ok: false, message: "Please fix the highlighted fields.", errors: { email: "Another admin uses this email." } };

  await db.update(schema.admins).set(parsed.data).where(eq(schema.admins.id, admin.id));
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Profile updated." };
}

const passwordSchema = z
  .object({
    current: z.string().min(1, "Enter your current password"),
    next: z.string().min(8, "Use at least 8 characters").max(200),
    confirm: z.string(),
  })
  .refine((p) => p.next === p.confirm, { path: ["confirm"], message: "Passwords don’t match" });

export async function changePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const parsed = passwordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Please fix the highlighted fields.", errors: firstErrors(parsed.error) };

  const [row] = await db.select({ hash: schema.admins.passwordHash }).from(schema.admins).where(eq(schema.admins.id, admin.id)).limit(1);
  if (!row || !(await bcrypt.compare(parsed.data.current, row.hash))) {
    return { ok: false, message: "Please fix the highlighted fields.", errors: { current: "Current password is incorrect." } };
  }
  await db.update(schema.admins).set({ passwordHash: await bcrypt.hash(parsed.data.next, 12) }).where(eq(schema.admins.id, admin.id));
  return { ok: true, message: "Password changed." };
}
