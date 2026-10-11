"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/db";
import { requireAdmin } from "../auth";
import { deleteImage, saveImage, validateImage } from "../uploads";
import { firstErrors, type FormState } from "./form-state";

const sliderSchema = z.object({
  title: z.string().trim().min(2, "Title is required").max(120),
  // Internal paths ("/products?category=oils") or full https:// links.
  link: z
    .string()
    .trim()
    .max(500)
    .refine((v) => !v || /^\/(?!\/)/.test(v) || /^https?:\/\//.test(v), "Use a path like /products or a full https:// link")
    .transform((v) => v || null),
  sortOrder: z.coerce.number().int().min(0).max(10000),
  isActive: z.boolean(),
});

function revalidate() {
  revalidatePath("/admin/sliders");
  revalidatePath("/");
}

export async function saveSlider(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const id = Number(formData.get("id")) || null;
  const parsed = sliderSchema.safeParse({ ...Object.fromEntries(formData), isActive: formData.get("isActive") === "on" });
  const errors = parsed.success ? {} : firstErrors(parsed.error);

  const image = formData.get("image");
  const newImage = image instanceof File && image.size > 0 ? image : null;
  if (newImage) {
    const imageError = validateImage(newImage);
    if (imageError) errors.image = imageError;
  } else if (!id) {
    errors.image = "Upload a slider image.";
  }

  if (!parsed.success || Object.keys(errors).length) {
    return { ok: false, message: "Please fix the highlighted fields.", errors };
  }

  const s = schema.sliders;
  const existing = id ? (await db.select({ image: s.image }).from(s).where(eq(s.id, id)).limit(1))[0] : null;
  if (id && !existing) return { ok: false, message: "This slider no longer exists." };

  const imageUrl = newImage ? await saveImage(newImage, "sliders") : existing!.image;
  const values = { ...parsed.data, image: imageUrl };

  if (id) await db.update(s).set(values).where(eq(s.id, id));
  else await db.insert(s).values(values);

  if (existing && existing.image !== imageUrl) await deleteImage(existing.image);

  revalidate();
  return { ok: true, message: id ? "Slider updated." : "Slider added." };
}

export async function deleteSlider(id: number): Promise<FormState> {
  await requireAdmin();
  const s = schema.sliders;
  const [row] = await db.select({ image: s.image }).from(s).where(eq(s.id, id)).limit(1);
  if (!row) return { ok: false, message: "Slider not found." };
  await db.delete(s).where(eq(s.id, id));
  await deleteImage(row.image);
  revalidate();
  return { ok: true, message: "Slider deleted." };
}

export async function setSliderActive(id: number, isActive: boolean): Promise<FormState> {
  await requireAdmin();
  await db.update(schema.sliders).set({ isActive }).where(eq(schema.sliders.id, id));
  revalidate();
  return { ok: true, message: isActive ? "Slider is now shown on the home page." : "Slider hidden from the home page." };
}
