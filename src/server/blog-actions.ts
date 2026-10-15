"use server";

import { and, count, eq, gte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/db";
import { firstErrors, type FormState } from "./admin/form-state";
import { canComment, commentParentOk } from "./blog";

const commentSchema = z.object({
  postId: z.coerce.number().int().positive(),
  parentId: z.preprocess((v) => (v ? v : null), z.coerce.number().int().positive().nullable()),
  authorName: z.string().trim().min(2, "Enter your name").max(120),
  authorEmail: z.union([z.literal(""), z.email("Enter a valid email").max(191)]),
  content: z.string().trim().min(3, "Write a comment").max(3000, "Keep it under 3000 characters"),
});

export async function submitComment(_prev: FormState, formData: FormData): Promise<FormState> {
  // Honeypot: real visitors never see or fill this field.
  if (formData.get("website")) return { ok: true, message: "Thanks! Your comment is awaiting approval." };

  const parsed = commentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Please fix the highlighted fields.", errors: firstErrors(parsed.error) };
  const data = parsed.data;

  if (!(await canComment(data.postId))) return { ok: false, message: "Comments are closed for this post." };
  if (data.parentId && !(await commentParentOk(data.postId, data.parentId))) {
    return { ok: false, message: "The comment you replied to is no longer available." };
  }

  // Light flood control: at most 5 pending comments per post in 10 minutes.
  const c = schema.postComments;
  const [{ n }] = await db
    .select({ n: count() })
    .from(c)
    .where(and(eq(c.postId, data.postId), eq(c.status, "pending"), gte(c.createdAt, new Date(Date.now() - 10 * 60_000))));
  if (n >= 5) return { ok: false, message: "Too many comments right now — please try again in a few minutes." };

  await db.insert(c).values({ ...data, status: "pending" });
  revalidatePath("/admin/posts/comments");
  return { ok: true, message: "Thanks! Your comment is awaiting approval." };
}
