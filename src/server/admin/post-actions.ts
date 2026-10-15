"use server";

import { and, count, eq, inArray, ne, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/db";
import { COMMENT_STATUSES, POST_STATUSES } from "@/lib/constants";
import { slugify } from "@/lib/post-content";
import { requireAdmin } from "../auth";
import { deleteImage, saveImage, validateImage } from "../uploads";
import { firstErrors, type FormState } from "./form-state";

const { posts, postCategories, postTags, postTagLinks, postComments } = schema;

const slugField = (max: number) =>
  z
    .string()
    .trim()
    .min(2, "Slug is required")
    .max(max)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes only");

function revalidatePosts(id?: number | null) {
  revalidatePath("/admin/posts");
  if (id) revalidatePath(`/admin/posts/${id}`);
  revalidatePath("/blog", "layout");
}

/* ---------- Posts ---------- */

const postSchema = z.object({
  title: z.string().trim().min(3, "Title is required").max(255),
  slug: slugField(160),
  excerpt: z.string().trim().max(500, "Keep the excerpt under 500 characters"),
  content: z.string().trim().min(20, "Write the post (20+ characters)").max(60000),
  categoryId: z.preprocess((v) => (v === "" || v == null ? null : v), z.coerce.number().int().positive().nullable()),
  status: z.enum(POST_STATUSES),
  // <input type="datetime-local"> sends "YYYY-MM-DDTHH:mm" in the admin's clock; the store runs on Dhaka time.
  publishedAt: z.preprocess((v) => (v ? new Date(`${v}:00+06:00`) : null), z.date("Enter a valid date").nullable()),
  allowComments: z.boolean(),
  tags: z
    .string()
    .max(1000)
    .transform((v) => [...new Map(v.split(",").map((t) => t.trim().slice(0, 80)).filter(Boolean).map((t) => [slugify(t, 80), t])).entries()])
    .pipe(z.array(z.tuple([z.string().min(1, "Tags need at least one letter or number"), z.string()])).max(20, "Use 20 tags or fewer")),
});

/** Finds or creates each tag and returns their ids. */
async function resolveTags(tags: [slug: string, name: string][]) {
  if (!tags.length) return [];
  const slugs = tags.map(([s]) => s);
  const existing = await db.select({ id: postTags.id, slug: postTags.slug }).from(postTags).where(inArray(postTags.slug, slugs));
  const missing = tags.filter(([s]) => !existing.some((e) => e.slug === s));
  if (missing.length) {
    await db.insert(postTags).values(missing.map(([slug, name]) => ({ slug, name }))).onDuplicateKeyUpdate({ set: { slug: sql`${postTags.slug}` } });
    return (await db.select({ id: postTags.id }).from(postTags).where(inArray(postTags.slug, slugs))).map((t) => t.id);
  }
  return existing.map((e) => e.id);
}

export async function savePost(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin("posts");
  const id = Number(formData.get("id")) || null;
  const parsed = postSchema.safeParse({ ...Object.fromEntries(formData), allowComments: formData.get("allowComments") === "on" });
  const errors = parsed.success ? {} : firstErrors(parsed.error);

  const image = formData.get("coverImage");
  const newImage = image instanceof File && image.size > 0 ? image : null;
  if (newImage) {
    const imageError = validateImage(newImage);
    if (imageError) errors.coverImage = imageError;
  }
  if (!parsed.success || Object.keys(errors).length) {
    return { ok: false, message: "Please fix the highlighted fields.", errors };
  }
  const { tags, ...data } = parsed.data;

  const [clash] = await db
    .select({ id: posts.id })
    .from(posts)
    .where(id ? and(eq(posts.slug, data.slug), ne(posts.id, id)) : eq(posts.slug, data.slug))
    .limit(1);
  if (clash) return { ok: false, message: "Please fix the highlighted fields.", errors: { slug: "Another post already uses this URL slug." } };

  if (data.categoryId) {
    const [cat] = await db.select({ id: postCategories.id }).from(postCategories).where(eq(postCategories.id, data.categoryId)).limit(1);
    if (!cat) return { ok: false, message: "Please fix the highlighted fields.", errors: { categoryId: "That category no longer exists." } };
  }

  const existing = id
    ? (await db.select({ coverImage: posts.coverImage, publishedAt: posts.publishedAt }).from(posts).where(eq(posts.id, id)).limit(1))[0]
    : null;
  if (id && !existing) return { ok: false, message: "This post no longer exists." };

  let coverImage = existing?.coverImage ?? null;
  if (newImage) coverImage = await saveImage(newImage, "posts");
  else if (formData.get("removeCoverImage") === "on") coverImage = null;

  // Publishing without a date stamps it now; drafts keep whatever date they had.
  const publishedAt = data.publishedAt ?? (data.status === "published" ? (existing?.publishedAt ?? new Date()) : null);
  const tagIds = await resolveTags(tags);
  const values = { ...data, publishedAt, coverImage };

  let postId = id;
  await db.transaction(async (tx) => {
    if (postId) {
      await tx.update(posts).set(values).where(eq(posts.id, postId));
      await tx.delete(postTagLinks).where(eq(postTagLinks.postId, postId));
    } else {
      [{ id: postId }] = await tx.insert(posts).values({ ...values, authorId: admin.id }).$returningId();
    }
    if (tagIds.length) await tx.insert(postTagLinks).values(tagIds.map((tagId) => ({ postId: postId!, tagId })));
  });

  if (existing?.coverImage && existing.coverImage !== coverImage) await deleteImage(existing.coverImage);

  revalidatePosts(postId);
  revalidatePath("/admin/posts/tags");
  return { ok: true, message: id ? "Post updated." : data.status === "published" ? "Post published." : "Draft saved.", id: postId! };
}

export async function deletePost(id: number): Promise<FormState> {
  await requireAdmin("posts");
  const [row] = await db.select({ coverImage: posts.coverImage }).from(posts).where(eq(posts.id, id)).limit(1);
  if (!row) return { ok: false, message: "Post not found." };
  await db.delete(posts).where(eq(posts.id, id));
  await deleteImage(row.coverImage);
  revalidatePosts();
  revalidatePath("/admin/posts/comments");
  return { ok: true, message: "Post deleted." };
}

export async function setPostStatus(id: number, status: (typeof POST_STATUSES)[number]): Promise<FormState> {
  await requireAdmin("posts");
  const [row] = await db.select({ publishedAt: posts.publishedAt }).from(posts).where(eq(posts.id, id)).limit(1);
  if (!row) return { ok: false, message: "Post not found." };
  await db
    .update(posts)
    .set({ status, publishedAt: status === "published" ? (row.publishedAt ?? new Date()) : row.publishedAt })
    .where(eq(posts.id, id));
  revalidatePosts(id);
  return { ok: true, message: status === "published" ? "Post published." : "Post moved to drafts." };
}

/* ---------- Post categories ---------- */

const postCategorySchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(120),
  slug: slugField(120),
  description: z.string().trim().max(500),
  sortOrder: z.coerce.number().int().min(0).max(10000),
});

