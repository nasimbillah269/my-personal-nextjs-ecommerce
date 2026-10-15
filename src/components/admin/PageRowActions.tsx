"use client";

import Link from "next/link";
import { ExternalLink, Pencil, Star, Trash2 } from "lucide-react";
import { deletePage, setPageFlag } from "@/server/admin/page-actions";
import { ActionButton } from "./controls";

const iconBtn = "grid size-8 place-items-center rounded-lg text-body transition hover:bg-soft hover:text-brand disabled:opacity-50";

export function PageActiveSwitch({ id, isActive }: { id: number; isActive: boolean }) {
  return (
    <ActionButton
      action={() => setPageFlag(id, "isActive", !isActive)}
      label={isActive ? "Hide from store" : "Show in store"}
      className="inline-flex items-center gap-2 text-xs font-bold disabled:opacity-60"
    >
      <span className={`relative h-5 w-9 rounded-full transition ${isActive ? "bg-brand" : "bg-line"}`}>
        <span className={`absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow transition ${isActive ? "translate-x-4" : ""}`} />
      </span>
      <span className={isActive ? "text-leaf" : "text-body"}>{isActive ? "Active" : "Hidden"}</span>
    </ActionButton>
  );
}

export function PageFeaturedButton({ id, isFeatured }: { id: number; isFeatured: boolean }) {
  return (
    <ActionButton
      action={() => setPageFlag(id, "isFeatured", !isFeatured)}
      label={isFeatured ? "Remove from footer" : "Show in footer"}
      className={`${iconBtn} ${isFeatured ? "text-amber-500" : ""}`}
    >
      <Star className="size-4" fill={isFeatured ? "currentColor" : "none"} />
    </ActionButton>
  );
}

export function PageRowActions({ id, slug, title, isActive }: { id: number; slug: string; title: string; isActive: boolean }) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Link href={`/admin/pages/${id}`} aria-label={`Edit ${title}`} title="Edit" className={iconBtn}>
        <Pencil className="size-4" />
      </Link>
      {isActive && (
        <Link href={`/${slug}`} target="_blank" aria-label={`View ${title} in store`} title="View in store" className={iconBtn}>
          <ExternalLink className="size-4" />
        </Link>
      )}
      <ActionButton
        action={() => deletePage(id)}
        confirmText={`Delete page “${title}”?`}
        label={`Delete ${title}`}
        className={`${iconBtn} hover:bg-red-50! hover:text-red-500!`}
      >
        <Trash2 className="size-4" />
      </ActionButton>
    </div>
  );
}
