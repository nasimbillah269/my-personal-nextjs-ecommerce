"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Castle, Contact, ExternalLink, ImagePlus, Loader2, Pencil, Plus, Save, Search, Trash2, X } from "lucide-react";
import { slugify } from "@/lib/post-content";
import { deleteBrand, saveBrand, setBrandActive } from "@/server/admin/brand-actions";
import { deleteClient, saveClient, setClientActive } from "@/server/admin/client-actions";
import type { FormState } from "@/server/admin/form-state";
import { ActionButton, useFormAction } from "./controls";
import { btnPrimary, btnSecondary, Card, EmptyState, Field, inputCls } from "./ui";

/** Clients and brands share this list + side form; brands add a slug, description and product count. */
export type LogoRow = {
  id: number;
  name: string;
  logo: string | null;
  website: string | null;
  sortOrder: number;
  isActive: boolean;
  slug?: string;
  description?: string;
  productCount?: number;
};

type Kind = "client" | "brand";

const config = {
  client: {
    noun: "client",
    icon: Contact,
    save: saveClient,
    remove: deleteClient,
    setActive: setClientActive,
    namePlaceholder: "e.g. Shwapno Super Shop",
    emptyText: "Add your first client with the form.",
  },
  brand: {
    noun: "brand",
    icon: Castle,
    save: saveBrand,
    remove: deleteBrand,
    setActive: setBrandActive,
    namePlaceholder: "e.g. Ultimate Organic Life",
    emptyText: "Add your first brand with the form. Saved brands are suggested in the product form.",
  },
} as const;

function LogoField({ initial, error }: { initial: string | null; error?: string }) {
  const [preview, setPreview] = useState(initial);
  const [removed, setRemoved] = useState(false);
  const shown = preview && !removed;
  return (
    <div>
      <span className="mb-1.5 block text-sm font-bold text-heading">Logo</span>
      <label
        className={`relative grid aspect-[16/9] w-full cursor-pointer place-items-center overflow-hidden rounded-xl border-2 border-dashed bg-soft transition hover:border-brand ${
          error ? "border-red-400" : "border-line"
        }`}
      >
        {shown ? (
          <Image src={preview} alt="Logo preview" fill sizes="340px" unoptimized className="object-contain p-4" />
        ) : (
          <span className="flex flex-col items-center gap-1 text-sm font-semibold text-body">
            <ImagePlus className="size-6" /> Click to upload
          </span>
        )}
        <input
          type="file"
          name="logo"
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
      <input type="hidden" name="removeLogo" value={removed ? "on" : ""} />
      {error ? (
        <p className="mt-1.5 text-xs font-semibold text-red-500">{error}</p>
      ) : (
        <p className="mt-1.5 text-xs text-body">JPG, PNG, WEBP or AVIF · max 3 MB · transparent PNG works best.</p>
      )}
      {shown && (
        <button type="button" onClick={() => setRemoved(true)} className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-red-500 hover:underline">
          <X className="size-3.5" /> Remove
        </button>
      )}
    </div>
  );
}

function LogoForm({ kind, row, onDone }: { kind: Kind; row: LogoRow | null; onDone: () => void }) {
  const c = config[kind];
  const { state, onSubmit, pending } = useFormAction<FormState>(c.save, null);
  const errors = state?.errors ?? {};
  const [name, setName] = useState(row?.name ?? "");
  const [slug, setSlug] = useState(row?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!row);

  useEffect(() => {
    if (state?.ok) onDone();
  }, [state, onDone]);

  return (
    <form onSubmit={onSubmit} encType="multipart/form-data" noValidate className="space-y-4">
      {row && <input type="hidden" name="id" value={row.id} />}
      <LogoField initial={row?.logo ?? null} error={errors.logo} />
      <Field label="Name" htmlFor={`${kind}-name`} error={errors.name}>
        <input
          id={`${kind}-name`}
          name="name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (kind === "brand" && !slugTouched) setSlug(slugify(e.target.value, 140));
          }}
          aria-invalid={!!errors.name}
          className={inputCls}
          placeholder={c.namePlaceholder}
        />
      </Field>
      {kind === "brand" && (
        <Field label="Slug" htmlFor="brand-slug" error={errors.slug} hint="Leave empty to build it from the name.">
          <input
            id="brand-slug"
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
      )}
      <Field label="Website (optional)" htmlFor={`${kind}-website`} error={errors.website} hint="Logo links here in the store, e.g. https://example.com">
        <input id={`${kind}-website`} name="website" type="url" defaultValue={row?.website ?? ""} aria-invalid={!!errors.website} className={inputCls} />
      </Field>
      {kind === "brand" && (
        <Field label="Description (optional)" htmlFor="brand-description" error={errors.description}>
          <textarea
            id="brand-description"
            name="description"
            rows={3}
            defaultValue={row?.description ?? ""}
            aria-invalid={!!errors.description}
            className={`${inputCls} h-auto resize-y py-2.5`}
          />
        </Field>
      )}
      <Field label="Sort order" htmlFor={`${kind}-sort`} error={errors.sortOrder} hint="Lower numbers appear first.">
        <input id={`${kind}-sort`} name="sortOrder" type="number" min={0} defaultValue={row?.sortOrder ?? 0} className={inputCls} />
      </Field>
      <label className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold text-heading">
        <input type="checkbox" name="isActive" defaultChecked={row?.isActive ?? true} className="size-4 accent-brand" />
        Active (shown in the store)
      </label>
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className={`${btnPrimary} flex-1`}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {row ? `Save ${c.noun}` : `Add ${c.noun}`}
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

