"use server";

import bcrypt from "bcryptjs";
import { and, eq, inArray, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/db";
import {
  LEGACY_SOCIAL_KEYS,
  MAX_SOCIAL_LINKS,
  SOCIAL_LINKS_KEY,
  SOCIAL_NETWORK_KEYS,
  SOCIAL_PROVIDERS,
  socialNetworkLabel,
  type SocialLink,
} from "@/lib/social";
import { MAIL_DRIVERS, MAIL_ENCRYPTIONS } from "@/lib/mail";
import { normalizeBdPhone, SMS_TYPES } from "@/lib/sms";
import { requireAdmin } from "../auth";
import { sendMail } from "../mail";
import { sendSms } from "../sms";
import { getSettings } from "../queries";
import { deleteImage, FAVICON_TYPES, saveImage, validateImage } from "../uploads";
import { firstErrors, type FormState } from "./form-state";

const fee = z.coerce.number().int().min(0, "Can’t be negative").max(100000);

const settingsSchema = z.object({
  storeName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(5, "Enter a phone number").max(30),
  email: z.email("Enter a valid email").max(191),
  address: z.string().trim().min(3).max(300),
  mobilePaymentNumber: z.string().trim().min(5, "Enter the bKash/Nagad number").max(30),
});

export async function saveSettings(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin("settings");
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

/* ---------- Shipping charges (Ecommerce Setting → General Setting) ---------- */

const shippingSchema = z.object({
  insideDhakaFee: fee,
  outsideDhakaFee: fee,
  freeShippingMin: fee,
});

export async function saveShippingSettings(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin("settings");
  const parsed = shippingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Please fix the highlighted fields.", errors: firstErrors(parsed.error) };

  await db.transaction(async (tx) => {
    for (const [key, value] of Object.entries(parsed.data)) {
      await tx
        .insert(schema.settings)
        .values({ key, value: String(value) })
        .onDuplicateKeyUpdate({ set: { value: String(value) } });
    }
  });
  // Checkout and cart read these on every store page.
  revalidatePath("/", "layout");
  return { ok: true, message: "Shipping charges updated." };
}

/* ---------- Mail (SMTP) ---------- */

const mailSchema = z.object({
  mailFromAddress: z.email("Enter a valid email").max(191),
  mailFromName: z.string().trim().max(120),
  mailDriver: z.enum(MAIL_DRIVERS),
  mailHost: z.string().trim().max(191),
  mailPort: z.coerce.number().int().min(1, "Enter a port like 587").max(65535),
  mailEncryption: z.enum(MAIL_ENCRYPTIONS),
  mailUsername: z.string().trim().max(191),
});

export async function saveMailSettings(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin("settings");
  const parsed = mailSchema.safeParse(Object.fromEntries(formData));
  const errors = parsed.success ? {} : firstErrors(parsed.error);
  if (parsed.success && parsed.data.mailDriver === "smtp" && !parsed.data.mailHost) errors.mailHost = "Enter the SMTP host, e.g. mail.yourdomain.com";
  if (!parsed.success || Object.keys(errors).length) return { ok: false, message: "Please fix the highlighted fields.", errors };

  // The saved password is never shown, so an empty box keeps it.
  const password = String(formData.get("mailPassword") ?? "");
  if (password.length > 500) return { ok: false, message: "Please fix the highlighted fields.", errors: { mailPassword: "That password looks too long." } };
  const values: Record<string, string> = {
    ...Object.fromEntries(Object.entries(parsed.data).map(([k, v]) => [k, String(v)])),
    mailActive: formData.get("mailActive") === "on" ? "1" : "0",
  };
  if (password) values.mailPassword = password;
  else if (formData.get("clearMailPassword") === "on") values.mailPassword = "";

  await db.transaction(async (tx) => {
    for (const [key, value] of Object.entries(values)) {
      await tx.insert(schema.settings).values({ key, value }).onDuplicateKeyUpdate({ set: { value } });
    }
  });
  revalidatePath("/admin/settings/mail");
  return { ok: true, message: "Mail settings saved." };
}

export async function sendTestMail(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin("settings");
  const to = z.email().safeParse(String(formData.get("testTo") ?? "").trim());
  if (!to.success) return { ok: false, message: "Enter a valid email address.", errors: { testTo: "Enter a valid email address." } };

  const { storeName } = await getSettings();
  const result = await sendMail(
    {
      to: to.data,
      subject: `Test email from ${storeName}`,
      text: `This is a test email from ${storeName}. Your mail settings are working.`,
      html: `<p>This is a test email from <strong>${storeName.replace(/[<>&]/g, "")}</strong>.</p><p>Your mail settings are working. ✅</p>`,
    },
    // Lets the admin check the settings before switching mail on.
    { ignoreActive: true },
  );
  return result.ok ? { ok: true, message: `Test email sent to ${to.data}.` } : { ok: false, message: `Sending failed: ${result.error}` };
}

/* ---------- SMS gateway ---------- */

const smsUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => !v || /^https?:\/\/\S+\.\S+/.test(v), "Use a full link like http://bulksmsbd.net/api/smsapi");

const smsSchema = z.object({
  smsType: z.enum(SMS_TYPES),
  smsSenderId: z.string().trim().max(40),
  smsUrlNonMasking: smsUrl,
  smsUrlMasking: smsUrl,
  smsUsername: z.string().trim().max(191),
});

export async function saveSmsSettings(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin("settings");
  const parsed = smsSchema.safeParse(Object.fromEntries(formData));
  const errors = parsed.success ? {} : firstErrors(parsed.error);
  if (parsed.success) {
    const d = parsed.data;
    if (d.smsType === "masking" && !d.smsUrlMasking) errors.smsUrlMasking = "Masking SMS needs this URL.";
    if (d.smsType === "non-masking" && !d.smsUrlNonMasking) errors.smsUrlNonMasking = "Non-masking SMS needs this URL.";
    if (d.smsType === "masking" && !d.smsSenderId) errors.smsSenderId = "Masking SMS needs your approved sender ID.";
  }
  if (!parsed.success || Object.keys(errors).length) return { ok: false, message: "Please fix the highlighted fields.", errors };

  // The saved password is never shown, so an empty box keeps it.
  const password = String(formData.get("smsPassword") ?? "");
  if (password.length > 500) return { ok: false, message: "Please fix the highlighted fields.", errors: { smsPassword: "That password looks too long." } };
  const values: Record<string, string> = { ...parsed.data, smsActive: formData.get("smsActive") === "on" ? "1" : "0" };
  if (password) values.smsPassword = password;
  else if (formData.get("clearSmsPassword") === "on") values.smsPassword = "";

  await db.transaction(async (tx) => {
    for (const [key, value] of Object.entries(values)) {
      await tx.insert(schema.settings).values({ key, value }).onDuplicateKeyUpdate({ set: { value } });
    }
  });
  revalidatePath("/admin/settings/sms");
  return { ok: true, message: "SMS settings saved." };
}

export async function sendTestSms(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin("settings");
  const to = String(formData.get("testPhone") ?? "").trim();
  if (!normalizeBdPhone(to)) return { ok: false, message: "Enter a valid mobile number, e.g. 01712345678.", errors: { testPhone: "Invalid number" } };

  const { storeName } = await getSettings();
  // Lets the admin check the gateway before switching SMS on.
  const result = await sendSms(to, `Test SMS from ${storeName}. Your SMS settings are working.`, { ignoreActive: true });
  return result.ok ? { ok: true, message: `Test SMS sent to ${to}.` } : { ok: false, message: `Sending failed: ${result.error}` };
}

/* ---------- Branding: logo + favicon ---------- */

const uploaded = (v: FormDataEntryValue | null) => (v instanceof File && v.size > 0 ? v : null);

export async function saveBranding(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin("settings");
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

/* ---------- Social links + social login apps ---------- */

const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => !v || /^https?:\/\/\S+\.\S+/.test(v), "Use a full link like https://facebook.com/yourpage");

const socialAppsSchema = z.object(
  Object.fromEntries(
    SOCIAL_PROVIDERS.flatMap(({ provider: p }) => [
      [`${p}AppId`, z.string().trim().max(255)],
      [`${p}RedirectUrl`, optionalUrl],
    ]),
  ),
) as z.ZodType<Record<string, string>>;

const socialLinkSchema = z.object({
  network: z.enum(SOCIAL_NETWORK_KEYS),
  label: z.string().trim().max(60, "Keep the name under 60 characters"),
  url: z
    .string()
    .trim()
    .min(1, "Enter the link")
    .max(500)
    .refine((v) => /^https?:\/\/\S+\.\S+/.test(v), "Use a full link like https://facebook.com/yourpage"),
});

/** Validates the link rows; errors are keyed `link-{index}-{field}` so the form can mark the right box. */
function parseSocialLinks(raw: FormDataEntryValue | null, errors: Record<string, string>): SocialLink[] {
  let rows: unknown;
  try {
    rows = JSON.parse(String(raw ?? "[]"));
  } catch {
    rows = null;
  }
  if (!Array.isArray(rows)) {
    errors.socialLinks = "The links could not be read — reload and try again.";
    return [];
  }
  if (rows.length > MAX_SOCIAL_LINKS) errors.socialLinks = `Add at most ${MAX_SOCIAL_LINKS} links.`;
  const links: SocialLink[] = [];
  rows.slice(0, MAX_SOCIAL_LINKS).forEach((row, i) => {
    const parsed = socialLinkSchema.safeParse(row);
    if (!parsed.success) {
      for (const [field, message] of Object.entries(firstErrors(parsed.error))) errors[`link-${i}-${field}`] ??= message;
      return;
    }
    const { network, label, url } = parsed.data;
    if (network === "other" && !label) errors[`link-${i}-label`] = "Name this link, e.g. Daraz Shop";
    links.push({ network, url, label: label || socialNetworkLabel(network) });
  });
  return links;
}

export async function saveSocialSettings(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin("settings");
  const fields = SOCIAL_PROVIDERS.flatMap(({ provider: p }) => [`${p}AppId`, `${p}RedirectUrl`]);
  const parsed = socialAppsSchema.safeParse(Object.fromEntries(fields.map((k) => [k, String(formData.get(k) ?? "")])));
  const errors = parsed.success ? {} : firstErrors(parsed.error);
  const links = parseSocialLinks(formData.get("socialLinks"), errors);

  // Secrets are never sent to the browser, so an empty box means "keep the saved one".
  const secrets: Record<string, string> = {};
  for (const { provider: p } of SOCIAL_PROVIDERS) {
    const key = `${p}AppSecret`;
    const value = String(formData.get(key) ?? "").trim();
    if (value.length > 500) errors[key] = "That secret looks too long.";
    else if (value) secrets[key] = value;
    else if (formData.get(`clear${key}`) === "on") secrets[key] = "";
  }
  if (!parsed.success || Object.keys(errors).length) return { ok: false, message: "Please fix the highlighted fields.", errors };

  const values = { ...parsed.data, ...secrets, [SOCIAL_LINKS_KEY]: JSON.stringify(links) };
  await db.transaction(async (tx) => {
    for (const [key, value] of Object.entries(values)) {
      await tx.insert(schema.settings).values({ key, value }).onDuplicateKeyUpdate({ set: { value } });
    }
    // The list replaces the old one-key-per-platform links.
    await tx.delete(schema.settings).where(inArray(schema.settings.key, Object.values(LEGACY_SOCIAL_KEYS)));
  });
  revalidatePath("/admin/settings/social");
  // The footer shows the social links on every store page.
  revalidatePath("/", "layout");
  return { ok: true, message: "Social settings saved." };
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
