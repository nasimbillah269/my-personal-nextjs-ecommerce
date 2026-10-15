"use client";

import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, MessageCircle, Reply, Send } from "lucide-react";
import type { FormState } from "@/server/admin/form-state";
import { submitComment } from "@/server/blog-actions";
import type { PublicComment } from "@/server/blog";

const input =
  "h-11 w-full rounded-lg border border-line bg-white px-3.5 text-sm text-heading outline-none transition placeholder:text-body/60 focus:border-brand focus:ring-4 focus:ring-brand-light aria-invalid:border-red-400";

const formatWhen = (d: Date) =>
  new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Dhaka" });

function CommentForm({ postId, parentId, onCancel }: { postId: number; parentId?: number; onCancel?: () => void }) {
  const [state, action, pending] = useActionState<FormState, FormData>(submitComment, null);
  const errors = state?.errors ?? {};
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) form.current?.reset();
  }, [state]);

  if (state?.ok && parentId) {
    return (
      <p className="mt-3 flex items-center gap-2 rounded-lg bg-brand-light/60 px-4 py-3 text-sm font-semibold text-brand-dark">
        <CheckCircle2 className="size-4" /> {state.message}
      </p>
    );
  }

  return (
    <form
      ref={form}
      // onSubmit rather than action={}, so React doesn't clear what the visitor typed when validation fails.
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => action(data));
      }}
      className="space-y-3"
      noValidate
    >
      <input type="hidden" name="postId" value={postId} />
      {parentId && <input type="hidden" name="parentId" value={parentId} />}
      {/* Honeypot for bots — hidden from people and screen readers. */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <input name="authorName" placeholder="Your name *" aria-label="Your name" aria-invalid={!!errors.authorName} className={input} />
          {errors.authorName && <p className="mt-1 text-xs font-semibold text-red-500">{errors.authorName}</p>}
        </div>
        <div>
          <input
            name="authorEmail"
            type="email"
            placeholder="Email (optional, not shown)"
            aria-label="Email"
            aria-invalid={!!errors.authorEmail}
            className={input}
          />
          {errors.authorEmail && <p className="mt-1 text-xs font-semibold text-red-500">{errors.authorEmail}</p>}
        </div>
      </div>
      <div>
        <textarea
          name="content"
          rows={parentId ? 3 : 4}
          placeholder={parentId ? "Write a reply…" : "Share your thoughts…"}
          aria-label="Comment"
          aria-invalid={!!errors.content}
          className={`${input} h-auto resize-y py-2.5`}
        />
        {errors.content && <p className="mt-1 text-xs font-semibold text-red-500">{errors.content}</p>}
      </div>
      {state?.message && !state.errors && (
        <p
          role="status"
          className={`flex items-center gap-2 text-sm font-semibold ${state.ok ? "text-brand-dark" : "text-red-500"}`}
        >
          {state.ok && <CheckCircle2 className="size-4" />} {state.message}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 items-center gap-2 rounded-lg bg-brand px-5 text-sm font-bold text-white transition hover:bg-brand-dark disabled:opacity-60"
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          {parentId ? "Post reply" : "Post comment"}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="h-11 rounded-lg px-4 text-sm font-bold text-body hover:text-heading">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

function CommentItem({ c, postId, canReply }: { c: PublicComment; postId: number; canReply: boolean }) {
  const [replying, setReplying] = useState(false);
  return (
    <li>
      <div className="flex gap-3">
        <span
          className={`grid size-10 shrink-0 place-items-center rounded-full text-sm font-bold ${
            c.isAdmin ? "bg-brand text-white" : "bg-soft text-heading"
          }`}
          aria-hidden="true"
        >
          {c.authorName.trim()[0]?.toUpperCase() ?? "?"}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm">
            <span className="font-bold text-heading">{c.authorName}</span>
            {c.isAdmin && <span className="ml-2 rounded bg-brand-light px-1.5 py-0.5 text-[11px] font-bold text-brand-dark">Author</span>}
            <span className="ml-2 text-xs text-body">{formatWhen(c.createdAt)}</span>
          </p>
          <p className="mt-1 text-sm leading-6 whitespace-pre-line text-heading/85">{c.content}</p>
          {canReply && !replying && (
            <button
              type="button"
              onClick={() => setReplying(true)}
              className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-brand hover:underline"
            >
              <Reply className="size-3.5" /> Reply
            </button>
          )}
          {replying && (
            <div className="mt-3">
              <CommentForm postId={postId} parentId={c.id} onCancel={() => setReplying(false)} />
            </div>
          )}
          {c.replies.length > 0 && (
            <ul className="mt-4 space-y-4 border-l-2 border-line pl-4">
              {c.replies.map((r) => (
                <CommentItem key={r.id} c={r} postId={postId} canReply={false} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </li>
  );
}

export function BlogComments({
  postId,
  comments,
  count,
  allowComments,
}: {
  postId: number;
  comments: PublicComment[];
  count: number;
  allowComments: boolean;
}) {
  return (
    <section id="comments" className="mt-12 scroll-mt-28 border-t border-line pt-8">
      <h2 className="flex items-center gap-2 text-xl font-bold text-heading">
        <MessageCircle className="size-5 text-brand" />
        {count} Comment{count === 1 ? "" : "s"}
      </h2>

      {comments.length > 0 && (
        <ul className="mt-6 space-y-6">
          {comments.map((c) => (
            <CommentItem key={c.id} c={c} postId={postId} canReply={allowComments} />
          ))}
        </ul>
      )}

      {allowComments ? (
        <div className="mt-8 rounded-2xl border border-line bg-soft/50 p-5 sm:p-6">
          <h3 className="mb-1 font-bold text-heading">Leave a comment</h3>
          <p className="mb-4 text-xs text-body">Comments appear after a quick review.</p>
          <CommentForm postId={postId} />
        </div>
      ) : (
        <p className="mt-6 text-sm text-body">Comments are closed for this post.</p>
      )}
    </section>
  );
}
