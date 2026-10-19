"use client";

import Link from "next/link";
import { Settings2, Trash2 } from "lucide-react";
import { deleteGallery, setGalleryActive } from "@/server/admin/gallery-actions";
import { ActionButton } from "./controls";

const iconBtn = "grid size-8 place-items-center rounded-lg text-body transition hover:bg-soft hover:text-brand disabled:opacity-50";

export function GalleryActiveSwitch({ id, isActive }: { id: number; isActive: boolean }) {
  return (
    <ActionButton
      action={() => setGalleryActive(id, !isActive)}
      label={isActive ? "Deactivate gallery" : "Activate gallery"}
      className="inline-flex items-center gap-2 text-xs font-bold disabled:opacity-60"
    >
      <span className={`relative h-5 w-9 rounded-full transition ${isActive ? "bg-brand" : "bg-line"}`}>
        <span className={`absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow transition ${isActive ? "translate-x-4" : ""}`} />
      </span>
      <span className={isActive ? "text-leaf" : "text-body"}>{isActive ? "Active" : "Inactive"}</span>
    </ActionButton>
  );
}

export function GalleryRowActions({ id, name }: { id: number; name: string }) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Link href={`/admin/galleries/${id}`} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-brand-light px-3 text-xs font-bold text-brand transition hover:brightness-95">
        <Settings2 className="size-3.5" /> Config
      </Link>
      <ActionButton
        action={() => deleteGallery(id)}
        confirmText={`Delete gallery “${name}” and all of its images?`}
        label={`Delete ${name}`}
        className={`${iconBtn} hover:bg-red-50! hover:text-red-500!`}
      >
        <Trash2 className="size-4" />
      </ActionButton>
    </div>
  );
}
