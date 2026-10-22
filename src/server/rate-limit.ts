import "server-only";
import { headers } from "next/headers";

/**
 * Simple in-memory, per-IP rate limiting for public server actions (per server process,
 * same approach as the login lockouts). Good enough for one Node server; use Redis if you run several.
 */
const hits = new Map<string, number[]>();
let lastSweep = Date.now();

/** Client IP from the proxy headers (first X-Forwarded-For entry), or "unknown". */
export async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip")?.trim() || "unknown";
}

/**
 * Records one hit for `bucket` from this client and returns false once it exceeds
 * `limit` hits within `windowMs`.
 */
export async function rateLimit(bucket: string, limit: number, windowMs: number): Promise<boolean> {
  const now = Date.now();
  // Drop stale entries now and then so the map can't grow without bound.
  if (now - lastSweep > 10 * 60_000) {
    lastSweep = now;
    for (const [key, times] of hits) if (times[times.length - 1] < now - 60 * 60_000) hits.delete(key);
  }
  const key = `${bucket}:${await clientIp()}`;
  const recent = (hits.get(key) ?? []).filter((t) => t > now - windowMs);
  recent.push(now);
  hits.set(key, recent);
  return recent.length <= limit;
}
