"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ImagePlus, Info, Loader2, Plus, Save, Trash2, X } from "lucide-react";
import type { FormState } from "@/server/admin/form-state";
import { saveProduct } from "@/server/admin/product-actions";
import { useFormAction } from "./controls";
import { btnPrimary, btnSecondary, Card, Field, inputCls } from "./ui";

type VariantInput = { label: string; price: string; oldPrice: string };

export type ProductFormValues = {
  id?: number;
  name: string;
  slug: string;
  categoryId: number | "";
  summary: string;
  description: string;
  stock: number;
  image: string | null;
  imageCredit: string;
  imageCreditUrl: string;
  emoji: string;
  tint: string;
  tags: string;
  brand: string;
  origin: string;
  sortOrder: number;
  isActive: boolean;
  isPopular: boolean;
  isDailyBest: boolean;
  variants: { label: string; price: number; oldPrice: number | null }[];
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 160);

function Toggle({ name, label, hint, defaultChecked }: { name: string; label: string; hint: string; defaultChecked: boolean }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 py-3">
      <span>
        <span className="block text-sm font-bold text-heading">{label}</span>
        <span className="text-xs text-body">{hint}</span>
      </span>
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input type="checkbox" name={name} defaultChecked={defaultChecked} className="peer sr-only" />
        <span className="h-6 w-11 rounded-full bg-line transition peer-checked:bg-brand peer-focus-visible:ring-4 peer-focus-visible:ring-brand-light" />
        <span className="absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

export function ProductForm({
  initial,
  categories,
}: {
  initial: ProductFormValues;
  categories: { id: number; name: string }[];
}) {
  const router = useRouter();
  const { state, onSubmit, pending } = useFormAction<FormState>(saveProduct, null);
  const errors = state?.errors ?? {};
  const isNew = !initial.id;

  const [name, setName] = useState(initial.name);
  const [slug, setSlug] = useState(initial.slug);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [emoji, setEmoji] = useState(initial.emoji);
  const [tint, setTint] = useState(initial.tint);
  const [preview, setPreview] = useState<string | null>(initial.image);
  const [removeImage, setRemoveImage] = useState(false);
  const [credit, setCredit] = useState({ text: initial.imageCredit, url: initial.imageCreditUrl });
  const [variants, setVariants] = useState<VariantInput[]>(
    initial.variants.length
      ? initial.variants.map((v) => ({ label: v.label, price: String(v.price), oldPrice: v.oldPrice ? String(v.oldPrice) : "" }))
      : [{ label: "Regular", price: "", oldPrice: "" }],
  );

  // After creating a product, move to its edit page.
  useEffect(() => {
    if (state?.ok && isNew && state.id) router.replace(`/admin/products/${state.id}`);
  }, [state, isNew, router]);

  const variantJson = JSON.stringify(
    variants.map((v) => ({
      label: v.label.trim(),
      price: Math.round(Number(v.price) || 0),
      oldPrice: v.oldPrice.trim() ? Math.round(Number(v.oldPrice)) : null,
    })),
  );

  const updateVariant = (i: number, key: keyof VariantInput, value: string) =>
    setVariants((vs) => vs.map((v, j) => (j === i ? { ...v, [key]: value } : v)));

  const saveButton = (
    <button type="submit" disabled={pending} className={btnPrimary}>
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
      {isNew ? "Create product" : "Save changes"}
    </button>
  );

  return (
    <form onSubmit={onSubmit} encType="multipart/form-data" noValidate>
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      <input type="hidden" name="variants" value={variantJson} />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-heading">{isNew ? "Add product" : "Edit product"}</h1>
          {!isNew && (
            <Link href={`/products/${initial.slug}`} target="_blank" className="text-sm font-semibold text-brand hover:underline">
              View in store ↗
            </Link>
          )}
        </div>
        <div className="flex gap-2">
          <Link href="/admin/products" className={btnSecondary}>
            Cancel
          </Link>
          {saveButton}
        </div>
      </div>

      {state && !state.ok && state.errors && (
        <p role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">
          {state.message}
        </p>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Card title="Basic information">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Product name" htmlFor="name" error={errors.name} className="sm:col-span-2">
                <input
                  id="name"
                  name="name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!slugTouched) setSlug(slugify(e.target.value));
                  }}
                  aria-invalid={!!errors.name}
                  className={inputCls}
                  placeholder="e.g. Organic Raw Honey"
                />
              </Field>
              <Field label="URL slug" htmlFor="slug" error={errors.slug} hint={`/products/${slug || "…"}`} className="sm:col-span-2">
                <input
                  id="slug"
                  name="slug"
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value);
                    setSlugTouched(true);
                  }}
                  aria-invalid={!!errors.slug}
                  className={`${inputCls} font-mono`}
                />
              </Field>
              <Field label="Short summary" htmlFor="summary" error={errors.summary} hint="Shown next to the price on the product page." className="sm:col-span-2">
                <textarea
                  id="summary"
                  name="summary"
                  rows={3}
                  defaultValue={initial.summary}
                  aria-invalid={!!errors.summary}
                  className={`${inputCls} h-auto resize-y py-2.5 font-bangla`}
                />
              </Field>
            </div>
          </Card>

          <Card title="Description">
            <Field label="Full description" htmlFor="description" error={errors.description}>
              <textarea
                id="description"
                name="description"
                rows={14}
                defaultValue={initial.description}
                className={`${inputCls} h-auto resize-y py-2.5 font-mono text-[13px] leading-6`}
              />
            </Field>
            <div className="mt-3 flex gap-2 rounded-lg bg-soft p-3 text-xs leading-5 text-body">
              <Info className="mt-0.5 size-4 shrink-0 text-brand" />
              <p>
                Formatting: <code className="font-bold text-heading">## Heading</code> starts a section,{" "}
                <code className="font-bold text-heading">### Title</code> + next line makes a highlighted point,{" "}
                <code className="font-bold text-heading">- item</code> makes a bullet. Other lines are paragraphs.
              </p>
            </div>
          </Card>

          <Card title="Pricing & options">
            <div className="space-y-3">
              <div className="hidden grid-cols-[1fr_130px_130px_40px] gap-3 text-xs font-bold text-body uppercase sm:grid">
                <span>Option (size / weight)</span>
                <span>Sale price ৳</span>
                <span>Regular price ৳</span>
                <span />
              </div>
              {variants.map((v, i) => (
                <div key={i} className="grid grid-cols-2 gap-3 rounded-xl border border-line p-3 sm:grid-cols-[1fr_130px_130px_40px] sm:border-0 sm:p-0">
                  <input
                    aria-label="Option name"
                    value={v.label}
                    onChange={(e) => updateVariant(i, "label", e.target.value)}
                    placeholder="e.g. 500 ML"
                    className={`${inputCls} col-span-2 sm:col-span-1`}
                  />
                  <input
                    aria-label="Sale price"
                    inputMode="numeric"
                    value={v.price}
                    onChange={(e) => updateVariant(i, "price", e.target.value.replace(/[^\d]/g, ""))}
                    placeholder="Price"
                    className={inputCls}
                  />
                  <input
                    aria-label="Regular price (optional)"
                    inputMode="numeric"
                    value={v.oldPrice}
                    onChange={(e) => updateVariant(i, "oldPrice", e.target.value.replace(/[^\d]/g, ""))}
                    placeholder="Optional"
                    className={inputCls}
                  />
                  <button
                    type="button"
                    onClick={() => setVariants((vs) => vs.filter((_, j) => j !== i))}
                    disabled={variants.length === 1}
                    aria-label="Remove option"
                    className="col-span-2 grid h-11 place-items-center rounded-lg text-body transition hover:bg-red-50 hover:text-red-500 disabled:opacity-30 sm:col-span-1"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
              {errors.variants && <p className="text-xs font-semibold text-red-500">{errors.variants}</p>}
              <button
                type="button"
                onClick={() => setVariants((vs) => [...vs, { label: "", price: "", oldPrice: "" }])}
                className="inline-flex items-center gap-1.5 text-sm font-bold text-brand hover:underline"
              >
                <Plus className="size-4" /> Add option
              </button>
              <p className="text-xs text-body">
                The first option is the default price on product cards. Fill “Regular price” to show a discount badge.
              </p>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Visibility">
            <div className="-my-3 divide-y divide-line">
              <Toggle name="isActive" label="Visible in store" hint="Hidden products can’t be ordered." defaultChecked={initial.isActive} />
              <Toggle name="isPopular" label="Popular product" hint="Show in “Popular Products” on the homepage." defaultChecked={initial.isPopular} />
              <Toggle name="isDailyBest" label="Daily best sell" hint="Show in the “Daily Best Sells” carousel." defaultChecked={initial.isDailyBest} />
            </div>
          </Card>

          <Card title="Inventory & organisation">
            <div className="space-y-4">
              <Field label="Category" htmlFor="categoryId" error={errors.categoryId}>
                <select id="categoryId" name="categoryId" defaultValue={initial.categoryId} aria-invalid={!!errors.categoryId} className={`${inputCls} cursor-pointer`}>
                  <option value="">Choose a category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Stock" htmlFor="stock" error={errors.stock}>
                  <input id="stock" name="stock" type="number" min={0} defaultValue={initial.stock} aria-invalid={!!errors.stock} className={inputCls} />
                </Field>
                <Field label="Sort order" htmlFor="sortOrder" error={errors.sortOrder}>
                  <input id="sortOrder" name="sortOrder" type="number" min={0} defaultValue={initial.sortOrder} className={inputCls} />
                </Field>
              </div>
              <Field label="Tags" htmlFor="tags" hint="Comma separated" error={errors.tags}>
                <input id="tags" name="tags" defaultValue={initial.tags} className={inputCls} placeholder="organic, honey" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Brand" htmlFor="brand" error={errors.brand}>
                  <input id="brand" name="brand" defaultValue={initial.brand} className={inputCls} />
                </Field>
                <Field label="Origin" htmlFor="origin" error={errors.origin}>
                  <input id="origin" name="origin" defaultValue={initial.origin} className={inputCls} />
                </Field>
              </div>
            </div>
          </Card>

          <Card title="Media">
            <div className="flex items-start gap-4">
              <span className="relative grid size-24 shrink-0 place-items-center overflow-hidden rounded-xl border border-line" style={{ background: tint }}>
                {preview && !removeImage ? (
                  <Image src={preview} alt="Product preview" fill sizes="96px" unoptimized className="object-cover" />
                ) : (
                  <span className="text-4xl">{emoji}</span>
                )}
              </span>
              <div className="min-w-0 flex-1 space-y-2">
                <label className={`${btnSecondary} w-full cursor-pointer`}>
                  <ImagePlus className="size-4" /> Upload image
                  <input
                    type="file"
                    name="image"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setPreview(URL.createObjectURL(file));
                        setRemoveImage(false);
                        // A new photo needs its own credit (or none if it's yours).
                        setCredit({ text: "", url: "" });
                      }
                    }}
                  />
                </label>
                {preview && !removeImage && (
                  <button
                    type="button"
                    onClick={() => {
                      setRemoveImage(true);
                      setCredit({ text: "", url: "" });
                    }}
                    className="inline-flex items-center gap-1 text-xs font-bold text-red-500 hover:underline"
                  >
                    <X className="size-3.5" /> Remove image
                  </button>
                )}
                <input type="hidden" name="removeImage" value={removeImage ? "on" : ""} />
                <p className="text-xs text-body">JPG, PNG, WEBP or AVIF · max 3 MB · square works best.</p>
                {errors.image && <p className="text-xs font-semibold text-red-500">{errors.image}</p>}
              </div>
            </div>
            <div className="mt-4 space-y-3">
              <Field label="Photo credit" htmlFor="imageCredit" hint="Only for photos you didn’t take, e.g. “Title” by Author · CC BY 2.0" error={errors.imageCredit}>
                <input
                  id="imageCredit"
                  name="imageCredit"
                  value={credit.text}
                  onChange={(e) => setCredit((c) => ({ ...c, text: e.target.value }))}
                  className={inputCls}
                />
              </Field>
              <Field label="Credit link" htmlFor="imageCreditUrl" error={errors.imageCreditUrl}>
                <input
                  id="imageCreditUrl"
                  name="imageCreditUrl"
                  type="url"
                  value={credit.url}
                  onChange={(e) => setCredit((c) => ({ ...c, url: e.target.value }))}
                  placeholder="https://"
                  aria-invalid={!!errors.imageCreditUrl}
                  className={inputCls}
                />
              </Field>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Field label="Fallback emoji" htmlFor="emoji" hint="Shown when there’s no image" error={errors.emoji}>
                <input id="emoji" name="emoji" value={emoji} onChange={(e) => setEmoji(e.target.value)} className={`${inputCls} text-center text-xl`} />
              </Field>
              <Field label="Background" htmlFor="tint" error={errors.tint}>
                <input
                  id="tint"
                  name="tint"
                  type="color"
                  value={tint}
                  onChange={(e) => setTint(e.target.value)}
                  className="h-11 w-full cursor-pointer rounded-lg border border-line bg-white p-1"
                />
              </Field>
            </div>
          </Card>

          <div className="xl:hidden">{saveButton}</div>
        </div>
      </div>
    </form>
  );
}
