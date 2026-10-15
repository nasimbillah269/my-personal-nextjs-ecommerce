"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FolderTree, Loader2, Pencil, Plus, Save, Tag, Trash2 } from "lucide-react";
import { slugify } from "@/lib/post-content";
import type { FormState } from "@/server/admin/form-state";
import { deletePostCategory, deleteTag, savePostCategory, saveTag } from "@/server/admin/post-actions";
import { ActionButton, useFormAction } from "./controls";
import { btnPrimary, btnSecondary, Card, EmptyState, Field, inputCls } from "./ui";

type Row = { id: number; slug: string; name: string; postCount: number; description?: string; sortOrder?: number };

type Kind = {
  noun: string;
  icon: typeof Tag;
  save: (prev: FormState, formData: FormData) => Promise<FormState>;
  remove: (id: number) => Promise<FormState>;
  confirm: (row: Row) => string;
  /** Posts list filtered to this term */
  postsHref?: (row: Row) => string;
  slugMax: number;
  placeholder: string;
  extraFields: boolean;
};

const kinds = {
  category: {
    noun: "category",
    icon: FolderTree,
    save: savePostCategory,
    remove: deletePostCategory,
    confirm: (r) => `Delete category “${r.name}”?${r.postCount ? ` Its ${r.postCount} post${r.postCount === 1 ? "" : "s"} become uncategorised.` : ""}`,
    postsHref: (r) => `/admin/posts?category=${r.slug}`,
    slugMax: 120,
    placeholder: "e.g. Health Tips",
    extraFields: true,
  },
  tag: {
    noun: "tag",
    icon: Tag,
    save: saveTag,
    remove: deleteTag,
    confirm: (r) => `Delete tag “${r.name}”?${r.postCount ? ` It is removed from ${r.postCount} post${r.postCount === 1 ? "" : "s"}.` : ""}`,
    postsHref: (r) => `/admin/posts?tag=${r.slug}`,
    slugMax: 80,
    placeholder: "e.g. honey",
    extraFields: false,
  },
} satisfies Record<string, Kind>;

function TermForm({ kind, row, onDone }: { kind: Kind; row: Row | null; onDone: () => void }) {
  const { state, onSubmit, pending } = useFormAction<FormState>(kind.save, null);
  const errors = state?.errors ?? {};
  const [name, setName] = useState(row?.name ?? "");
  const [slug, setSlug] = useState(row?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!row);

  useEffect(() => {
    if (state?.ok) onDone();
  }, [state, onDone]);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {row && <input type="hidden" name="id" value={row.id} />}
      <Field label="Name" htmlFor="term-name" error={errors.name}>
        <input
          id="term-name"
          name="name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (!slugTouched) setSlug(slugify(e.target.value, kind.slugMax));
          }}
          aria-invalid={!!errors.name}
          className={inputCls}
          placeholder={kind.placeholder}
        />
      </Field>
      <Field label="Slug" htmlFor="term-slug" error={errors.slug} hint={`/blog?${kind.noun}=${slug || "…"}`}>
        <input
          id="term-slug"
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
      {kind.extraFields && (
        <>
          <Field label="Description (optional)" htmlFor="term-desc" error={errors.description} hint="Shown at the top of the category’s blog page.">
            <textarea
              id="term-desc"
              name="description"
              rows={3}
              defaultValue={row?.description ?? ""}
              className={`${inputCls} h-auto resize-y py-2.5`}
            />
          </Field>
          <Field label="Sort order" htmlFor="term-sort" hint="Lower numbers appear first.">
            <input id="term-sort" name="sortOrder" type="number" min={0} defaultValue={row?.sortOrder ?? 0} className={inputCls} />
          </Field>
        </>
      )}
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className={`${btnPrimary} flex-1`}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {row ? `Save ${kind.noun}` : `Add ${kind.noun}`}
        </button>
        {row && (
          <button type="button" onClick={onDone} className={btnSecondary}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export function PostTaxonomyManager({ type, rows }: { type: keyof typeof kinds; rows: Row[] }) {
  const kind: Kind = kinds[type];
  const [editing, setEditing] = useState<Row | null>(null);
  const [formKey, setFormKey] = useState(0);
  const reset = () => {
    setEditing(null);
    setFormKey((k) => k + 1);
  };
  const Icon = kind.icon;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <Card bodyClassName="">
        {rows.length === 0 ? (
          <EmptyState
            icon={Icon}
            title={`No ${kind.noun === "category" ? "categories" : "tags"} yet`}
            text={
              kind.noun === "tag"
                ? "Create one with the form, or just type tags while writing a post."
                : "Create your first blog category with the form."
            }
          />
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead className="bg-soft text-left text-xs font-bold tracking-wide text-body uppercase">
                <tr>
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Slug</th>
                  <th className="px-5 py-3 text-center">Posts</th>
                  {kind.extraFields && <th className="px-5 py-3 text-center">Order</th>}
                  <th className="px-5 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className={`border-t border-line ${editing?.id === r.id ? "bg-brand-light/40" : "hover:bg-soft/60"}`}>
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-3">
                        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-light">
                          <Icon className="size-4 text-brand-dark" />
                        </span>
                        <span className="min-w-0">
                          <span className="block font-bold text-heading">{r.name}</span>
                          {r.description && <span className="line-clamp-1 text-xs text-body">{r.description}</span>}
                        </span>
                      </span>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-body">{r.slug}</td>
                    <td className="px-5 py-3 text-center">
                      {r.postCount > 0 && kind.postsHref ? (
                        <Link href={kind.postsHref(r)} className="font-semibold text-heading hover:text-brand hover:underline">
                          {r.postCount}
                        </Link>
                      ) : (
                        <span className="font-semibold text-body">0</span>
                      )}
                    </td>
                    {kind.extraFields && <td className="px-5 py-3 text-center text-body">{r.sortOrder}</td>}
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditing(r);
                            setFormKey((k) => k + 1);
                          }}
                          aria-label={`Edit ${r.name}`}
                          className="grid size-8 place-items-center rounded-lg text-body hover:bg-soft hover:text-brand"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <ActionButton
                          action={async () => {
                            const result = await kind.remove(r.id);
                            if (editing?.id === r.id) reset();
                            return result;
                          }}
                          confirmText={kind.confirm(r)}
                          label={`Delete ${r.name}`}
                          className="grid size-8 place-items-center rounded-lg text-body hover:bg-red-50 hover:text-red-500"
                        >
                          <Trash2 className="size-4" />
                        </ActionButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card
        title={editing ? `Edit “${editing.name}”` : `Add ${kind.noun}`}
        action={
          editing && (
            <button type="button" onClick={reset} className="inline-flex items-center gap-1 text-xs font-bold text-brand">
              <Plus className="size-3.5" /> New
            </button>
          )
        }
        className="self-start xl:sticky xl:top-24"
      >
        <TermForm key={formKey} kind={kind} row={editing} onDone={reset} />
      </Card>
    </div>
  );
}
