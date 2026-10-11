"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ImagePlus, Loader2, Pencil, Plus, Presentation, Save, Trash2 } from "lucide-react";
import type { FormState } from "@/server/admin/form-state";
import { deleteSlider, saveSlider, setSliderActive } from "@/server/admin/slider-actions";
import { ActionButton, useFormAction } from "./controls";
import { btnPrimary, btnSecondary, Card, EmptyState, Field, inputCls } from "./ui";

export type SliderRow = { id: number; title: string; image: string; link: string | null; sortOrder: number; isActive: boolean };

function SliderForm({ slider, onDone }: { slider: SliderRow | null; onDone: () => void }) {
  const { state, onSubmit, pending } = useFormAction<FormState>(saveSlider, null);
  const errors = state?.errors ?? {};
  const [preview, setPreview] = useState<string | null>(slider?.image ?? null);

  useEffect(() => {
    if (state?.ok) onDone();
  }, [state, onDone]);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {slider && <input type="hidden" name="id" value={slider.id} />}
      <div>
        <span className="mb-1.5 block text-sm font-bold text-heading">Image</span>
        <label
          className={`relative grid aspect-[16/7] w-full cursor-pointer place-items-center overflow-hidden rounded-xl border-2 border-dashed bg-soft transition hover:border-brand ${
            errors.image ? "border-red-400" : "border-line"
          }`}
        >
          {preview ? (
            <Image src={preview} alt="Slider preview" fill sizes="380px" unoptimized className="object-cover" />
          ) : (
            <span className="flex flex-col items-center gap-1 text-sm font-semibold text-body">
              <ImagePlus className="size-6" /> Click to upload
            </span>
          )}
          <input
            type="file"
            name="image"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setPreview(URL.createObjectURL(file));
            }}
          />
        </label>
        {errors.image ? (
          <p className="mt-1.5 text-xs font-semibold text-red-500">{errors.image}</p>
        ) : (
          <p className="mt-1.5 text-xs text-body">
            JPG, PNG, WEBP or AVIF · max 3 MB · wide banner, e.g. 1600 × 650.{slider && " Pick a new file to replace it."}
          </p>
        )}
      </div>
      <Field label="Title" htmlFor="slider-title" error={errors.title} hint="Used as the image’s alt text.">
        <input
          id="slider-title"
          name="title"
          defaultValue={slider?.title ?? ""}
          aria-invalid={!!errors.title}
          className={inputCls}
          placeholder="e.g. 10% off on toothpaste"
        />
      </Field>
      <Field label="Link (optional)" htmlFor="slider-link" error={errors.link} hint="Where the slide goes when clicked, e.g. /products">
        <input id="slider-link" name="link" defaultValue={slider?.link ?? ""} aria-invalid={!!errors.link} className={inputCls} />
      </Field>
      <Field label="Sort order" htmlFor="slider-sort" hint="Lower numbers appear first.">
        <input id="slider-sort" name="sortOrder" type="number" min={0} defaultValue={slider?.sortOrder ?? 0} className={inputCls} />
      </Field>
      <label className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold text-heading">
        <input type="checkbox" name="isActive" defaultChecked={slider?.isActive ?? true} className="size-4 accent-brand" />
        Show on home page
      </label>
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className={`${btnPrimary} flex-1`}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {slider ? "Save slider" : "Add slider"}
        </button>
        {slider && (
          <button type="button" onClick={onDone} className={btnSecondary}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export function SliderManager({ sliders }: { sliders: SliderRow[] }) {
  const [editing, setEditing] = useState<SliderRow | null>(null);
  const [formKey, setFormKey] = useState(0);
  const reset = () => {
    setEditing(null);
    setFormKey((k) => k + 1);
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <Card bodyClassName="">
        {sliders.length === 0 ? (
          <EmptyState icon={Presentation} title="No sliders yet" text="Upload your first banner with the form. Until then the home page shows the built-in slides." />
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[620px] text-sm">
              <thead className="bg-soft text-left text-xs font-bold tracking-wide text-body uppercase">
                <tr>
                  <th className="px-5 py-3">Image</th>
                  <th className="px-5 py-3">Title</th>
                  <th className="px-5 py-3 text-center">Order</th>
                  <th className="px-5 py-3 text-center">Status</th>
                  <th className="px-5 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sliders.map((s) => (
                  <tr key={s.id} className={`border-t border-line ${editing?.id === s.id ? "bg-brand-light/40" : "hover:bg-soft/60"}`}>
                    <td className="px-5 py-3">
                      <span className="relative block aspect-[16/7] w-36 overflow-hidden rounded-lg border border-line bg-soft">
                        <Image src={s.image} alt={s.title} fill sizes="144px" className="object-cover" />
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-bold text-heading">{s.title}</p>
                      {s.link && <p className="mt-0.5 max-w-64 truncate font-mono text-xs text-body">{s.link}</p>}
                    </td>
                    <td className="px-5 py-3 text-center text-body">{s.sortOrder}</td>
                    <td className="px-5 py-3 text-center">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                          s.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {s.isActive ? "Active" : "Hidden"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <ActionButton
                          action={() => setSliderActive(s.id, !s.isActive)}
                          className="rounded-lg px-2 py-1 text-xs font-bold text-brand hover:bg-brand-light"
                        >
                          {s.isActive ? "Hide" : "Show"}
                        </ActionButton>
                        <button
                          type="button"
                          onClick={() => {
                            setEditing(s);
                            setFormKey((k) => k + 1);
                          }}
                          aria-label={`Edit ${s.title}`}
                          className="grid size-8 place-items-center rounded-lg text-body hover:bg-soft hover:text-brand"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <ActionButton
                          action={() => deleteSlider(s.id)}
                          confirmText={`Delete slider “${s.title}”?`}
                          label={`Delete ${s.title}`}
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
        title={editing ? `Edit “${editing.title}”` : "Add slider"}
        action={
          editing && (
            <button type="button" onClick={reset} className="inline-flex items-center gap-1 text-xs font-bold text-brand">
              <Plus className="size-3.5" /> New
            </button>
          )
        }
        className="self-start xl:sticky xl:top-24"
      >
        <SliderForm key={formKey} slider={editing} onDone={reset} />
      </Card>
    </div>
  );
}
