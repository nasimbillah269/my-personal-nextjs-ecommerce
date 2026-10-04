"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/db";
import { requireAdmin } from "../auth";
import { deleteImage, saveImage, validateImage } from "../uploads";
import { firstErrors, type FormState } from "./form-state";

const variantSchema = z.object({
  label: z.string().trim().min(1, "Variant name is required").max(60),
  price: z.number().int().min(1, "Enter a sale price for every option").max(10_000_000),
  oldPrice: z.number().int().min(0).max(10_000_000).nullable(),
});

const productSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(255),
  slug: z
    .string()
    .trim()
    .min(2, "Slug is required")
    .max(160)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes only"),
  categoryId: z.coerce.number().int().positive("Choose a category"),
  summary: z.string().trim().min(10, "Write a short summary (10+ characters)").max(2000),
  description: z.string().max(20000),
  stock: z.coerce.number().int("Whole numbers only").min(0, "Stock can’t be negative").max(1_000_000),
  emoji: z.string().trim().min(1).max(16),
  tint: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Pick a colour"),
  tags: z.string().trim().max(500),
  imageCredit: z
    .string()
    .trim()
    .max(300)
    .transform((v) => v || null),
  imageCreditUrl: z
    .union([z.literal(""), z.url("Enter a full link starting with https://").max(500)])
    .transform((v) => v || null),
  brand: z.string().trim().min(1).max(120),
  origin: z.string().trim().min(1).max(120),
  sortOrder: z.coerce.number().int().min(0).max(100000),
  isActive: z.boolean(),
  isPopular: z.boolean(),
  isDailyBest: z.boolean(),
});

function parseVariants(raw: FormDataEntryValue | null) {
  try {
    const data = JSON.parse(String(raw ?? "[]"));
    return z.array(variantSchema).min(1, "Add at least one price option").max(20).safeParse(data);
  } catch {
    return z.array(variantSchema).min(1).safeParse([]);
  }
}

export async function saveProduct(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();

  const id = Number(formData.get("id")) || null;
  const parsed = productSchema.safeParse({
    ...Object.fromEntries(formData),
    isActive: formData.get("isActive") === "on",
    isPopular: formData.get("isPopular") === "on",
    isDailyBest: formData.get("isDailyBest") === "on",
  });
  const variants = parseVariants(formData.get("variants"));

  const errors = parsed.success ? {} : firstErrors(parsed.error);
  if (!variants.success) errors.variants = variants.error.issues[0]?.message ?? "Check the price options";
  else if (variants.data.some((v) => v.oldPrice !== null && v.oldPrice <= v.price)) {
    errors.variants = "“Regular price” must be higher than the sale price, or left empty.";
  } else if (new Set(variants.data.map((v) => v.label.toLowerCase())).size !== variants.data.length) {
    errors.variants = "Each price option needs a different name.";
  }

  const image = formData.get("image");
  const newImage = image instanceof File && image.size > 0 ? image : null;
  if (newImage) {
    const imageError = validateImage(newImage);
    if (imageError) errors.image = imageError;
  }

  if (!parsed.success || Object.keys(errors).length) {
    return { ok: false, message: "Please fix the highlighted fields.", errors };
  }
  const data = parsed.data;

  const [clash] = await db
    .select({ id: schema.products.id })
    .from(schema.products)
    .where(id ? and(eq(schema.products.slug, data.slug), ne(schema.products.id, id)) : eq(schema.products.slug, data.slug))
    .limit(1);
  if (clash) return { ok: false, message: "Please fix the highlighted fields.", errors: { slug: "Another product already uses this URL slug." } };

  const existing = id
    ? (await db.select({ image: schema.products.image }).from(schema.products).where(eq(schema.products.id, id)).limit(1))[0]
    : null;
  if (id && !existing) return { ok: false, message: "This product no longer exists." };

  let imageUrl = existing?.image ?? null;
  if (newImage) imageUrl = await saveImage(newImage, "products");
  else if (formData.get("removeImage") === "on") imageUrl = null;

  const values = { ...data, image: imageUrl };
  let productId = id;
  await db.transaction(async (tx) => {
    if (productId) {
      await tx.update(schema.products).set(values).where(eq(schema.products.id, productId));
      await tx.delete(schema.productVariants).where(eq(schema.productVariants.productId, productId));
    } else {
      [{ id: productId }] = await tx.insert(schema.products).values(values).$returningId();
    }
    await tx.insert(schema.productVariants).values(
      variants.data!.map((v, sortOrder) => ({ productId: productId!, label: v.label, price: v.price, oldPrice: v.oldPrice, sortOrder })),
    );
  });

  if (existing?.image && existing.image !== imageUrl) await deleteImage(existing.image);

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}`);
  return { ok: true, message: id ? "Product updated." : "Product created.", id: productId! };
}

export async function deleteProduct(id: number): Promise<FormState> {
  await requireAdmin();
  const [row] = await db.select({ image: schema.products.image }).from(schema.products).where(eq(schema.products.id, id)).limit(1);
  if (!row) return { ok: false, message: "Product not found." };
  await db.delete(schema.products).where(eq(schema.products.id, id));
  await deleteImage(row.image);
  revalidatePath("/admin/products");
  return { ok: true, message: "Product deleted." };
}

export async function setProductActive(id: number, isActive: boolean): Promise<FormState> {
  await requireAdmin();
  await db.update(schema.products).set({ isActive }).where(eq(schema.products.id, id));
  revalidatePath("/admin/products");
  return { ok: true, message: isActive ? "Product is now visible in the store." : "Product hidden from the store." };
}
