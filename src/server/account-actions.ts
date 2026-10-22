"use server";

import bcrypt from "bcryptjs";
import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, schema } from "@/db";
import { divisions, isValidBdPhone, normalizePhone } from "@/lib/checkout";
import { firstErrors, type FormState } from "./admin/form-state";
import { createCustomerSession, destroyCustomerSession, requireCustomer, safeNext } from "./customer-auth";
import { rateLimit } from "./rate-limit";

const { customers } = schema;

// Simple in-memory brute-force guard (per server process), same approach as the admin login.
const failures = new Map<string, { count: number; until: number }>();
const MAX_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000;
const DUMMY_HASH = "$2b$12$sKy50bTGyI/aC1VyfDnwR.NTZbA7G/dp7N12wLLHOw3nxLk/XcZw2";

const phoneField = z
  .string()
  .trim()
  .refine(isValidBdPhone, "Enter a valid Bangladeshi mobile number, e.g. 01712345678")
  .transform(normalizePhone);
const emailField = z.preprocess(
  (v) => (typeof v === "string" ? v.trim() : ""),
  z.union([z.literal(""), z.email("Enter a valid email").max(191)]).transform((v) => (v ? v.toLowerCase() : null)),
);
const passwordField = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(200)
  .refine((v) => /[A-Za-z]/.test(v) && /\d/.test(v), "Use both letters and numbers");

/* ---------- Sign up ---------- */

const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your name").max(120),
    phone: phoneField,
    email: emailField,
    password: passwordField,
    confirm: z.string(),
    agree: z.literal("on", { error: "Please accept the terms to continue" }),
  })
  .refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Passwords don’t match" });

export async function register(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await rateLimit("register", 5, 60 * 60_000))) return { ok: false, message: "Too many requests. Please wait a few minutes and try again." };
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Please fix the highlighted fields.", errors: firstErrors(parsed.error) };
  const d = parsed.data;

  const [phoneTaken] = await db.select({ id: customers.id }).from(customers).where(eq(customers.phone, d.phone)).limit(1);
  if (phoneTaken) return { ok: false, message: "Please fix the highlighted fields.", errors: { phone: "An account with this number already exists — log in instead." } };
  if (d.email) {
    const [emailTaken] = await db.select({ id: customers.id }).from(customers).where(eq(customers.email, d.email)).limit(1);
    if (emailTaken) return { ok: false, message: "Please fix the highlighted fields.", errors: { email: "This email is already used by another account." } };
  }

  const passwordHash = await bcrypt.hash(d.password, 12);
  let id: number;
  try {
    [{ id }] = await db.insert(customers).values({ name: d.name, phone: d.phone, email: d.email, passwordHash, lastLoginAt: new Date() }).$returningId();
  } catch {
    // Unique-key race between the check above and the insert.
    return { ok: false, message: "An account with these details already exists — try logging in." };
  }

  await createCustomerSession(id);
  redirect(safeNext(formData.get("next")));
}

/* ---------- Log in ---------- */

const loginSchema = z.object({
  login: z.string().trim().min(3, "Enter your mobile number or email").max(191),
  password: z.string().min(1, "Enter your password").max(200),
});

export async function customerLogin(_prev: FormState, formData: FormData): Promise<FormState> {
  // Per-IP cap on top of the per-account lockout, so one client can't try many accounts.
  if (!(await rateLimit("customer-login", 20, 15 * 60_000))) return { ok: false, message: "Too many requests. Please wait a few minutes and try again." };
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Please fix the highlighted fields.", errors: firstErrors(parsed.error) };

  const raw = parsed.data.login;
  const isEmail = raw.includes("@");
  const id = isEmail ? raw.toLowerCase() : normalizePhone(raw);
  const record = failures.get(id);
  if (record && record.count >= MAX_ATTEMPTS && record.until > Date.now()) {
    return { ok: false, message: "Too many failed attempts. Please try again in 15 minutes." };
  }

  const [customer] = await db
    .select({ id: customers.id, passwordHash: customers.passwordHash, isActive: customers.isActive })
    .from(customers)
    .where(isEmail ? eq(customers.email, id) : eq(customers.phone, id))
    .limit(1);
  // Always run bcrypt so response time doesn't reveal whether the account exists.
  const valid = await bcrypt.compare(parsed.data.password, customer?.passwordHash ?? DUMMY_HASH);
  if (!customer || !valid) {
    const count = (record && record.until > Date.now() ? record.count : 0) + 1;
    failures.set(id, { count, until: Date.now() + LOCK_MS });
    return { ok: false, message: "Incorrect mobile number/email or password." };
  }

  failures.delete(id);
  if (!customer.isActive) return { ok: false, message: "This account has been blocked. Please contact the store." };
  await db.update(customers).set({ lastLoginAt: new Date() }).where(eq(customers.id, customer.id));
  await createCustomerSession(customer.id);
  redirect(safeNext(formData.get("next")));
}

export async function customerLogout() {
  await destroyCustomerSession();
  redirect("/login");
}

/* ---------- Profile ---------- */

const profileSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(120),
  phone: phoneField,
  email: emailField,
  division: z.union([z.literal(""), z.enum(divisions as [string, ...string[]])]),
  area: z.string().trim().max(120),
  address: z.string().trim().max(500),
});

export async function updateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const me = await requireCustomer("/account/profile");
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Please fix the highlighted fields.", errors: firstErrors(parsed.error) };
  const d = parsed.data;

  const [phoneTaken] = await db.select({ id: customers.id }).from(customers).where(and(eq(customers.phone, d.phone), ne(customers.id, me.id))).limit(1);
  if (phoneTaken) return { ok: false, message: "Please fix the highlighted fields.", errors: { phone: "Another account uses this number." } };
  if (d.email) {
    const [emailTaken] = await db.select({ id: customers.id }).from(customers).where(and(eq(customers.email, d.email), ne(customers.id, me.id))).limit(1);
    if (emailTaken) return { ok: false, message: "Please fix the highlighted fields.", errors: { email: "Another account uses this email." } };
  }

  await db.update(customers).set(d).where(eq(customers.id, me.id));
  revalidatePath("/account", "layout");
  return { ok: true, message: "Profile saved." };
}

const passwordSchema = z
  .object({ current: z.string().min(1, "Enter your current password"), password: passwordField, confirm: z.string() })
  .refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Passwords don’t match" });

export async function changePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const me = await requireCustomer("/account/profile");
  const parsed = passwordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Please fix the highlighted fields.", errors: firstErrors(parsed.error) };

  const [row] = await db.select({ passwordHash: customers.passwordHash }).from(customers).where(eq(customers.id, me.id)).limit(1);
  if (!row || !(await bcrypt.compare(parsed.data.current, row.passwordHash))) {
    return { ok: false, message: "Please fix the highlighted fields.", errors: { current: "Current password is incorrect." } };
  }
  await db.update(customers).set({ passwordHash: await bcrypt.hash(parsed.data.password, 12) }).where(eq(customers.id, me.id));
  return { ok: true, message: "Password changed." };
}
