import "server-only";
import { headers } from "next/headers";

/**
 * Public origin of the store, e.g. "https://ultimateorganiclife.com" (no trailing slash).
 * Set SITE_URL in production; otherwise it's taken from the request's Host header.
 */
export async function getSiteUrl() {
  const fromEnv = process.env.SITE_URL?.trim().replace(/\/+$/, "");
  if (fromEnv) return fromEnv;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
