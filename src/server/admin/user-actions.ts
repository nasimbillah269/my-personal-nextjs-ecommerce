"use server";

import bcrypt from "bcryptjs";
import { and, count, eq, ne, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/db";
import { ALL_PERMISSIONS, type AdminPermission } from "@/lib/constants";
import { requireAdmin, type AdminUser } from "../auth";
import { firstErrors, type FormState } from "./form-state";

const { admins, roles, customers, subscribers } = schema;

const invalid = (errors: Record<string, string>): FormState => ({ ok: false, message: "Please fix the highlighted fields.", errors });

const passwordField = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(200)
  .refine((v) => /[A-Za-z]/.test(v) && /\d/.test(v), "Use both letters and numbers");

/** Active admins holding a role with every permission ("*"), optionally ignoring one admin. */
async function activeSuperAdmins(excludeId?: number) {
  const [row] = await db
    .select({ n: count() })
    .from(admins)
    .innerJoin(roles, eq(roles.id, admins.roleId))
    .where(and(eq(admins.isActive, true), sql`JSON_CONTAINS(${roles.permissions}, '"*"')`, excludeId ? ne(admins.id, excludeId) : undefined));
  return row?.n ?? 0;
}

async function isSuperRole(roleId: number | null) {
  if (!roleId) return false;
  const [r] = await db.select({ permissions: roles.permissions }).from(roles).where(eq(roles.id, roleId)).limit(1);
  return !!r?.permissions.includes("*");
}

async function rolePermissions(roleId: number | null): Promise<string[]> {
  if (!roleId) return [];
  const [r] = await db.select({ permissions: roles.permissions }).from(roles).where(eq(roles.id, roleId)).limit(1);
  return r?.permissions ?? [];
}

/**
 * Admins who aren't Super Admin may only hand out, or manage admins holding, permissions they have themselves.
 * Otherwise anyone with the "admins" permission could make themselves Super Admin or take over a Super Admin's account.
 */
const withinOwn = (me: AdminUser, permissions: string[]) =>
  me.isSuperAdmin || (!permissions.includes("*") && permissions.every((p) => me.permissions.includes(p as AdminPermission)));

const OUTRANKED = "Only a Super Admin (or an admin with all of these permissions) can do this.";

/* ---------- Admin users ---------- */

const adminSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(120),
  email: z.email("Enter a valid email").max(191).transform((e) => e.toLowerCase()),
  roleId: z.coerce.number().int().positive("Choose a role"),
  password: z.string().max(200),
  isActive: z.boolean(),
});

export async function saveAdmin(_prev: FormState, formData: FormData): Promise<FormState> {
  const me = await requireAdmin("admins");
  const id = Number(formData.get("id")) || null;
  const parsed = adminSchema.safeParse({ ...Object.fromEntries(formData), isActive: formData.get("isActive") === "on" });
  if (!parsed.success) return invalid(firstErrors(parsed.error));
  const d = parsed.data;

  // Password: required for a new admin, optional (keep current) when editing.
  if (!id || d.password) {
    const pw = passwordField.safeParse(d.password);
    if (!pw.success) return invalid({ password: pw.error.issues[0].message });
  }

  const [role] = await db.select({ id: roles.id, permissions: roles.permissions }).from(roles).where(eq(roles.id, d.roleId)).limit(1);
  if (!role) return invalid({ roleId: "That role no longer exists." });
  if (!withinOwn(me, role.permissions)) return invalid({ roleId: `You can’t assign a role with more access than your own. ${OUTRANKED}` });

  const [clash] = await db.select({ id: admins.id }).from(admins).where(id ? and(eq(admins.email, d.email), ne(admins.id, id)) : eq(admins.email, d.email)).limit(1);
  if (clash) return invalid({ email: "Another admin already uses this email." });

  if (id) {
    const [existing] = await db.select({ id: admins.id, roleId: admins.roleId }).from(admins).where(eq(admins.id, id)).limit(1);
    if (!existing) return { ok: false, message: "This admin no longer exists." };
    if (!withinOwn(me, await rolePermissions(existing.roleId))) return { ok: false, message: `This admin has more access than you. ${OUTRANKED}` };
    if (id === me.id && !d.isActive) return invalid({ isActive: "You can’t deactivate your own account." });
    // Never leave the store without an active Super Admin.
    const staysSuper = d.isActive && (await isSuperRole(d.roleId));
    if (!staysSuper && (await activeSuperAdmins(id)) === 0) {
      return { ok: false, message: "This is the last active Super Admin — keep their role and status, or make someone else Super Admin first." };
    }
  }

  const values = { name: d.name, email: d.email, roleId: d.roleId, isActive: d.isActive, ...(d.password ? { passwordHash: await bcrypt.hash(d.password, 12) } : {}) };
  if (id) await db.update(admins).set(values).where(eq(admins.id, id));
  else await db.insert(admins).values({ ...values, passwordHash: values.passwordHash! });

  revalidatePath("/admin/users/admins");
  revalidatePath("/admin/users/roles");
  if (id === me.id) revalidatePath("/admin", "layout");
  return { ok: true, message: id ? "Admin updated." : "Admin added. They can log in with this email and password now." };
}

