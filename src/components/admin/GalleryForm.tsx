"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { ArrowDown, ArrowLeft, ArrowUp, Check, ImageIcon, ImagePlus, Loader2, Plus, Save, Trash2, UploadCloud, X } from "lucide-react";
import { GALLERY_LOCATION_LABELS, GALLERY_LOCATIONS, type GalleryLocation } from "@/lib/constants";
import type { FormState } from "@/server/admin/form-state";
import {
  deleteGalleryImage,
  reorderGalleryImages,
  saveGallery,
  updateGalleryImageCaption,
  uploadGalleryImage,
} from "@/server/admin/gallery-actions";
import { ActionButton, RefreshButton, useFormAction } from "./controls";
import { useToast } from "./Toast";
import { btnPrimary, btnSecondary, Card, Field, inputCls } from "./ui";

export type GalleryFormValues = {
  id?: number;
  name: string;
  location: GalleryLocation | null;
  description: string;
  featuredImage: string | null;
  isActive: boolean;
  images: { id: number; image: string; caption: string }[];
};

const ACCEPT = "image/jpeg,image/png,image/webp,image/avif,image/gif";
const ACCEPTED_TYPES = ACCEPT.split(",");
/** Matches MAX_IMAGE_BYTES in src/server/uploads.ts; checked here too so big files fail before uploading. */
const MAX_BYTES = 3 * 1024 * 1024;

function FeaturedImageField({ initial, error }: { initial: string | null; error?: string }) {
  const [preview, setPreview] = useState(initial);
  const [removed, setRemoved] = useState(false);
  const shown = preview && !removed;
  return (
    <div>
      <span className="mb-1.5 block text-sm font-bold text-heading">Featured image</span>
      <div className="flex items-start gap-4">
        <label
          className={`flex h-11 min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-lg border border-dashed bg-soft px-3 text-sm font-semibold text-body transition hover:border-brand hover:text-brand ${
            error ? "border-red-400" : "border-line"
          }`}
        >
          <ImagePlus className="size-4 shrink-0" />
          <span className="truncate">{shown ? "Change image" : "Choose file"}</span>
          <input
            type="file"
            name="featuredImage"
            accept={ACCEPT}
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
        <div className="relative grid size-24 shrink-0 place-items-center overflow-hidden rounded-xl border border-line bg-soft">
          {shown ? (
            <Image src={preview} alt="Featured image preview" fill sizes="96px" unoptimized className="object-cover" />
          ) : (
            <ImageIcon className="size-8 text-body/40" />
          )}
        </div>
      </div>
      <input type="hidden" name="removeFeaturedImage" value={removed ? "on" : ""} />
      {error ? <p className="mt-1.5 text-xs font-semibold text-red-500">{error}</p> : <p className="mt-1.5 text-xs text-body">JPG, PNG, WEBP, AVIF or GIF · max 3 MB.</p>}
      {shown && (
        <button type="button" onClick={() => setRemoved(true)} className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-red-500 hover:underline">
          <X className="size-3.5" /> Remove
        </button>
      )}
    </div>
  );
}

