import "server-only";
import nodemailer from "nodemailer";
import { inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { MAIL_DRIVERS, MAIL_ENCRYPTIONS, MAIL_SETTING_KEYS, type MailSettings } from "@/lib/mail";

type MailConfig = MailSettings & { password: string };

async function readMailConfig(): Promise<MailConfig> {
  const rows = await db.select().from(schema.settings).where(inArray(schema.settings.key, MAIL_SETTING_KEYS));
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const pick = <T extends string>(key: string, allowed: readonly T[], fallback: T) => {
    const v = map.get(key) as T | undefined;
    return v && allowed.includes(v) ? v : fallback;
  };
  return {
    fromAddress: map.get("mailFromAddress") ?? "",
    fromName: map.get("mailFromName") ?? "",
    driver: pick("mailDriver", MAIL_DRIVERS, "smtp"),
    host: map.get("mailHost") ?? "",
    port: Number(map.get("mailPort")) || 587,
    encryption: pick("mailEncryption", MAIL_ENCRYPTIONS, "tls"),
    username: map.get("mailUsername") ?? "",
    password: map.get("mailPassword") ?? "",
    active: map.get("mailActive") === "1",
  };
}

/** Settings for the admin form. The password is never sent to the browser — only whether one is saved. */
export async function getMailSettings(): Promise<MailSettings & { hasPassword: boolean }> {
  const { password, ...rest } = await readMailConfig();
  return { ...rest, hasPassword: !!password };
}

function createTransport(c: MailConfig) {
  if (c.driver === "sendmail") return nodemailer.createTransport({ sendmail: true, newline: "unix" });
  return nodemailer.createTransport({
    host: c.host,
    port: c.port,
    // "ssl" = implicit TLS (usually port 465); "tls" = STARTTLS upgrade (usually 587).
    secure: c.encryption === "ssl",
    requireTLS: c.encryption === "tls",
    ignoreTLS: c.encryption === "none",
    auth: c.username ? { user: c.username, pass: c.password } : undefined,
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
  });
}

export type SendMailInput = { to: string; subject: string; html?: string; text?: string; replyTo?: string };
export type SendMailResult = { ok: true } | { ok: false; error: string };

/**
 * Sends an email with the SMTP settings saved in Admin → Mail Setting.
 * Never throws: when mail is turned off or misconfigured it returns `ok: false`, so callers
 * (order placement, registration, newsletters) keep working even if mail is broken.
 */
export async function sendMail(input: SendMailInput, { ignoreActive = false } = {}): Promise<SendMailResult> {
  const c = await readMailConfig();
  if (!c.active && !ignoreActive) return { ok: false, error: "Mail is turned off in Mail Setting." };
  if (!c.fromAddress) return { ok: false, error: "Set the “Mail From Address” first." };
  if (c.driver === "smtp" && !c.host) return { ok: false, error: "Set the mail host first." };

  try {
    await createTransport(c).sendMail({
      from: c.fromName ? { name: c.fromName, address: c.fromAddress } : c.fromAddress,
      to: input.to,
      replyTo: input.replyTo,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });
    return { ok: true };
  } catch (err) {
    console.error("sendMail failed:", err);
    return { ok: false, error: err instanceof Error ? err.message : "Could not send the email." };
  }
}