export async function deleteAdmin(id: number): Promise<FormState> {
  const me = await requireAdmin("admins");
  if (id === me.id) return { ok: false, message: "You can’t delete your own account." };
  const [row] = await db.select({ roleId: admins.roleId, isActive: admins.isActive }).from(admins).where(eq(admins.id, id)).limit(1);
  if (!row) return { ok: false, message: "Admin not found." };
  if (!withinOwn(me, await rolePermissions(row.roleId))) return { ok: false, message: `This admin has more access than you. ${OUTRANKED}` };
  if (row.isActive && (await isSuperRole(row.roleId)) && (await activeSuperAdmins(id)) === 0) {
    return { ok: false, message: "You can’t delete the last active Super Admin." };
  }
  await db.delete(admins).where(eq(admins.id, id));
  revalidatePath("/admin/users/admins");
  revalidatePath("/admin/users/roles");
  return { ok: true, message: "Admin deleted." };
}

/* ---------- Roles ---------- */

const roleSchema = z.object({
  name: z.string().trim().min(2, "Role name is required").max(80),
  description: z.string().trim().max(255),
});

export async function saveRole(_prev: FormState, formData: FormData): Promise<FormState> {
  const me = await requireAdmin("admins");
  const id = Number(formData.get("id")) || null;
  const parsed = roleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(firstErrors(parsed.error));
  let permissions = formData.getAll("permissions").map(String).filter((p): p is AdminPermission => ALL_PERMISSIONS.includes(p as AdminPermission));

  let existingPermissions: string[] = [];
  if (id) {
    const [existing] = await db.select({ isSystem: roles.isSystem, permissions: roles.permissions }).from(roles).where(eq(roles.id, id)).limit(1);
    if (!existing) return { ok: false, message: "This role no longer exists." };
    if (existing.isSystem) return { ok: false, message: "The Super Admin role can’t be changed." };
    existingPermissions = existing.permissions;
  }
  if (!me.isSuperAdmin) {
    // Only permissions the editor holds can be switched on or off; the rest keep their saved state.
    const mine = (p: string) => me.permissions.includes(p as AdminPermission);
    const kept = existingPermissions.filter((p): p is AdminPermission => !mine(p) && ALL_PERMISSIONS.includes(p as AdminPermission));
    if (permissions.some((p) => !mine(p) && !existingPermissions.includes(p))) {
      return { ok: false, message: `You can only grant permissions you have yourself. ${OUTRANKED}` };
    }
    permissions = [...permissions.filter(mine), ...kept];
  }
  const [clash] = await db.select({ id: roles.id }).from(roles).where(id ? and(eq(roles.name, parsed.data.name), ne(roles.id, id)) : eq(roles.name, parsed.data.name)).limit(1);
  if (clash) return invalid({ name: "A role with this name already exists." });

  const values = { ...parsed.data, permissions };
  if (id) await db.update(roles).set(values).where(eq(roles.id, id));
  else await db.insert(roles).values(values);

  revalidatePath("/admin/users/roles");
  revalidatePath("/admin/users/admins");
  // Permissions change what admins with this role see right away.
  revalidatePath("/admin", "layout");
  return { ok: true, message: id ? "Role updated." : "Role created." };
}