export function LogoManager({ kind, rows }: { kind: Kind; rows: LogoRow[] }) {
  const c = config[kind];
  const [editing, setEditing] = useState<LogoRow | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [q, setQ] = useState("");
  const reset = () => {
    setEditing(null);
    setFormKey((k) => k + 1);
  };

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return needle ? rows.filter((r) => r.name.toLowerCase().includes(needle) || r.website?.toLowerCase().includes(needle)) : rows;
  }, [rows, q]);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <Card bodyClassName="">
        {rows.length > 0 && (
          <div className="border-b border-line p-4">
            <label className="relative block">
              <span className="sr-only">Search</span>
              <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-body" />
              <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${c.noun}s…`} className={`${inputCls} pl-10`} />
            </label>
          </div>
        )}
        {shown.length === 0 ? (
          <EmptyState icon={c.icon} title={rows.length ? `No ${c.noun}s match “${q}”` : `No ${c.noun}s yet`} text={rows.length ? undefined : c.emptyText} />
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[620px] text-sm">
              <thead className="bg-soft text-left text-xs font-bold tracking-wide text-body uppercase">
                <tr>
                  <th className="w-14 px-5 py-3">S:L</th>
                  <th className="px-5 py-3">{kind === "brand" ? "Brand" : "Client"}</th>
                  {kind === "brand" && <th className="px-5 py-3 text-center">Products</th>}
                  <th className="px-5 py-3 text-center">Order</th>
                  <th className="px-5 py-3 text-center">Status</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((r, i) => (
                  <tr key={r.id} className={`border-t border-line ${editing?.id === r.id ? "bg-brand-light/40" : "hover:bg-soft/60"}`}>
                    <td className="px-5 py-3 text-body">{i + 1}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className="relative grid h-12 w-20 shrink-0 place-items-center overflow-hidden rounded-lg border border-line bg-white">
                          {r.logo ? (
                            <Image src={r.logo} alt={r.name} fill sizes="80px" className="object-contain p-1.5" />
                          ) : (
                            <c.icon className="size-5 text-body/50" />
                          )}
                        </span>
                        <span className="min-w-0">
                          <span className="line-clamp-1 font-bold text-heading">{r.name}</span>
                          {r.website ? (
                            <a href={r.website} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-64 items-center gap-1 truncate text-xs text-body hover:text-brand">
                              {r.website.replace(/^https?:\/\//, "")} <ExternalLink className="size-3 shrink-0" />
                            </a>
                          ) : (
                            r.slug && <span className="font-mono text-xs text-body">{r.slug}</span>
                          )}
                        </span>
                      </div>
                    </td>
                    {kind === "brand" && <td className="px-5 py-3 text-center text-body">{r.productCount ?? 0}</td>}
                    <td className="px-5 py-3 text-center text-body">{r.sortOrder}</td>
                    <td className="px-5 py-3 text-center">
                      <ActionButton
                        action={() => c.setActive(r.id, !r.isActive)}
                        label={r.isActive ? `Deactivate ${r.name}` : `Activate ${r.name}`}
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold transition hover:brightness-95 disabled:opacity-60 ${
                          r.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {r.isActive ? "Active" : "Inactive"}
                      </ActionButton>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditing(r);
                            setFormKey((k) => k + 1);
                          }}
                          aria-label={`Edit ${r.name}`}
                          title="Edit"
                          className="grid size-8 place-items-center rounded-lg text-body hover:bg-soft hover:text-brand"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <ActionButton
                          action={async () => {
                            const res = await c.remove(r.id);
                            if (res?.ok && editing?.id === r.id) reset();
                            return res;
                          }}
                          confirmText={
                            kind === "brand" && r.productCount
                              ? `Delete brand “${r.name}”? Its ${r.productCount} product(s) keep the brand name.`
                              : `Delete ${c.noun} “${r.name}”?`
                          }
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
        title={editing ? `Edit “${editing.name}”` : `Add ${c.noun}`}
        action={
          editing && (
            <button type="button" onClick={reset} className="inline-flex items-center gap-1 text-xs font-bold text-brand">
              <Plus className="size-3.5" /> New
            </button>
          )
        }
        className="self-start xl:sticky xl:top-24"
      >
        <LogoForm key={formKey} kind={kind} row={editing} onDone={reset} />
      </Card>
    </div>
  );
}
