"use server";

import { and, asc, eq, max } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/db";
import { GALLERY_LOCATIONS } from "@/lib/constants";
import { requireAdmin } from "../auth";
import { deleteImage, GALLERY_IMAGE_TYPES, saveImage, validateImage } from "../uploads";
import { firstErrors, type FormState } from "./form-state";

const { galleries, galleryImages } = schema;

const gallerySchema = z.object({
  name: z.string().trim().min(2, "Gallery name is required").max(160),
  location: z
    .union([z.enum(GALLERY_LOCATIONS), z.literal("")])
    .transform((v) => v || null),
  description: z.string().trim().max(5000, "Keep it under 5000 characters"),
  isActive: z.boolean(),
});

const galleryImageOptions = { types: GALLERY_IMAGE_TYPES, typesLabel: "JPG, PNG, WEBP, AVIF or GIF" };

function revalidate(id?: number | null) {
  revalidatePath("/admin/galleries");
  if (id) revalidatePath(`/admin/galleries/${id}`);
  // Galleries can appear on any store page (home, about, footer…).
  revalidatePath("/", "layout");
}

export async function saveGallery(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin("galleries");
  const id = Number(formData.get("id")) || null;
  const parsed = gallerySchema.safeParse({
    name: formData.get("name") ?? "",
    location: formData.get("location") ?? "",
    description: formData.get("description") ?? "",
    isActive: formData.get("isActive") === "active",
  });
  const errors = parsed.success ? {} : firstErrors(parsed.error);

  const file = formData.get("featuredImage");
  const newImage = file instanceof File && file.size > 0 ? file : null;
  const imageError = newImage && validateImage(newImage, galleryImageOptions);
  if (imageError) errors.featuredImage = imageError;

  if (!parsed.success || Object.keys(errors).length) {
    return { ok: false, message: "Please fix the highlighted fields.", errors };
  }
  const data = parsed.data;

  const existing = id ? (await db.select({ featuredImage: galleries.featuredImage }).from(galleries).where(eq(galleries.id, id)).limit(1))[0] : null;
  if (id && !existing) return { ok: false, message: "This gallery no longer exists." };

  const featuredImage = newImage
    ? await saveImage(newImage, "galleries")
    : formData.get("removeFeaturedImage") === "on"
      ? null
      : (existing?.featuredImage ?? null);
  const values = { ...data, description: data.description || null, featuredImage };

  let galleryId = id;
  if (id) await db.update(galleries).set(values).where(eq(galleries.id, id));
  else [{ id: galleryId }] = await db.insert(galleries).values({ ...values, createdBy: admin.id }).$returningId();

  if (existing?.featuredImage && existing.featuredImage !== featuredImage) await deleteImage(existing.featuredImage);

  revalidate(galleryId);
  return { ok: true, message: id ? "Gallery updated." : "Gallery created.", id: galleryId! };
}

export async function deleteGallery(id: number): Promise<FormState> {
  await requireAdmin("galleries");
  const [row] = await db.select({ featuredImage: galleries.featuredImage }).from(galleries).where(eq(galleries.id, id)).limit(1);
  if (!row) return { ok: false, message: "Gallery not found." };
  const images = await db.select({ image: galleryImages.image }).from(galleryImages).where(eq(galleryImages.galleryId, id));
  // gallery_images rows go with it (ON DELETE CASCADE); the files have to be removed by hand.
  await db.delete(galleries).where(eq(galleries.id, id));
  await deleteImage(row.featuredImage);
  for (const img of images) await deleteImage(img.image);
  revalidate();
  return { ok: true, message: "Gallery deleted." };
}

export async function setGalleryActive(id: number, isActive: boolean): Promise<FormState> {
  await requireAdmin("galleries");
  await db.update(galleries).set({ isActive }).where(eq(galleries.id, id));
  revalidate(id);
  return { ok: true, message: isActive ? "Gallery is now active." : "Gallery deactivated." };
}

/**
 * Adds one photo to a gallery. The client calls this once per selected file, so each request
 * stays under the server action body limit (see next.config.ts) however many files are picked.
 */
export async function uploadGalleryImage(galleryId: number, formData: FormData): Promise<FormState> {
  await requireAdmin("galleries");
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) return { ok: false, message: "Choose an image to upload." };
  const error = validateImage(file, galleryImageOptions);
  if (error) return { ok: false, message: `${file.name}: ${error}` };

  const [gallery] = await db.select({ id: galleries.id }).from(galleries).where(eq(galleries.id, galleryId)).limit(1);
  if (!gallery) return { ok: false, message: "This gallery no longer exists." };

  const [{ last }] = await db.select({ last: max(galleryImages.sortOrder) }).from(galleryImages).where(eq(galleryImages.galleryId, galleryId));
  const image = await saveImage(file, "galleries");
  const [{ id }] = await db
    .insert(galleryImages)
    .values({ galleryId, image, sortOrder: (last ?? -1) + 1 })
    .$returningId();

  revalidate(galleryId);
  return { ok: true, message: "Image uploaded.", id };
}

export async function deleteGalleryImage(id: number): Promise<FormState> {
  await requireAdmin("galleries");
  const [row] = await db.select({ image: galleryImages.image, galleryId: galleryImages.galleryId }).from(galleryImages).where(eq(galleryImages.id, id)).limit(1);
  if (!row) return { ok: false, message: "Image not found." };
  await db.delete(galleryImages).where(eq(galleryImages.id, id));
  await deleteImage(row.image);
  revalidate(row.galleryId);
  return { ok: true, message: "Image removed." };
}

export async function updateGalleryImageCaption(id: number, caption: string): Promise<FormState> {
  await requireAdmin("galleries");
  const value = caption.trim().slice(0, 255);
  const [row] = await db.select({ galleryId: galleryImages.galleryId }).from(galleryImages).where(eq(galleryImages.id, id)).limit(1);
  if (!row) return { ok: false, message: "Image not found." };
  await db.update(galleryImages).set({ caption: value }).where(eq(galleryImages.id, id));
  revalidate(row.galleryId);
  return { ok: true, message: "Caption saved." };
}

/** Saves a new photo order; `ids` lists every photo of the gallery, first to last. */
export async function reorderGalleryImages(galleryId: number, ids: number[]): Promise<FormState> {
  await requireAdmin("galleries");
  const rows = await db
    .select({ id: galleryImages.id })
    .from(galleryImages)
    .where(eq(galleryImages.galleryId, galleryId))
    .orderBy(asc(galleryImages.sortOrder));
  const known = new Set(rows.map((r) => r.id));
  if (ids.length !== known.size || !ids.every((id) => known.has(id))) {
    return { ok: false, message: "The gallery changed — reload and try again." };
  }
  await db.transaction(async (tx) => {
    for (const [i, id] of ids.entries()) {
      await tx
        .update(galleryImages)
        .set({ sortOrder: i })
        .where(and(eq(galleryImages.id, id), eq(galleryImages.galleryId, galleryId)));
    }
  });
  revalidate(galleryId);
  return { ok: true, message: "Order saved." };
}
