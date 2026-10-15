"use client";

import Link from "next/link";
import { ExternalLink, Pencil, Trash2 } from "lucide-react";
import { deletePost, setPostStatus } from "@/server/admin/post-actions";
import { ActionButton } from "./controls";

const iconBtn = "grid size-8 place-items-center rounded-lg text-body transition hover:bg-soft hover:text-brand disabled:opacity-50";

export function PostRowActions({ id, slug, title, published }: { id: number; slug: string; title: string; published: boolean }) {
  return (
    <div className="flex items-center justify-end gap-1">
      <ActionButton
        action={() => setPostStatus(id, published ? "draft" : "published")}
        className="rounded-lg px-2 py-1 text-xs font-bold whitespace-nowrap text-brand hover:bg-brand-light disabled:opacity-50"
      >
        {published ? "Unpublish" : "Publish"}
      </ActionButton>
      <Link href={`/admin/posts/${id}`} aria-label={`Edit ${title}`} title="Edit" className={iconBtn}>
        <Pencil className="size-4" />
      </Link>
      {published && (
        <Link href={`/blog/${slug}`} target="_blank" aria-label={`View ${title} on the blog`} title="View on blog" className={iconBtn}>
          <ExternalLink className="size-4" />
        </Link>
      )}
      <ActionButton
        action={() => deletePost(id)}
        confirmText={`Delete “${title}”? Its comments are deleted too.`}
        label={`Delete ${title}`}
        className={`${iconBtn} hover:bg-red-50! hover:text-red-500!`}
      >
        <Trash2 className="size-4" />
      </ActionButton>
    </div>
  );
}
