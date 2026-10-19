"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/db";
import { requireAdmin } from "../auth";
import { deleteImage, saveImage, validateImage } from "../uploads";
import { firstErrors, type FormState } from "./form-state";

const { clients } = schema;

const clientSchema = z.object({
  name: z.string().trim().min(2, "Client name is required").max(160),
  website: z
    .string()
    .trim()
    .max(500)
    .refine((v) => !v || /^https?:\/\/\S+$/.test(v), "Use a full link like https://example.com")
    .transform((v) => v || null),
  sortOrder: z.coerce.number().int().min(0).max(10000),
  isActive: z.boolean(),
});

function revalidate() {
  revalidatePath("/admin/clients");
  revalidatePath("/", "layout");
}

export async function saveClient(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin("clients");
  const id = Number(formData.get("id")) || null;
  const parsed = clientSchema.safeParse({
    name: formData.get("name") ?? "",
    website: formData.get("website") ?? "",
    sortOrder: formData.get("sortOrder") || 0,
    isActive: formData.get("isActive") === "on",
  });
  const errors = parsed.success ? {} : firstErrors(parsed.error);

  const file = formData.get("logo");
  const newLogo = file instanceof File && file.size > 0 ? file : null;
  const logoError = newLogo && validateImage(newLogo);
  if (logoError) errors.logo = logoError;

  if (!parsed.success || Object.keys(errors).length) {
    return { ok: false, message: "Please fix the highlighted fields.", errors };
  }

  const existing = id ? (await db.select({ logo: clients.logo }).from(clients).where(eq(clients.id, id)).limit(1))[0] : null;
  if (id && !existing) return { ok: false, message: "This client no longer exists." };

  const logo = newLogo ? await saveImage(newLogo, "clients") : formData.get("removeLogo") === "on" ? null : (existing?.logo ?? null);
  const values = { ...parsed.data, logo };

  if (id) await db.update(clients).set(values).where(eq(clients.id, id));
  else await db.insert(clients).values(values);

  if (existing?.logo && existing.logo !== logo) await deleteImage(existing.logo);

  revalidate();
  return { ok: true, message: id ? "Client updated." : "Client added." };
}

export async function deleteClient(id: number): Promise<FormState> {
  await requireAdmin("clients");
  const [row] = await db.select({ logo: clients.logo }).from(clients).where(eq(clients.id, id)).limit(1);
  if (!row) return { ok: false, message: "Client not found." };
  await db.delete(clients).where(eq(clients.id, id));
  await deleteImage(row.logo);
  revalidate();
  return { ok: true, message: "Client deleted." };
}

export async function setClientActive(id: number, isActive: boolean): Promise<FormState> {
  await requireAdmin("clients");
  await db.update(clients).set({ isActive }).where(eq(clients.id, id));
  revalidate();
  return { ok: true, message: isActive ? "Client is now shown." : "Client hidden." };
}
