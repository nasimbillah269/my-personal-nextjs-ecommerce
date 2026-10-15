"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, ImagePlus, Loader2, Plus, Save, X } from "lucide-react";
import { PAGE_TEMPLATE_LABELS, PAGE_TEMPLATES } from "@/lib/constants";
import { slugify } from "@/lib/post-content";
import type { FormState } from "@/server/admin/form-state";
import { savePage } from "@/server/admin/page-actions";
import { Toggle, useFormAction } from "./controls";
import { MarkupEditor } from "./MarkupEditor";
import { btnPrimary, btnSecondary, Card, Field, inputCls } from "./ui";

export type PageFormValues = {
  id?: number;
  title: string;
  slug: string;
  shortDescription: string;
  content: string;
  image: string | null;
  banner: string | null;
  template: (typeof PAGE_TEMPLATES)[number];
  isActive: boolean;
  isFeatured: boolean;
  /** "YYYY-MM-DDTHH:mm" in Dhaka time, or "" */
  publishedAt: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  sortOrder: number;
};

function ImageField({
  name,
  label,
  initial,
  aspect,
  hint,
  error,
}: {
  name: string;
  label: string;
  initial: string | null;
  aspect: string;
  hint: string;
  error?: string;
}) {
  const [preview, setPreview] = useState(initial);
  const [removed, setRemoved] = useState(false);
  const shown = preview && !removed;
  return (
    <div>
      <span className="mb-1.5 block text-sm font-bold text-heading">{label}</span>
      <label
        className={`relative grid w-full cursor-pointer place-items-center overflow-hidden rounded-xl border-2 border-dashed bg-soft transition hover:border-brand ${aspect} ${
          error ? "border-red-400" : "border-line"
        }`}
      >
        {shown ? (
          <Image src={preview} alt={`${label} preview`} fill sizes="360px" unoptimized className="object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-1 text-sm font-semibold text-body">
            <ImagePlus className="size-6" /> Click to upload
          </span>
        )}
        <input
          type="file"
          name={name}
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              setPreview(URL.createObjectURL(file));
              setRemoved(false);
            }
          }}
        />
      </label>
      <input type="hidden" name={`remove${name[0].toUpperCase()}${name.slice(1)}`} value={removed ? "on" : ""} />
      {error ? <p className="mt-1.5 text-xs font-semibold text-red-500">{error}</p> : <p className="mt-1.5 text-xs text-body">{hint}</p>}
      {shown && (
        <button type="button" onClick={() => setRemoved(true)} className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-red-500 hover:underline">
          <X className="size-3.5" /> Remove
        </button>
      )}
    </div>
  );
}

