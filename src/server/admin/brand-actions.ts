"use server";

import { and, eq, ne, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/db";
import { slugify } from "@/lib/post-content";
import { requireAdmin } from "../auth";
import { deleteImage, saveImage, validateImage } from "../uploads";
import { firstErrors, type FormState } from "./form-state";

const { brands, products } = schema;

const brandSchema = z.object({
  // products.brand is varchar(120), so a brand name has to fit there too.
  name: z.string().trim().min(2, "Brand name is required").max(120),
  slug: z
    .string()
    .trim()
    .max(140)
    .regex(/^([a-z0-9]+(?:-[a-z0-9]+)*)?$/, "Use lowercase letters, numbers and dashes only"),
  website: z
    .string()
    .trim()
    .max(500)
    .refine((v) => !v || /^https?:\/\/\S+$/.test(v), "Use a full link like https://example.com")
    .transform((v) => v || null),
  description: z.string().trim().max(500, "Keep it under 500 characters"),
  sortOrder: z.coerce.number().int().min(0).max(10000),
  isActive: z.boolean(),
});

function revalidate() {
  revalidatePath("/admin/brands");
  revalidatePath("/admin/products");
  revalidatePath("/", "layout");
}

export async function saveBrand(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin("brands");
  const id = Number(formData.get("id")) || null;
  const parsed = brandSchema.safeParse({
    name: formData.get("name") ?? "",
    slug: formData.get("slug") ?? "",
    website: formData.get("website") ?? "",
    description: formData.get("description") ?? "",
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
  const data = { ...parsed.data, slug: parsed.data.slug || slugify(parsed.data.name, 140) };
  if (!data.slug) return { ok: false, message: "Please fix the highlighted fields.", errors: { slug: "Enter a slug." } };

  const clashes = await db
    .select({ name: brands.name, slug: brands.slug })
    .from(brands)
    .where(and(or(eq(brands.name, data.name), eq(brands.slug, data.slug)), id ? ne(brands.id, id) : undefined));
  if (clashes.length) {
    const clashErrors: Record<string, string> = {};
    if (clashes.some((c) => c.name.toLowerCase() === data.name.toLowerCase())) clashErrors.name = "Another brand already has this name.";
    if (clashes.some((c) => c.slug === data.slug)) clashErrors.slug = "Another brand already uses this slug.";
    return { ok: false, message: "Please fix the highlighted fields.", errors: clashErrors };
  }

  const existing = id ? (await db.select({ logo: brands.logo, name: brands.name }).from(brands).where(eq(brands.id, id)).limit(1))[0] : null;
  if (id && !existing) return { ok: false, message: "This brand no longer exists." };

  const logo = newLogo ? await saveImage(newLogo, "brands") : formData.get("removeLogo") === "on" ? null : (existing?.logo ?? null);
  const values = { ...data, logo };

  if (id) {
    await db.transaction(async (tx) => {
      await tx.update(brands).set(values).where(eq(brands.id, id));
      // Products keep the brand as text, so a rename carries over to them.
      if (existing && existing.name !== data.name) {
        await tx.update(products).set({ brand: data.name }).where(eq(products.brand, existing.name));
      }
    });
  } else {
    await db.insert(brands).values(values);
  }

  if (existing?.logo && existing.logo !== logo) await deleteImage(existing.logo);

  revalidate();
  return { ok: true, message: id ? "Brand updated." : "Brand added." };
}

export async function deleteBrand(id: number): Promise<FormState> {
  await requireAdmin("brands");
  const [row] = await db.select({ logo: brands.logo }).from(brands).where(eq(brands.id, id)).limit(1);
  if (!row) return { ok: false, message: "Brand not found." };
  // Products keep their brand text; it just stops being suggested in the product form.
  await db.delete(brands).where(eq(brands.id, id));
  await deleteImage(row.logo);
  revalidate();
  return { ok: true, message: "Brand deleted." };
}

export async function setBrandActive(id: number, isActive: boolean): Promise<FormState> {
  await requireAdmin("brands");
  await db.update(brands).set({ isActive }).where(eq(brands.id, id));
  revalidate();
  return { ok: true, message: isActive ? "Brand is now active." : "Brand deactivated." };
}
