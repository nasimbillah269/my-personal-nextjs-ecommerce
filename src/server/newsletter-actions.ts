"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import type { FormState } from "./admin/form-state";
import { rateLimit } from "./rate-limit";

const emailSchema = z.email().max(191);

/** Public newsletter sign-up. Re-subscribes an address that unsubscribed earlier. */
export async function subscribe(_prev: FormState, formData: FormData): Promise<FormState> {
  // Honeypot: people never see this field.
  if (formData.get("company")) return { ok: true, message: "Thanks for subscribing!" };

  if (!(await rateLimit("subscribe", 10, 60 * 60_000))) return { ok: false, message: "Too many requests. Please wait a few minutes and try again." };

  const parsed = emailSchema.safeParse(String(formData.get("email") ?? "").trim().toLowerCase());
  if (!parsed.success) return { ok: false, message: "Please enter a valid email address." };
  const email = parsed.data;

  const s = schema.subscribers;
  const [existing] = await db.select({ id: s.id, status: s.status }).from(s).where(eq(s.email, email)).limit(1);
  if (existing?.status === "subscribed") return { ok: true, message: "You’re already subscribed — thank you!" };
  if (existing) await db.update(s).set({ status: "subscribed" }).where(eq(s.id, existing.id));
  else await db.insert(s).values({ email, source: "home" }).onDuplicateKeyUpdate({ set: { status: "subscribed" } });
  return { ok: true, message: "Thanks for subscribing! Watch your inbox for offers." };
}