export async function deleteRole(id: number): Promise<FormState> {
  await requireAdmin("admins");
  const [role] = await db.select({ isSystem: roles.isSystem }).from(roles).where(eq(roles.id, id)).limit(1);
  if (!role) return { ok: false, message: "Role not found." };
  if (role.isSystem) return { ok: false, message: "The Super Admin role can’t be deleted." };
  const [{ n }] = await db.select({ n: count() }).from(admins).where(eq(admins.roleId, id));
  if (n > 0) return { ok: false, message: `Move its ${n} admin${n === 1 ? "" : "s"} to another role first.` };
  await db.delete(roles).where(eq(roles.id, id));
  revalidatePath("/admin/users/roles");
  return { ok: true, message: "Role deleted." };
}

/* ---------- Customers ---------- */

export async function setCustomerActive(id: number, isActive: boolean): Promise<FormState> {
  await requireAdmin("customers");
  await db.update(customers).set({ isActive }).where(eq(customers.id, id));
  revalidatePath("/admin/customers");
  return { ok: true, message: isActive ? "Customer unblocked." : "Customer blocked — they’re logged out and can’t log in." };
}

export async function setCustomerPassword(id: number, password: string): Promise<FormState> {
  await requireAdmin("customers");
  const pw = passwordField.safeParse(password);
  if (!pw.success) return { ok: false, message: pw.error.issues[0].message };
  const [res] = await db.update(customers).set({ passwordHash: await bcrypt.hash(pw.data, 12) }).where(eq(customers.id, id));
  if (!res.affectedRows) return { ok: false, message: "Customer not found." };
  return { ok: true, message: "New password set. Share it with the customer securely." };
}

export async function deleteCustomer(id: number): Promise<FormState> {
  await requireAdmin("customers");
  // Their orders stay (customer_id is set to NULL) so sales history is intact.
  await db.delete(customers).where(eq(customers.id, id));
  revalidatePath("/admin/customers");
  return { ok: true, message: "Account deleted. Their past orders are kept." };
}

/* ---------- Subscribers ---------- */

const subscriberSchema = z.object({
  email: z.email("Enter a valid email").max(191).transform((e) => e.toLowerCase()),
  name: z.string().trim().max(120).optional().transform((v) => v ?? ""),
});

export async function addSubscriber(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin("subscribers");
  const parsed = subscriberSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(firstErrors(parsed.error));
  const [exists] = await db.select({ id: subscribers.id }).from(subscribers).where(eq(subscribers.email, parsed.data.email)).limit(1);
  if (exists) return invalid({ email: "This email is already on the list." });
  await db.insert(subscribers).values({ ...parsed.data, source: "admin" });
  revalidatePath("/admin/users/subscribers");
  return { ok: true, message: "Subscriber added." };
}

export async function setSubscriberStatus(id: number, status: "subscribed" | "unsubscribed"): Promise<FormState> {
  await requireAdmin("subscribers");
  await db.update(subscribers).set({ status: status === "subscribed" ? "subscribed" : "unsubscribed" }).where(eq(subscribers.id, id));
  revalidatePath("/admin/users/subscribers");
  return { ok: true, message: status === "subscribed" ? "Re-subscribed." : "Unsubscribed." };
}

export async function deleteSubscriber(id: number): Promise<FormState> {
  await requireAdmin("subscribers");
  await db.delete(subscribers).where(eq(subscribers.id, id));
  revalidatePath("/admin/users/subscribers");
  return { ok: true, message: "Subscriber removed." };
}
