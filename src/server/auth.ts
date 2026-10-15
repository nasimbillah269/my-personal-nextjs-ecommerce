import "server-only";
import { eq } from "drizzle-orm";
import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db, schema } from "@/db";
import { ALL_PERMISSIONS, type AdminPermission } from "@/lib/constants";
import { ADMIN_SESSION_COOKIE } from "./constants";

const SESSION_DAYS = 7;

function secretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("SESSION_SECRET must be set to a random string of 32+ characters.");
  return new TextEncoder().encode(secret);
}

export async function createSession(adminId: number) {
  const token = await new SignJWT({ sub: String(adminId) })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secretKey());

  (await cookies()).set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function destroySession() {
  (await cookies()).delete(ADMIN_SESSION_COOKIE);
}

export type AdminUser = {
  id: number;
  name: string;
  email: string;
  roleName: string | null;
  /** Expanded permission keys; Super Admin gets every key. */
  permissions: AdminPermission[];
  isSuperAdmin: boolean;
};

/** The signed-in admin for this request, or null. Re-checks the DB so deleted or deactivated admins lose access. */
export const getAdmin = cache(async (): Promise<AdminUser | null> => {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    const id = Number(payload.sub);
    if (!Number.isInteger(id)) return null;
    const [row] = await db
      .select({
        id: schema.admins.id,
        name: schema.admins.name,
        email: schema.admins.email,
        isActive: schema.admins.isActive,
        roleName: schema.roles.name,
        permissions: schema.roles.permissions,
      })
      .from(schema.admins)
      .leftJoin(schema.roles, eq(schema.roles.id, schema.admins.roleId))
      .where(eq(schema.admins.id, id))
      .limit(1);
    if (!row || !row.isActive) return null;
    const granted = row.permissions ?? [];
    const isSuperAdmin = granted.includes("*");
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      roleName: row.roleName,
      isSuperAdmin,
      permissions: isSuperAdmin ? ALL_PERMISSIONS : ALL_PERMISSIONS.filter((p) => granted.includes(p)),
    };
  } catch {
    return null;
  }
});

export const can = (admin: AdminUser, permission: AdminPermission) => admin.permissions.includes(permission);

/**
 * Call at the top of every admin page and server action. With a permission, admins whose role
 * lacks it are sent to the "no access" page.
 */
export async function requireAdmin(permission?: AdminPermission): Promise<AdminUser> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  if (permission && !can(admin, permission)) redirect(`/admin/denied?need=${permission}`);
  return admin;
}