export async function savePostCategory(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin("posts");
  const id = Number(formData.get("id")) || null;
  const parsed = postCategorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Please fix the highlighted fields.", errors: firstErrors(parsed.error) };

  const c = postCategories;
  const [clash] = await db
    .select({ id: c.id })
    .from(c)
    .where(id ? and(eq(c.slug, parsed.data.slug), ne(c.id, id)) : eq(c.slug, parsed.data.slug))
    .limit(1);
  if (clash) return { ok: false, message: "Please fix the highlighted fields.", errors: { slug: "This slug is already used." } };

  if (id) await db.update(c).set(parsed.data).where(eq(c.id, id));
  else await db.insert(c).values(parsed.data);

  revalidatePath("/admin/posts/categories");
  revalidatePosts();
  return { ok: true, message: id ? "Category updated." : "Category created." };
}

export async function deletePostCategory(id: number): Promise<FormState> {
  await requireAdmin("posts");
  const [{ n }] = await db.select({ n: count() }).from(posts).where(eq(posts.categoryId, id));
  await db.delete(postCategories).where(eq(postCategories.id, id));
  revalidatePath("/admin/posts/categories");
  revalidatePosts();
  return { ok: true, message: n ? `Category deleted. ${n} post${n === 1 ? " is" : "s are"} now uncategorised.` : "Category deleted." };
}

