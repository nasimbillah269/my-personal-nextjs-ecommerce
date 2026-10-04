"use client";

import Link from "next/link";
import { ExternalLink, Pencil, Trash2 } from "lucide-react";
import { deleteProduct, setProductActive } from "@/server/admin/product-actions";
import { ActionButton } from "./controls";

const iconBtn = "grid size-8 place-items-center rounded-lg text-body transition hover:bg-soft hover:text-brand disabled:opacity-50";

export function ActiveSwitch({ id, isActive }: { id: number; isActive: boolean }) {
  return (
    <ActionButton
      action={() => setProductActive(id, !isActive)}
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

export function ProductRowActions({ id, slug, name }: { id: number; slug: string; name: string }) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Link href={`/admin/products/${id}`} aria-label={`Edit ${name}`} title="Edit" className={iconBtn}>
        <Pencil className="size-4" />
      </Link>
      <Link href={`/products/${slug}`} target="_blank" aria-label={`View ${name} in store`} title="View in store" className={iconBtn}>
        <ExternalLink className="size-4" />
      </Link>
      <ActionButton
        action={() => deleteProduct(id)}
        confirmText={`Delete “${name}”? Past orders keep their copy of the product.`}
        label={`Delete ${name}`}
        className={`${iconBtn} hover:bg-red-50! hover:text-red-500!`}
      >
        <Trash2 className="size-4" />
      </ActionButton>
    </div>
  );
}
