import "server-only";
import { inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { normalizeBdPhone, SMS_SETTING_KEYS, SMS_TYPES, type SmsSettings, type SmsType } from "@/lib/sms";

type SmsConfig = SmsSettings & { password: string };

async function readSmsConfig(): Promise<SmsConfig> {
  const rows = await db.select().from(schema.settings).where(inArray(schema.settings.key, SMS_SETTING_KEYS));
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const type = map.get("smsType") as SmsType | undefined;
  return {
    type: type && SMS_TYPES.includes(type) ? type : "non-masking",
    senderId: map.get("smsSenderId") ?? "",
    urlNonMasking: map.get("smsUrlNonMasking") ?? "",
    urlMasking: map.get("smsUrlMasking") ?? "",
    username: map.get("smsUsername") ?? "",
    password: map.get("smsPassword") ?? "",
    active: map.get("smsActive") === "1",
  };
}

/** Settings for the admin form. The password is never sent to the browser — only whether one is saved. */
export async function getSmsSettings(): Promise<SmsSettings & { hasPassword: boolean }> {
  const { password, ...rest } = await readSmsConfig();
  return { ...rest, hasPassword: !!password };
}

/**
 * Builds the gateway request URL.
 * - If the saved URL contains placeholders — {number} {message} {sender_id} {username} {password} —
 *   they are filled in, so any provider's format can be used.
 * - Otherwise the bulksmsbd.net style is used: ?api_key=<username>&type=text&senderid=…&number=…&message=…
 *   (plus &password=… when a password is saved).
 */
function buildUrl(c: SmsConfig, base: string, number: string, message: string) {
  const values: Record<string, string> = {
    number,
    message,
    sender_id: c.senderId,
    username: c.username,
    password: c.password,
  };
  if (/\{(number|message|sender_id|username|password)\}/.test(base)) {
    return base.replace(/\{(number|message|sender_id|username|password)\}/g, (_, k: string) => encodeURIComponent(values[k]));
  }
  const url = new URL(base);
  url.searchParams.set("api_key", c.username);
  if (c.password) url.searchParams.set("password", c.password);
  url.searchParams.set("type", "text");
  if (c.senderId) url.searchParams.set("senderid", c.senderId);
  url.searchParams.set("number", number);
  url.searchParams.set("message", message);
  return url.toString();
}

/** Reads the gateway's reply. bulksmsbd answers HTTP 200 with `response_code` 202 on success and 1001+ on errors. */
function readReply(status: number, body: string): string | null {
  if (status < 200 || status >= 300) return `Gateway answered HTTP ${status}: ${body.slice(0, 200)}`;
  try {
    const json = JSON.parse(body) as { response_code?: number | string; error_message?: string; success_message?: string };
    if (json.response_code !== undefined && Number(json.response_code) !== 202) {
      return json.error_message || `Gateway error code ${json.response_code}`;
    }
  } catch {
    // Not JSON — some gateways reply in plain text; a 2xx counts as sent.
  }
  return null;
}

export type SendSmsResult = { ok: true } | { ok: false; error: string };

/**
 * Sends an SMS with the gateway saved in Admin → SMS Setting.
 * Never throws: when SMS is turned off or misconfigured it returns `ok: false`,
 * so callers (order placement, registration) keep working if the gateway is down.
 */
export async function sendSms(to: string, message: string, { ignoreActive = false } = {}): Promise<SendSmsResult> {
  const c = await readSmsConfig();
  if (!c.active && !ignoreActive) return { ok: false, error: "SMS is turned off in SMS Setting." };
  const number = normalizeBdPhone(to);
  if (!number) return { ok: false, error: `“${to}” is not a valid Bangladeshi mobile number.` };
  const base = c.type === "masking" ? c.urlMasking : c.urlNonMasking;
  if (!base) return { ok: false, error: `Set the ${c.type === "masking" ? "masking" : "non-masking"} SMS URL first.` };
  if (!c.username) return { ok: false, error: "Set the SMS username / API key first." };

  try {
    const res = await fetch(buildUrl(c, base, number, message), { cache: "no-store", signal: AbortSignal.timeout(15_000) });
    const error = readReply(res.status, await res.text());
    return error ? { ok: false, error } : { ok: true };
  } catch (err) {
    console.error("sendSms failed:", err);
    return { ok: false, error: err instanceof Error ? err.message : "Could not reach the SMS gateway." };
  }
}
