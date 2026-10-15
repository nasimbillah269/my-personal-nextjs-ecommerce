"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, Loader2, Reply, ShieldAlert, Trash2, Undo2 } from "lucide-react";
import type { FormState } from "@/server/admin/form-state";
import { deleteComment, deleteSpamComments, replyToComment, setCommentStatus } from "@/server/admin/post-actions";
import { ActionButton, useFormAction } from "./controls";
import { btnDanger, btnPrimary, btnSecondary, formatDateTime, inputCls } from "./ui";

export type CommentRowData = {
  id: number;
  parentId: number | null;
  isAdmin: boolean;
  authorName: string;
  authorEmail: string;
  content: string;
  status: "pending" | "approved" | "spam";
  createdAt: Date;
  postTitle: string;
  postSlug: string;
};

const statusMeta = {
  pending: { label: "Pending", className: "bg-amber-100 text-amber-700" },
  approved: { label: "Approved", className: "bg-emerald-100 text-emerald-700" },
  spam: { label: "Spam", className: "bg-rose-100 text-rose-700" },
};

const actionBtn =
  "inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold transition disabled:opacity-50";

function ReplyForm({ parentId, onDone }: { parentId: number; onDone: () => void }) {
  const { state, onSubmit, pending } = useFormAction<FormState>(replyToComment, null);
  useEffect(() => {
    if (state?.ok) onDone();
  }, [state, onDone]);

  return (
    <form onSubmit={onSubmit} className="mt-3 space-y-2">
      <input type="hidden" name="parentId" value={parentId} />
      <textarea
        name="content"
        rows={3}
        autoFocus
        aria-label="Your reply"
        aria-invalid={!!state?.errors?.content}
        placeholder="Write a reply… it is published straight away."
        className={`${inputCls} h-auto resize-y py-2.5`}
      />
      {state?.errors?.content && <p className="text-xs font-semibold text-red-500">{state.errors.content}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className={`${btnPrimary} h-9`}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Reply className="size-4" />} Post reply
        </button>
        <button type="button" onClick={onDone} className={`${btnSecondary} h-9`}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export function CommentRow({ c }: { c: CommentRowData }) {
  const [replying, setReplying] = useState(false);
  const meta = statusMeta[c.status];
  const initials = c.authorName
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <li className={`flex gap-4 px-5 py-4 ${c.status === "pending" ? "bg-amber-50/40" : ""}`}>
      <span
        className={`grid size-10 shrink-0 place-items-center rounded-full text-sm font-bold ${
          c.isAdmin ? "bg-linear-to-br from-brand to-emerald-500 text-white" : "bg-soft text-heading"
        }`}
        aria-hidden="true"
      >
        {initials || "?"}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <span className="font-bold text-heading">{c.authorName}</span>
          {c.isAdmin && <span className="rounded-md bg-brand-light px-1.5 py-0.5 text-[11px] font-bold text-brand-dark">Admin</span>}
          {c.authorEmail && !c.isAdmin && (
            <a href={`mailto:${c.authorEmail}`} className="text-xs text-body hover:text-brand">
              {c.authorEmail}
            </a>
          )}
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${meta.className}`}>{meta.label}</span>
        </div>
        <p className="mt-0.5 text-xs text-body">
          {c.parentId ? "Reply on " : "On "}
          <Link href={`/blog/${c.postSlug}#comments`} target="_blank" className="font-semibold text-brand hover:underline">
            {c.postTitle}
          </Link>{" "}
          · {formatDateTime(c.createdAt)}
        </p>
        <p className="mt-2 text-sm leading-6 whitespace-pre-line text-heading/85">{c.content}</p>

        <div className="mt-2 -ml-2 flex flex-wrap items-center gap-1">
          {c.status !== "approved" && (
            <ActionButton action={() => setCommentStatus(c.id, "approved")} className={`${actionBtn} text-emerald-700 hover:bg-emerald-50`}>
              <Check className="size-3.5" /> Approve
            </ActionButton>
          )}
          {c.status === "approved" && !c.isAdmin && (
            <ActionButton action={() => setCommentStatus(c.id, "pending")} className={`${actionBtn} text-amber-700 hover:bg-amber-50`}>
              <Undo2 className="size-3.5" /> Unapprove
            </ActionButton>
          )}
          {c.status !== "spam" && !c.isAdmin && (
            <ActionButton action={() => setCommentStatus(c.id, "spam")} className={`${actionBtn} text-rose-600 hover:bg-rose-50`}>
              <ShieldAlert className="size-3.5" /> Spam
            </ActionButton>
          )}
          {c.status !== "spam" && (
            <button type="button" onClick={() => setReplying((r) => !r)} className={`${actionBtn} text-brand hover:bg-brand-light`}>
              <Reply className="size-3.5" /> Reply
            </button>
          )}
          <ActionButton
            action={() => deleteComment(c.id)}
            confirmText={c.parentId ? "Delete this reply?" : "Delete this comment and its replies?"}
            className={`${actionBtn} text-body hover:bg-red-50 hover:text-red-500`}
          >
            <Trash2 className="size-3.5" /> Delete
          </ActionButton>
        </div>

        {replying && <ReplyForm parentId={c.id} onDone={() => setReplying(false)} />}
      </div>
    </li>
  );
}

export function EmptySpamButton() {
  return (
    <ActionButton action={deleteSpamComments} confirmText="Permanently delete every spam comment?" className={btnDanger}>
      <Trash2 className="size-4" /> Empty spam
    </ActionButton>
  );
}
