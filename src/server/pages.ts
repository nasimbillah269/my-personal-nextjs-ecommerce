import "server-only";
import { and, asc, eq, lte } from "drizzle-orm";
import { cache } from "react";
import { db, schema } from "@/db";

const { pages } = schema;

/** Active and not scheduled for later. */
const isLive = () => and(eq(pages.isActive, true), lte(pages.publishedAt, new Date()))!;

export const getPublishedPage = cache(async (slug: string) => {
  const [page] = await db
    .select({
      id: pages.id,
      slug: pages.slug,
      title: pages.title,
      shortDescription: pages.shortDescription,
      content: pages.content,
      image: pages.image,
      banner: pages.banner,
      template: pages.template,
      publishedAt: pages.publishedAt,
      updatedAt: pages.updatedAt,
      metaTitle: pages.metaTitle,
      metaDescription: pages.metaDescription,
      metaKeywords: pages.metaKeywords,
    })
    .from(pages)
    .where(and(eq(pages.slug, slug), isLive()))
    .limit(1);
  return page ?? null;
});

/** Featured pages, linked in the store footer. */
export const getFooterPages = cache(() =>
  db
    .select({ slug: pages.slug, title: pages.title })
    .from(pages)
    .where(and(isLive(), eq(pages.isFeatured, true)))
    .orderBy(asc(pages.sortOrder), asc(pages.title))
    .limit(8),
);
