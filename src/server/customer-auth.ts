import "server-only";
import { and, eq } from "drizzle-orm";
import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db, schema } from "@/db";
import { CUSTOMER_SESSION_COOKIE } from "./constants";

const SESSION_DAYS = 30;

/**
 * Customer tokens are signed with a key derived from SESSION_SECRET but different from the admin key,
 * so a customer's token can never verify as an admin session (both carry a numeric `sub`).
 */
function customerKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("SESSION_SECRET must be set to a random string of 32+ characters.");
  return new TextEncoder().encode(`${secret}:customer-session`);
}

export async function createCustomerSession(customerId: number) {
  const token = await new SignJWT({ sub: String(customerId) })
    .setProtectedHeader({ alg: "HS256" })
    .setAudience("customer")
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(customerKey());

  (await cookies()).set(CUSTOMER_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function destroyCustomerSession() {
  (await cookies()).delete(CUSTOMER_SESSION_COOKIE);
}

export type CustomerUser = {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  division: string;
  area: string;
  address: string;
  createdAt: Date;
};

/** The signed-in customer for this request, or null. Re-checks the DB so deleted accounts lose access. */
export const getCustomer = cache(async (): Promise<CustomerUser | null> => {
  const token = (await cookies()).get(CUSTOMER_SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, customerKey(), { algorithms: ["HS256"], audience: "customer" });
    const id = Number(payload.sub);
    if (!Number.isInteger(id)) return null;
    const c = schema.customers;
    const [customer] = await db
      .select({ id: c.id, name: c.name, phone: c.phone, email: c.email, division: c.division, area: c.area, address: c.address, createdAt: c.createdAt })
      .from(c)
      .where(and(eq(c.id, id), eq(c.isActive, true)))
      .limit(1);
    return customer ?? null;
  } catch {
    return null;
  }
});

/** For account pages: sends guests to /login and brings them back afterwards. */
export async function requireCustomer(next = "/account"): Promise<CustomerUser> {
  const customer = await getCustomer();
  if (!customer) redirect(`/login?next=${encodeURIComponent(next)}`);
  return customer;
}

/**
 * Only same-site paths are allowed as a post-login destination. Backslashes are rejected because
 * browsers read "/\evil.com" as "//evil.com", a link to another site.
 */
export const safeNext = (next: unknown, fallback = "/account") =>
  typeof next === "string" && next.startsWith("/") && !next.startsWith("//") && !next.includes("\\") && !next.startsWith("/admin")
    ? next
    : fallback;
