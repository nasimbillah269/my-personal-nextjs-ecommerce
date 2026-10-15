"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/db";
import { PAGE_TEMPLATES, RESERVED_PAGE_SLUGS } from "@/lib/constants";
import { requireAdmin } from "../auth";
import { deleteImage, saveImage, validateImage } from "../uploads";
import { firstErrors, type FormState } from "./form-state";

const { pages } = schema;

const pageSchema = z.object({
  title: z.string().trim().min(2, "Page name is required").max(255),
  slug: z
    .string()
    .trim()
    .min(2, "Slug is required")
    .max(160)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes only")
    .refine((s) => !RESERVED_PAGE_SLUGS.includes(s), "This address is used by the store — pick another slug"),
  shortDescription: z.string().trim().max(500, "Keep it under 500 characters"),
  content: z.string().trim().min(10, "Write the page content (10+ characters)").max(60000),
  template: z.enum(PAGE_TEMPLATES),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
  // <input type="datetime-local"> sends "YYYY-MM-DDTHH:mm" in the admin's clock; the store runs on Dhaka time.
  publishedAt: z.preprocess((v) => (v ? new Date(`${v}:00+06:00`) : null), z.date("Enter a valid date").nullable()),
  metaTitle: z.string().trim().max(255),
  metaDescription: z.string().trim().max(500, "Keep it under 500 characters"),
  metaKeywords: z.string().trim().max(500),
  sortOrder: z.coerce.number().int().min(0).max(10000),
});

function revalidatePages(slug?: string) {
  revalidatePath("/admin/pages");
  // Featured pages appear in the footer on every store page.
  revalidatePath("/", "layout");
  if (slug) revalidatePath(`/${slug}`);
}

function uploadedFile(formData: FormData, name: string) {
  const f = formData.get(name);
  return f instanceof File && f.size > 0 ? f : null;
}

export async function savePage(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin("pages");
  const id = Number(formData.get("id")) || null;
  const parsed = pageSchema.safeParse({
    ...Object.fromEntries(formData),
    isActive: formData.get("isActive") === "on",
    isFeatured: formData.get("isFeatured") === "on",
  });
  const errors = parsed.success ? {} : firstErrors(parsed.error);

  const newImage = uploadedFile(formData, "image");
  const newBanner = uploadedFile(formData, "banner");
  for (const [key, file] of [["image", newImage], ["banner", newBanner]] as const) {
    const error = file && validateImage(file);
    if (error) errors[key] = error;
  }
  if (!parsed.success || Object.keys(errors).length) {
    return { ok: false, message: "Please fix the highlighted fields.", errors };
  }
  const data = parsed.data;

  const [clash] = await db
    .select({ id: pages.id })
    .from(pages)
    .where(id ? and(eq(pages.slug, data.slug), ne(pages.id, id)) : eq(pages.slug, data.slug))
    .limit(1);
  if (clash) return { ok: false, message: "Please fix the highlighted fields.", errors: { slug: "Another page already uses this slug." } };

  const existing = id
    ? (await db.select({ image: pages.image, banner: pages.banner, slug: pages.slug, publishedAt: pages.publishedAt }).from(pages).where(eq(pages.id, id)).limit(1))[0]
    : null;
  if (id && !existing) return { ok: false, message: "This page no longer exists." };

  const pick = async (file: File | null, removeKey: string, current: string | null) =>
    file ? saveImage(file, "pages") : formData.get(removeKey) === "on" ? null : current;
  const image = await pick(newImage, "removeImage", existing?.image ?? null);
  const banner = await pick(newBanner, "removeBanner", existing?.banner ?? null);

  // Activating without a date stamps it now, so "Published date" always means something.
  const publishedAt = data.publishedAt ?? existing?.publishedAt ?? (data.isActive ? new Date() : null);
  const values = { ...data, image, banner, publishedAt };

  let pageId = id;
  if (id) await db.update(pages).set(values).where(eq(pages.id, id));
  else [{ id: pageId }] = await db.insert(pages).values({ ...values, authorId: admin.id }).$returningId();

  for (const [old, now] of [[existing?.image, image], [existing?.banner, banner]] as const) {
    if (old && old !== now) await deleteImage(old);
  }

  revalidatePages(data.slug);
  if (existing && existing.slug !== data.slug) revalidatePath(`/${existing.slug}`);
  revalidatePath(`/admin/pages/${pageId}`);
  return { ok: true, message: id ? "Page updated." : "Page created.", id: pageId! };
}

export async function deletePage(id: number): Promise<FormState> {
  await requireAdmin("pages");
  const [row] = await db.select({ image: pages.image, banner: pages.banner, slug: pages.slug }).from(pages).where(eq(pages.id, id)).limit(1);
  if (!row) return { ok: false, message: "Page not found." };
  await db.delete(pages).where(eq(pages.id, id));
  await deleteImage(row.image);
  await deleteImage(row.banner);
  revalidatePages(row.slug);
  return { ok: true, message: "Page deleted." };
}

export async function setPageFlag(id: number, flag: "isActive" | "isFeatured", value: boolean): Promise<FormState> {
  await requireAdmin("pages");
  const [row] = await db.select({ slug: pages.slug, publishedAt: pages.publishedAt }).from(pages).where(eq(pages.id, id)).limit(1);
  if (!row) return { ok: false, message: "Page not found." };
  const extra = flag === "isActive" && value && !row.publishedAt ? { publishedAt: new Date() } : {};
  await db.update(pages).set({ [flag]: value, ...extra }).where(eq(pages.id, id));
  revalidatePages(row.slug);
  const messages = {
    isActive: value ? "Page is now live." : "Page hidden from the store.",
    isFeatured: value ? "Page added to the footer." : "Page removed from the footer.",
  };
  return { ok: true, message: messages[flag] };
}
