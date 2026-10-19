import "server-only";
import { and, asc, count, desc, eq, like, lte, ne, or, sql, type SQL } from "drizzle-orm";
import { cache } from "react";
import { db, schema } from "@/db";
import { outer } from "@/db/sql";

const { posts, postCategories, postTags, postTagLinks, postComments, admins } = schema;

export const BLOG_PAGE_SIZE = 9;

/** Published and not scheduled for later. */
const isLive = () => and(eq(posts.status, "published"), lte(posts.publishedAt, new Date()))!;

const cardFields = {
  id: posts.id,
  slug: posts.slug,
  title: posts.title,
  excerpt: posts.excerpt,
  content: posts.content,
  coverImage: posts.coverImage,
  publishedAt: posts.publishedAt,
  categoryName: postCategories.name,
  categorySlug: postCategories.slug,
};

/** Excerpt, or the first words of the post with its markup stripped. */
function summary(excerpt: string, content: string, max = 180) {
  if (excerpt) return excerpt;
  const plain = content
    .replace(/^#{2,3}\s+|^[->]\s+|^\d+[.)]\s+/gm, "")
    .replace(/\*\*(.+?)\*\*|\*(.+?)\*/g, "$1$2")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
  return plain.length > max ? `${plain.slice(0, max).replace(/\s+\S*$/, "")}…` : plain;
}

export type BlogFilters = { q?: string; category?: string; tag?: string; page: number };

export async function listPublishedPosts(f: BlogFilters) {
  const conds: SQL[] = [isLive()];
  if (f.q) conds.push(or(like(posts.title, `%${f.q}%`), like(posts.excerpt, `%${f.q}%`))!);
  if (f.category) conds.push(eq(postCategories.slug, f.category));
  if (f.tag) {
    conds.push(
      sql`EXISTS (SELECT 1 FROM ${postTagLinks} INNER JOIN ${postTags} ON ${postTags.id} = ${postTagLinks.tagId} WHERE ${postTagLinks.postId} = ${outer(posts.id)} AND ${postTags.slug} = ${f.tag})`,
    );
  }
  const where = and(...conds);

  const [rows, [{ total }]] = await Promise.all([
    db
      .select(cardFields)
      .from(posts)
      .leftJoin(postCategories, eq(posts.categoryId, postCategories.id))
      .where(where)
      .orderBy(desc(posts.publishedAt), desc(posts.id))
      .limit(BLOG_PAGE_SIZE)
      .offset((f.page - 1) * BLOG_PAGE_SIZE),
    db.select({ total: count() }).from(posts).leftJoin(postCategories, eq(posts.categoryId, postCategories.id)).where(where),
  ]);
  return { total, rows: rows.map(({ content, ...r }) => ({ ...r, excerpt: summary(r.excerpt, content) })) };
}

/** Categories and tags that have at least one live post, for the sidebar. */
export const getBlogSidebar = cache(async () => {
  const live = isLive();
  const [categories, tags, recent] = await Promise.all([
    db
      .select({ slug: postCategories.slug, name: postCategories.name, description: postCategories.description, n: count() })
      .from(postCategories)
      .innerJoin(posts, and(eq(posts.categoryId, postCategories.id), live))
      .groupBy(postCategories.id)
      .orderBy(asc(postCategories.sortOrder), asc(postCategories.name)),
    db
      .select({ slug: postTags.slug, name: postTags.name, n: count() })
      .from(postTags)
      .innerJoin(postTagLinks, eq(postTagLinks.tagId, postTags.id))
      .innerJoin(posts, and(eq(posts.id, postTagLinks.postId), live))
      .groupBy(postTags.id)
      .orderBy(desc(count()), asc(postTags.name))
      .limit(30),
    db
      .select({ slug: posts.slug, title: posts.title, coverImage: posts.coverImage, publishedAt: posts.publishedAt })
      .from(posts)
      .where(live)
      .orderBy(desc(posts.publishedAt))
      .limit(5),
  ]);
  return { categories, tags, recent };
});

export type PublicComment = {
  id: number;
  authorName: string;
  isAdmin: boolean;
  content: string;
  createdAt: Date;
  replies: PublicComment[];
};

export const getPublishedPost = cache(async (slug: string) => {
  const [post] = await db
    .select({
      id: posts.id,
      slug: posts.slug,
      title: posts.title,
      excerpt: posts.excerpt,
      content: posts.content,
      coverImage: posts.coverImage,
      allowComments: posts.allowComments,
      publishedAt: posts.publishedAt,
      updatedAt: posts.updatedAt,
      categoryId: posts.categoryId,
      categoryName: postCategories.name,
      categorySlug: postCategories.slug,
      authorName: admins.name,
    })
    .from(posts)
    .leftJoin(postCategories, eq(posts.categoryId, postCategories.id))
    .leftJoin(admins, eq(posts.authorId, admins.id))
    .where(and(eq(posts.slug, slug), isLive()))
    .limit(1);
  if (!post) return null;

  const [tags, comments, related] = await Promise.all([
    db
      .select({ slug: postTags.slug, name: postTags.name })
      .from(postTagLinks)
      .innerJoin(postTags, eq(postTags.id, postTagLinks.tagId))
      .where(eq(postTagLinks.postId, post.id))
      .orderBy(asc(postTags.name)),
    db
      .select({
        id: postComments.id,
        parentId: postComments.parentId,
        authorName: postComments.authorName,
        isAdmin: sql<boolean>`${postComments.adminId} IS NOT NULL`.mapWith(Boolean),
        content: postComments.content,
        createdAt: postComments.createdAt,
      })
      .from(postComments)
      .where(and(eq(postComments.postId, post.id), eq(postComments.status, "approved")))
      .orderBy(asc(postComments.createdAt), asc(postComments.id)),
    db
      .select(cardFields)
      .from(posts)
      .leftJoin(postCategories, eq(posts.categoryId, postCategories.id))
      .where(and(isLive(), ne(posts.id, post.id), post.categoryId ? eq(posts.categoryId, post.categoryId) : undefined))
      .orderBy(desc(posts.publishedAt))
      .limit(3),
  ]);

  // One level of threading: replies hang under their top-level comment. Orphans (parent removed/hidden) are dropped.
  const toPublic = (c: (typeof comments)[number]): PublicComment => ({
    id: c.id,
    authorName: c.authorName,
    isAdmin: c.isAdmin,
    content: c.content,
    createdAt: c.createdAt,
    replies: [],
  });
  const top = comments.filter((c) => !c.parentId).map(toPublic);
  const byId = new Map(top.map((c) => [c.id, c]));
  for (const c of comments) if (c.parentId) byId.get(c.parentId)?.replies.push(toPublic(c));

  return {
    post,
    tags,
    comments: top,
    commentCount: top.reduce((n, c) => n + 1 + c.replies.length, 0),
    related: related.map(({ content, ...r }) => ({ ...r, excerpt: summary(r.excerpt, content) })),
    summary: summary(post.excerpt, post.content, 155),
  };
});

/** Whether the post is live and open for comments. */
export async function canComment(postId: number) {
  const [row] = await db
    .select({ id: posts.id })
    .from(posts)
    .where(and(eq(posts.id, postId), isLive(), eq(posts.allowComments, true)))
    .limit(1);
  return !!row;
}

export async function commentParentOk(postId: number, parentId: number) {
  const [row] = await db
    .select({ id: postComments.id })
    .from(postComments)
    .where(and(eq(postComments.id, parentId), eq(postComments.postId, postId), eq(postComments.status, "approved")))
    .limit(1);
  return !!row;
}
