"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, Save, Send, X } from "lucide-react";
import { slugify } from "@/lib/post-content";
import type { FormState } from "@/server/admin/form-state";
import { savePost } from "@/server/admin/post-actions";
import { Toggle, useFormAction } from "./controls";
import { MarkupEditor } from "./MarkupEditor";
import { btnPrimary, btnSecondary, Card, Field, inputCls } from "./ui";

export type PostFormValues = {
  id?: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string | null;
  categoryId: number | "";
  tags: string[];
  status: "draft" | "published";
  /** "YYYY-MM-DDTHH:mm" in Dhaka time, or "" */
  publishedAt: string;
  allowComments: boolean;
};

const parseTags = (s: string) => s.split(",").map((t) => t.trim()).filter(Boolean);

export function PostForm({
  initial,
  categories,
  allTags,
}: {
  initial: PostFormValues;
  categories: { id: number; name: string }[];
  allTags: string[];
}) {
  const router = useRouter();
  const { state, onSubmit, pending } = useFormAction<FormState>(savePost, null);
  const errors = state?.errors ?? {};
  const isNew = !initial.id;

  const [title, setTitle] = useState(initial.title);
  const [slug, setSlug] = useState(initial.slug);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [content, setContent] = useState(initial.content);
  const [excerpt, setExcerpt] = useState(initial.excerpt);
  const [tags, setTags] = useState(initial.tags.join(", "));
  // Which button was pressed (for its spinner); the hidden input carries it into FormData.
  const [status, setStatus] = useState(initial.status);
  const statusInput = useRef<HTMLInputElement>(null);
  const [cover, setCover] = useState<string | null>(initial.coverImage);
  const [removeCover, setRemoveCover] = useState(false);

  // After creating a post, move to its edit page.
  useEffect(() => {
    if (state?.ok && isNew && state.id) router.replace(`/admin/posts/${state.id}`);
  }, [state, isNew, router]);

  const current = parseTags(tags).map((t) => t.toLowerCase());
  const suggestions = allTags.filter((t) => !current.includes(t.toLowerCase())).slice(0, 12);

  const submit = (s: "draft" | "published") => (
    <button
      type="submit"
      onClick={() => {
        // Set the DOM value directly: state wouldn't update before the submit event reads the form.
        statusInput.current!.value = s;
        setStatus(s);
      }}
      disabled={pending}
      className={s === "published" ? btnPrimary : btnSecondary}
    >
      {pending && status === s ? (
        <Loader2 className="size-4 animate-spin" />
      ) : s === "published" ? (
        <Send className="size-4" />
      ) : (
        <Save className="size-4" />
      )}
      {s === "draft" ? (initial.status === "published" ? "Unpublish" : "Save draft") : initial.status === "published" ? "Update" : "Publish"}
    </button>
  );

  return (
    <form onSubmit={onSubmit} encType="multipart/form-data" noValidate>
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      {/* Pressing Enter keeps the current status; the buttons overwrite it. */}
      <input ref={statusInput} type="hidden" name="status" defaultValue={initial.status} />
      {/* Enter "clicks" the form's first submit button; make that this neutral one rather than Save draft/Unpublish. */}
      <button type="submit" hidden tabIndex={-1} aria-hidden="true" />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-heading">{isNew ? "New post" : "Edit post"}</h1>
          {!isNew && initial.status === "published" && (
            <Link href={`/blog/${initial.slug}`} target="_blank" className="text-sm font-semibold text-brand hover:underline">
              View on blog ↗
            </Link>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/posts" className={btnSecondary}>
            Cancel
          </Link>
          {submit("draft")}
          {submit("published")}
        </div>
      </div>

      {state && !state.ok && state.errors && (
        <p role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">
          {state.message}
        </p>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Card>
            <div className="space-y-5">
              <Field label="Title" htmlFor="title" error={errors.title}>
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
                  placeholder="e.g. 7 benefits of raw honey"
                />
              </Field>
              <Field label="URL slug" htmlFor="slug" error={errors.slug} hint={`/blog/${slug || "…"}`}>
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
            </div>
          </Card>

          <Card title="Content">
            <MarkupEditor
              name="content"
              label="Post content"
              value={content}
              onChange={setContent}
              error={errors.content}
              rows={20}
              placeholder={"Start writing…\n\n## A section heading\nA paragraph of text.\n- A bullet point"}
            />
          </Card>

          <Card title="Excerpt">
            <Field
              label="Short summary"
              htmlFor="excerpt"
              error={errors.excerpt}
              hint={`${excerpt.length}/500 · Shown on the blog list and in search results. Leave empty to use the start of the post.`}
            >
              <textarea
                id="excerpt"
                name="excerpt"
                rows={3}
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                aria-invalid={!!errors.excerpt}
                className={`${inputCls} h-auto resize-y py-2.5`}
              />
            </Field>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Publish">
            <div className="space-y-4">
              <p className="flex items-center justify-between text-sm">
                <span className="font-bold text-heading">Status</span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                    initial.status === "published" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {isNew ? "Not saved" : initial.status === "published" ? "Published" : "Draft"}
                </span>
              </p>
              <Field
                label="Publish date"
                htmlFor="publishedAt"
                error={errors.publishedAt}
                hint="Dhaka time. Leave empty to use the moment you publish; a future date schedules the post."
              >
                <input id="publishedAt" name="publishedAt" type="datetime-local" defaultValue={initial.publishedAt} className={inputCls} />
              </Field>
              <div className="-my-1 border-t border-line">
                <Toggle name="allowComments" label="Allow comments" hint="Readers can comment; you approve them first." defaultChecked={initial.allowComments} />
              </div>
            </div>
          </Card>

          <Card title="Category & tags">
            <div className="space-y-4">
              <Field
                label="Category"
                htmlFor="categoryId"
                error={errors.categoryId}
                hint={
                  <Link href="/admin/posts/categories" className="font-semibold text-brand hover:underline">
                    Manage categories
                  </Link>
                }
              >
                <select id="categoryId" name="categoryId" defaultValue={initial.categoryId} className={`${inputCls} cursor-pointer`}>
                  <option value="">Uncategorised</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Tags" htmlFor="tags" error={errors.tags} hint="Comma separated. New tags are created automatically.">
                <input id="tags" name="tags" value={tags} onChange={(e) => setTags(e.target.value)} className={inputCls} placeholder="honey, health tips" />
              </Field>
              {suggestions.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTags((s) => [...parseTags(s), t].join(", "))}
                      className="rounded-full border border-line px-2.5 py-1 text-xs font-semibold text-body transition hover:border-brand hover:text-brand"
                    >
                      + {t}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Card>

          <Card title="Cover image">
            <label
              className={`relative grid aspect-[16/9] w-full cursor-pointer place-items-center overflow-hidden rounded-xl border-2 border-dashed bg-soft transition hover:border-brand ${
                errors.coverImage ? "border-red-400" : "border-line"
              }`}
            >
              {cover && !removeCover ? (
                <Image src={cover} alt="Cover preview" fill sizes="320px" unoptimized className="object-cover" />
              ) : (
                <span className="flex flex-col items-center gap-1 text-sm font-semibold text-body">
                  <ImagePlus className="size-6" /> Click to upload
                </span>
              )}
              <input
                type="file"
                name="coverImage"
                accept="image/jpeg,image/png,image/webp,image/avif"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setCover(URL.createObjectURL(file));
                    setRemoveCover(false);
                  }
                }}
              />
            </label>
            <input type="hidden" name="removeCoverImage" value={removeCover ? "on" : ""} />
            {errors.coverImage ? (
              <p className="mt-1.5 text-xs font-semibold text-red-500">{errors.coverImage}</p>
            ) : (
              <p className="mt-1.5 text-xs text-body">JPG, PNG, WEBP or AVIF · max 3 MB · e.g. 1200 × 675.</p>
            )}
            {cover && !removeCover && (
              <button
                type="button"
                onClick={() => setRemoveCover(true)}
                className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-red-500 hover:underline"
              >
                <X className="size-3.5" /> Remove image
              </button>
            )}
          </Card>

          <div className="flex gap-2 xl:hidden">
            {submit("draft")}
            {submit("published")}
          </div>
        </div>
      </div>
    </form>
  );
}
