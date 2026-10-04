"use client";

import { useEffect, useState } from "react";
import { FolderTree, Loader2, Pencil, Plus, Save, Trash2 } from "lucide-react";
import { CategoryIcon, categoryIcons } from "@/lib/category-icons";
import { deleteCategory, saveCategory } from "@/server/admin/catalog-actions";
import type { FormState } from "@/server/admin/form-state";
import { ActionButton, useFormAction } from "./controls";
import { btnPrimary, btnSecondary, Card, EmptyState, Field, inputCls } from "./ui";

type CategoryRow = { id: number; slug: string; name: string; icon: string; sortOrder: number; productCount: number };

const slugify = (s: string) =>
  s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9\s-]/g, "").trim().replace(/[\s-]+/g, "-");

function CategoryForm({ category, onDone }: { category: CategoryRow | null; onDone: () => void }) {
  const { state, onSubmit, pending } = useFormAction<FormState>(saveCategory, null);
  const errors = state?.errors ?? {};
  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!category);
  const [icon, setIcon] = useState(category?.icon ?? "LayoutGrid");

  useEffect(() => {
    if (state?.ok) onDone();
  }, [state, onDone]);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {category && <input type="hidden" name="id" value={category.id} />}
      <Field label="Name" htmlFor="cat-name" error={errors.name}>
        <input
          id="cat-name"
          name="name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (!slugTouched) setSlug(slugify(e.target.value));
          }}
          aria-invalid={!!errors.name}
          className={inputCls}
          placeholder="e.g. Dry Fruits"
        />
      </Field>
      <Field label="Slug" htmlFor="cat-slug" error={errors.slug} hint={`/products?category=${slug || "…"}`}>
        <input
          id="cat-slug"
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
      <fieldset>
        <legend className="mb-1.5 text-sm font-bold text-heading">Icon</legend>
        <input type="hidden" name="icon" value={icon} />
        <div className="grid grid-cols-6 gap-2">
          {Object.keys(categoryIcons).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setIcon(key)}
              aria-label={key}
              aria-pressed={icon === key}
              title={key}
              className={`grid aspect-square place-items-center rounded-lg border-2 transition ${
                icon === key ? "border-brand bg-brand-light text-brand-dark" : "border-line text-body hover:border-brand/50"
              }`}
            >
              <CategoryIcon name={key} className="size-5" />
            </button>
          ))}
        </div>
        {errors.icon && <p className="mt-1.5 text-xs font-semibold text-red-500">{errors.icon}</p>}
      </fieldset>
      <Field label="Sort order" htmlFor="cat-sort" hint="Lower numbers appear first.">
        <input id="cat-sort" name="sortOrder" type="number" min={0} defaultValue={category?.sortOrder ?? 0} className={inputCls} />
      </Field>
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className={`${btnPrimary} flex-1`}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {category ? "Save category" : "Add category"}
        </button>
        {category && (
          <button type="button" onClick={onDone} className={btnSecondary}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export function CategoryManager({ categories }: { categories: CategoryRow[] }) {
  const [editing, setEditing] = useState<CategoryRow | null>(null);
  const [formKey, setFormKey] = useState(0);
  const reset = () => {
    setEditing(null);
    setFormKey((k) => k + 1);
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <Card bodyClassName="">
        {categories.length === 0 ? (
          <EmptyState icon={FolderTree} title="No categories yet" text="Create your first category with the form." />
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead className="bg-soft text-left text-xs font-bold tracking-wide text-body uppercase">
                <tr>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Slug</th>
                  <th className="px-5 py-3 text-center">Products</th>
                  <th className="px-5 py-3 text-center">Order</th>
                  <th className="px-5 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.id} className={`border-t border-line ${editing?.id === c.id ? "bg-brand-light/40" : "hover:bg-soft/60"}`}>
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-3 font-bold text-heading">
                        <span className="grid size-9 place-items-center rounded-lg bg-brand-light">
                          <CategoryIcon name={c.icon} className="size-5 text-brand-dark" />
                        </span>
                        {c.name}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-body">{c.slug}</td>
                    <td className="px-5 py-3 text-center font-semibold text-heading">{c.productCount}</td>
                    <td className="px-5 py-3 text-center text-body">{c.sortOrder}</td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditing(c);
                            setFormKey((k) => k + 1);
                          }}
                          aria-label={`Edit ${c.name}`}
                          className="grid size-8 place-items-center rounded-lg text-body hover:bg-soft hover:text-brand"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <ActionButton
                          action={() => deleteCategory(c.id)}
                          confirmText={`Delete category “${c.name}”?`}
                          label={`Delete ${c.name}`}
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
        title={editing ? `Edit “${editing.name}”` : "Add category"}
        action={
          editing && (
            <button type="button" onClick={reset} className="inline-flex items-center gap-1 text-xs font-bold text-brand">
              <Plus className="size-3.5" /> New
            </button>
          )
        }
        className="self-start xl:sticky xl:top-24"
      >
        <CategoryForm key={formKey} category={editing} onDone={reset} />
      </Card>
    </div>
  );
}
