"use client";

import Link from "next/link";
import { Settings2, Trash2 } from "lucide-react";
import { deleteMenu } from "@/server/admin/menu-actions";
import { ActionButton } from "./controls";

export function MenuRowActions({ id, name }: { id: number; name: string }) {
  return (
    <div className="flex items-center justify-end gap-2">
      <Link
        href={`/admin/menus/${id}`}
        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line px-3 text-xs font-bold text-heading transition hover:border-brand hover:text-brand"
      >
        <Settings2 className="size-3.5" /> Config
      </Link>
      <ActionButton
        action={() => deleteMenu(id)}
        confirmText={`Delete the menu “${name}”? The store falls back to its default links there.`}
        label={`Delete ${name}`}
        className="grid size-8 place-items-center rounded-lg border border-red-200 text-red-500 transition hover:bg-red-50 disabled:opacity-50"
      >
        <Trash2 className="size-4" />
      </ActionButton>
    </div>
  );
}