/* ---------- Tags ---------- */

const tagSchema = z.object({ name: z.string().trim().min(1, "Name is required").max(80), slug: slugField(80) });

export async function saveTag(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin("posts");
  const id = Number(formData.get("id")) || null;
  const parsed = tagSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Please fix the highlighted fields.", errors: firstErrors(parsed.error) };

  const [clash] = await db
    .select({ id: postTags.id })
    .from(postTags)
    .where(id ? and(eq(postTags.slug, parsed.data.slug), ne(postTags.id, id)) : eq(postTags.slug, parsed.data.slug))
    .limit(1);
  if (clash) return { ok: false, message: "Please fix the highlighted fields.", errors: { slug: "This slug is already used." } };

  if (id) await db.update(postTags).set(parsed.data).where(eq(postTags.id, id));
  else await db.insert(postTags).values(parsed.data);

  revalidatePath("/admin/posts/tags");
  revalidatePosts();
  return { ok: true, message: id ? "Tag updated." : "Tag created." };
}

export async function deleteTag(id: number): Promise<FormState> {
  await requireAdmin("posts");
  await db.delete(postTags).where(eq(postTags.id, id));
  revalidatePath("/admin/posts/tags");
  revalidatePosts();
  return { ok: true, message: "Tag deleted." };
}

/* ---------- Comments ---------- */

function revalidateComments() {
  revalidatePath("/admin/posts/comments");
  revalidatePath("/admin/posts");
  revalidatePath("/blog", "layout");
}

export async function setCommentStatus(id: number, status: (typeof COMMENT_STATUSES)[number]): Promise<FormState> {
  await requireAdmin("posts");
  if (!COMMENT_STATUSES.includes(status)) return { ok: false, message: "Unknown status." };
  await db.update(postComments).set({ status }).where(eq(postComments.id, id));
  revalidateComments();
  const messages = { approved: "Comment approved.", pending: "Comment moved back to pending.", spam: "Comment marked as spam." };
  return { ok: true, message: messages[status] };
}

export async function deleteComment(id: number): Promise<FormState> {
  await requireAdmin("posts");
  // Replies have no FK to their parent, so remove them together.
  await db.delete(postComments).where(or(eq(postComments.id, id), eq(postComments.parentId, id)));
  revalidateComments();
  return { ok: true, message: "Comment deleted." };
}

export async function deleteSpamComments(): Promise<FormState> {
  await requireAdmin("posts");
  const ids = (await db.select({ id: postComments.id }).from(postComments).where(eq(postComments.status, "spam"))).map((r) => r.id);
  if (!ids.length) return { ok: true, message: "No spam to delete." };
  await db.delete(postComments).where(or(inArray(postComments.id, ids), inArray(postComments.parentId, ids)));
  revalidateComments();
  return { ok: true, message: `Deleted ${ids.length} spam comment${ids.length === 1 ? "" : "s"}.` };
}

const replySchema = z.object({
  parentId: z.coerce.number().int().positive(),
  content: z.string().trim().min(2, "Write a reply").max(3000),
});

export async function replyToComment(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin("posts");
  const parsed = replySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Please fix the highlighted fields.", errors: firstErrors(parsed.error) };

  const [parent] = await db
    .select({ id: postComments.id, postId: postComments.postId, parentId: postComments.parentId, status: postComments.status })
    .from(postComments)
    .where(eq(postComments.id, parsed.data.parentId))
    .limit(1);
  if (!parent) return { ok: false, message: "That comment no longer exists." };

  await db.transaction(async (tx) => {
    // Replying to a comment implies it's fine to show it.
    if (parent.status !== "approved") await tx.update(postComments).set({ status: "approved" }).where(eq(postComments.id, parent.id));
    await tx.insert(postComments).values({
      postId: parent.postId,
      // Keep threads one level deep: a reply to a reply hangs off the top comment.
      parentId: parent.parentId ?? parent.id,
      adminId: admin.id,
      authorName: admin.name,
      authorEmail: admin.email,
      content: parsed.data.content,
      status: "approved",
    });
  });
  revalidateComments();
  return { ok: true, message: "Reply posted." };
}
