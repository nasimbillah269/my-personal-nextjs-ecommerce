"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, schema } from "@/db";
import { createSession, destroySession } from "../auth";

export type LoginState = { error?: string } | null;

// Simple in-memory brute-force guard (per server process).
const failures = new Map<string, { count: number; until: number }>();
const MAX_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000;
const DUMMY_HASH = "$2b$12$sKy50bTGyI/aC1VyfDnwR.NTZbA7G/dp7N12wLLHOw3nxLk/XcZw2";

const credentials = z.object({
  email: z.email().max(191),
  password: z.string().min(1).max(200),
});

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = credentials.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: "Enter a valid email and password." };

  const email = parsed.data.email.toLowerCase();
  const record = failures.get(email);
  if (record && record.count >= MAX_ATTEMPTS && record.until > Date.now()) {
    return { error: "Too many failed attempts. Please try again in 15 minutes." };
  }

  const [admin] = await db.select().from(schema.admins).where(eq(schema.admins.email, email)).limit(1);
  // Always run bcrypt so response time doesn't reveal whether the email exists.
  const valid = await bcrypt.compare(parsed.data.password, admin?.passwordHash ?? DUMMY_HASH);

  if (!admin || !valid) {
    const count = (record && record.until > Date.now() ? record.count : 0) + 1;
    failures.set(email, { count, until: Date.now() + LOCK_MS });
    return { error: "Incorrect email or password." };
  }

  failures.delete(email);
  await createSession(admin.id);
  const next = String(formData.get("next") ?? "");
  redirect(next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin");
}

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}