/** Multi-file upload; each file goes to the server in its own request. */
function ImageUploader({ galleryId }: { galleryId: number }) {
  const router = useRouter();
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  async function upload(files: File[]) {
    if (!files.length || progress) return;
    const bad = files.filter((f) => !ACCEPTED_TYPES.includes(f.type) || f.size > MAX_BYTES);
    for (const f of bad) toast(false, `${f.name}: ${f.size > MAX_BYTES ? "larger than 3 MB" : "not a JPG, PNG, WEBP, AVIF or GIF"} — skipped.`);
    const good = files.filter((f) => !bad.includes(f));
    if (!good.length) return;

    let ok = 0;
    setProgress({ done: 0, total: good.length });
    for (const [i, file] of good.entries()) {
      const fd = new FormData();
      fd.append("image", file);
      try {
        const res = await uploadGalleryImage(galleryId, fd);
        if (res?.ok) ok++;
        else if (res?.message) toast(false, res.message);
      } catch {
        toast(false, `${file.name}: upload failed.`);
      }
      setProgress({ done: i + 1, total: good.length });
    }
    setProgress(null);
    if (input.current) input.current.value = "";
    if (ok) toast(true, `${ok} image${ok === 1 ? "" : "s"} uploaded.`);
    router.refresh();
  }

  return (
    <label
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        upload(Array.from(e.dataTransfer.files));
      }}
      className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition hover:border-brand ${
        dragging ? "border-brand bg-brand-light/40" : "border-line bg-soft"
      } ${progress ? "pointer-events-none opacity-80" : ""}`}
    >
      {progress ? <Loader2 className="size-8 animate-spin text-brand" /> : <UploadCloud className="size-8 text-body" />}
      <span className="text-base font-bold tracking-wide text-heading uppercase">
        {progress ? `Uploading ${progress.done + (progress.done < progress.total ? 1 : 0)} of ${progress.total}…` : "Click to upload images (multiple)"}
      </span>
      <span className="text-xs text-body">or drag and drop · JPG, PNG, WEBP, AVIF, GIF · max 3 MB each</span>
      <input
        ref={input}
        type="file"
        multiple
        accept={ACCEPT}
        className="sr-only"
        disabled={!!progress}
        onChange={(e) => upload(Array.from(e.target.files ?? []))}
      />
    </label>
  );
}

function CaptionInput({ id, initial }: { id: number; initial: string }) {
  const toast = useToast();
  const [value, setValue] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [pending, start] = useTransition();
  const save = () => {
    if (value.trim() === saved) return;
    start(async () => {
      const res = await updateGalleryImageCaption(id, value);
      if (res?.ok) setSaved(value.trim());
      else if (res?.message) toast(false, res.message);
    });
  };
  return (
    <div className="relative">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            save();
          }
        }}
        maxLength={255}
        placeholder="Caption (optional)"
        aria-label="Image caption"
        className={`${inputCls} h-9 pr-8 text-xs`}
      />
      <span className="absolute top-1/2 right-2.5 -translate-y-1/2 text-body">
        {pending ? <Loader2 className="size-3.5 animate-spin" /> : value.trim() === saved && saved ? <Check className="size-3.5 text-leaf" /> : null}
      </span>
    </div>
  );
}

function ImageGrid({ galleryId, images }: { galleryId: number; images: GalleryFormValues["images"] }) {
  const toast = useToast();
  const [order, setOrder] = useState(images);
  const [pending, start] = useTransition();

  const move = (index: number, dir: -1 | 1) => {
    const next = [...order];
    [next[index], next[index + dir]] = [next[index + dir], next[index]];
    const previous = order;
    setOrder(next);
    start(async () => {
      const res = await reorderGalleryImages(galleryId, next.map((i) => i.id));
      if (!res?.ok) {
        setOrder(previous);
        if (res?.message) toast(false, res.message);
      }
    });
  };

  if (!order.length) {
    return <p className="rounded-xl border border-line bg-soft p-6 text-center text-sm text-body">No images yet — upload some above.</p>;
  }

  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
      {order.map((img, i) => (
        <li key={img.id} className="overflow-hidden rounded-xl border border-line bg-surface">
          <div className="group relative aspect-square bg-soft">
            <Image src={img.image} alt={img.caption || `Gallery image ${i + 1}`} fill sizes="240px" unoptimized className="object-cover" />
            <span className="absolute top-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-bold text-white">{i + 1}</span>
            <div className="absolute top-2 right-2 flex gap-1">
              <button
                type="button"
                disabled={pending || i === 0}
                onClick={() => move(i, -1)}
                aria-label="Move earlier"
                title="Move earlier"
                className="grid size-7 place-items-center rounded-lg bg-white/90 text-heading shadow transition hover:text-brand disabled:opacity-40"
              >
                <ArrowUp className="size-3.5" />
              </button>
              <button
                type="button"
                disabled={pending || i === order.length - 1}
                onClick={() => move(i, 1)}
                aria-label="Move later"
                title="Move later"
                className="grid size-7 place-items-center rounded-lg bg-white/90 text-heading shadow transition hover:text-brand disabled:opacity-40"
              >
                <ArrowDown className="size-3.5" />
              </button>
              <ActionButton
                action={() => deleteGalleryImage(img.id)}
                confirmText="Remove this image from the gallery?"
                label="Remove image"
                className="grid size-7 place-items-center rounded-lg bg-white/90 text-red-500 shadow transition hover:bg-red-50 disabled:opacity-40"
              >
                <Trash2 className="size-3.5" />
              </ActionButton>
            </div>
          </div>
          <div className="p-2">
            <CaptionInput id={img.id} initial={img.caption} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function GalleryForm({ initial }: { initial: GalleryFormValues }) {
  const router = useRouter();
  const { state, onSubmit, pending } = useFormAction<FormState>(saveGallery, null);
  const errors = state?.errors ?? {};
  const isNew = !initial.id;

  // After creating a gallery, move to its edit page so images can be added.
  useEffect(() => {
    if (state?.ok && isNew && state.id) router.replace(`/admin/galleries/${state.id}`);
  }, [state, isNew, router]);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-heading">{isNew ? "Add Gallery" : "Gallery Edit"}</h1>
          <nav aria-label="Breadcrumb" className="mt-1 flex items-center gap-2 text-sm">
            <Link href="/admin" className="font-semibold text-brand hover:underline">
              Dashboard
            </Link>
            <span className="text-body">›</span>
            <Link href="/admin/galleries" className="font-semibold text-brand hover:underline">
              Galleries
            </Link>
            <span className="text-body">›</span>
            <span className="text-body">{isNew ? "Add Gallery" : "Gallery Edit"}</span>
          </nav>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/galleries" className={btnSecondary}>
            <ArrowLeft className="size-4" /> Back
          </Link>
          {!isNew && (
            <Link href="/admin/galleries/new" className={btnSecondary}>
              <Plus className="size-4" /> Add Gallery
            </Link>
          )}
          <RefreshButton />
        </div>
      </div>

      {state && !state.ok && state.errors && (
        <p role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">
          {state.message}
        </p>
      )}

      <div className="space-y-6">
        <Card title={isNew ? "Add Gallery" : "Gallery Edit"}>
          <form onSubmit={onSubmit} encType="multipart/form-data" noValidate className="space-y-5">
            {initial.id && <input type="hidden" name="id" value={initial.id} />}

            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,1fr)]">
              <Field label="Gallery name (*)" htmlFor="name" error={errors.name}>
                <input id="name" name="name" defaultValue={initial.name} aria-invalid={!!errors.name} className={inputCls} placeholder="e.g. Client Logos" />
              </Field>
              <Field label="Gallery location" htmlFor="location" error={errors.location} hint="Where the store shows this gallery.">
                <select id="location" name="location" defaultValue={initial.location ?? ""} className={`${inputCls} cursor-pointer`}>
                  <option value="">Select location</option>
                  {GALLERY_LOCATIONS.map((l) => (
                    <option key={l} value={l}>
                      {GALLERY_LOCATION_LABELS[l]}
                    </option>
                  ))}
                </select>
              </Field>
              <FeaturedImageField initial={initial.featuredImage} error={errors.featuredImage} />
            </div>

            <Field label="Description" htmlFor="description" error={errors.description}>
              <textarea
                id="description"
                name="description"
                rows={5}
                defaultValue={initial.description}
                aria-invalid={!!errors.description}
                placeholder="Enter description"
                className={`${inputCls} h-auto resize-y py-2.5`}
              />
            </Field>

            <Field label="Gallery status" htmlFor="isActive" className="max-w-md">
              <select id="isActive" name="isActive" defaultValue={initial.isActive ? "active" : "inactive"} className={`${inputCls} cursor-pointer`}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </Field>

            <button type="submit" disabled={pending} className={btnPrimary}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              {isNew ? "Create gallery" : "Save changes"}
            </button>
          </form>
        </Card>

        {initial.id ? (
          <Card title={`Gallery images (${initial.images.length})`}>
            <div className="space-y-5">
              <ImageUploader galleryId={initial.id} />
              {/* Keyed on the image list so a server refresh (upload/delete) resets the local order. */}
              <ImageGrid key={initial.images.map((i) => i.id).join(",")} galleryId={initial.id} images={initial.images} />
            </div>
          </Card>
        ) : (
          <p className="rounded-xl border border-dashed border-line bg-soft p-5 text-center text-sm text-body">Create the gallery first, then you can upload its images.</p>
        )}
      </div>
    </>
  );
}