export function PageForm({ initial }: { initial: PageFormValues }) {
  const router = useRouter();
  const { state, onSubmit, pending } = useFormAction<FormState>(savePage, null);
  const errors = state?.errors ?? {};
  const isNew = !initial.id;

  const [title, setTitle] = useState(initial.title);
  const [slug, setSlug] = useState(initial.slug);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [content, setContent] = useState(initial.content);
  const [metaTitle, setMetaTitle] = useState(initial.metaTitle);
  const [metaDescription, setMetaDescription] = useState(initial.metaDescription);

  // After creating a page, move to its edit page.
  useEffect(() => {
    if (state?.ok && isNew && state.id) router.replace(`/admin/pages/${state.id}`);
  }, [state, isNew, router]);

  const saveButton = (
    <button type="submit" disabled={pending} className={btnPrimary}>
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
      {isNew ? "Create page" : "Save changes"}
    </button>
  );

  return (
    <form onSubmit={onSubmit} encType="multipart/form-data" noValidate>
      {initial.id && <input type="hidden" name="id" value={initial.id} />}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-heading">{isNew ? "New page" : "Edit page"}</h1>
          {!isNew && initial.isActive && (
            <Link href={`/${initial.slug}`} target="_blank" className="text-sm font-semibold text-brand hover:underline">
              View in store ↗
            </Link>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/pages" className={btnSecondary}>
            <ArrowLeft className="size-4" /> Back
          </Link>
          {!isNew && (
            <Link href="/admin/pages/new" className={btnSecondary}>
              <Plus className="size-4" /> Add page
            </Link>
          )}
          {saveButton}
        </div>
      </div>

      {state && !state.ok && state.errors && (
        <p role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">
          {state.message}
        </p>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <Card title="Page details">
            <div className="space-y-5">
              <Field label="Page name" htmlFor="title" error={errors.title}>
                <input
                  id="title"
                  name="title"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (!slugTouched) setSlug(slugify(e.target.value));
                  }}
                  aria-invalid={!!errors.title}
                  className={`${inputCls} h-12 text-base font-semibold`}
                  placeholder="e.g. About Us"
                />
              </Field>
              <Field label="URL slug" htmlFor="slug" error={errors.slug} hint={`Store address: /${slug || "…"}`}>
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
              <Field label="Short description" htmlFor="shortDescription" error={errors.shortDescription} hint="Shown under the page title on the banner.">
                <textarea
                  id="shortDescription"
                  name="shortDescription"
                  rows={2}
                  defaultValue={initial.shortDescription}
                  aria-invalid={!!errors.shortDescription}
                  className={`${inputCls} h-auto resize-y py-2.5`}
                />
              </Field>
              <div>
                <span className="mb-1.5 block text-sm font-bold text-heading">Description</span>
                <MarkupEditor
                  name="content"
                  label="Page description"
                  value={content}
                  onChange={setContent}
                  error={errors.content}
                  placeholder={"## Who we are\nWrite about your page here…"}
                />
              </div>
            </div>
          </Card>

          <Card title="SEO">
            <div className="space-y-5">
              <Field
                label="Meta title"
                htmlFor="metaTitle"
                error={errors.metaTitle}
                hint={`${metaTitle.length}/60 recommended · Leave empty to use the page name.`}
              >
                <input id="metaTitle" name="metaTitle" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} className={inputCls} />
              </Field>
              <Field
                label="Meta description"
                htmlFor="metaDescription"
                error={errors.metaDescription}
                hint={`${metaDescription.length}/160 recommended · Leave empty to use the short description.`}
              >
                <textarea
                  id="metaDescription"
                  name="metaDescription"
                  rows={3}
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  aria-invalid={!!errors.metaDescription}
                  className={`${inputCls} h-auto resize-y py-2.5`}
                />
              </Field>
              <Field label="Meta keywords" htmlFor="metaKeywords" error={errors.metaKeywords} hint="Comma separated, e.g. organic food, about us">
                <input id="metaKeywords" name="metaKeywords" defaultValue={initial.metaKeywords} className={inputCls} />
              </Field>

              {/* Search-result preview */}
              <div className="rounded-xl border border-line bg-soft p-4">
                <p className="mb-2 text-xs font-bold tracking-wide text-body uppercase">Search preview</p>
                <p className="line-clamp-1 text-base font-semibold text-sky-700">{metaTitle || title || "Page title"}</p>
                <p className="font-mono text-xs text-leaf">/{slug || "page-slug"}</p>
                <p className="mt-1 line-clamp-2 text-sm text-body">{metaDescription || "Your meta description shows here."}</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Page action">
            <div className="space-y-4">
              <Field label="Page template" htmlFor="template" error={errors.template}>
                <select id="template" name="template" defaultValue={initial.template} className={`${inputCls} cursor-pointer`}>
                  {PAGE_TEMPLATES.map((t) => (
                    <option key={t} value={t}>
                      {PAGE_TEMPLATE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="-my-1 divide-y divide-line border-y border-line">
                <Toggle name="isActive" label="Active" hint="Visible in the store." defaultChecked={initial.isActive} />
                <Toggle name="isFeatured" label="Featured" hint="Linked in the store footer." defaultChecked={initial.isFeatured} />
              </div>
              <div className="grid grid-cols-[1fr_96px] gap-3">
                <Field label="Published date" htmlFor="publishedAt" error={errors.publishedAt} hint="Dhaka time · future = scheduled">
                  <input id="publishedAt" name="publishedAt" type="datetime-local" defaultValue={initial.publishedAt} className={inputCls} />
                </Field>
                <Field label="Order" htmlFor="sortOrder" error={errors.sortOrder}>
                  <input id="sortOrder" name="sortOrder" type="number" min={0} defaultValue={initial.sortOrder} className={inputCls} />
                </Field>
              </div>
              <div className="hidden xl:block">{saveButton}</div>
            </div>
          </Card>

          <Card title="Page images">
            <div className="space-y-5">
              <ImageField name="image" label="Page image" initial={initial.image} aspect="aspect-[4/3]" hint="Shown beside the content · max 3 MB." error={errors.image} />
              <ImageField
                name="banner"
                label="Page banner"
                initial={initial.banner}
                aspect="aspect-[16/5]"
                hint="Wide header image, e.g. 1600 × 500 · max 3 MB."
                error={errors.banner}
              />
            </div>
          </Card>

          <div className="xl:hidden">{saveButton}</div>
        </div>
      </div>
    </form>
  );
}
