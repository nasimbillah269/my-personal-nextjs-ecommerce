import type { MetadataRoute } from "next";
import { and, desc, eq, lte } from "drizzle-orm";
import { db, schema } from "@/db";
import { getSiteUrl } from "@/server/site-url";

const { products, categories, posts, pages } = schema;

/** /sitemap.xml — every public page search engines should index, built from the live catalog. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = await getSiteUrl();
  const abs = (path: string) => (/^https?:\/\//.test(path) ? path : `${base}${path}`);
  const now = new Date();

  const [productRows, categoryRows, postRows, pageRows] = await Promise.all([
    db
      .select({ slug: products.slug, image: products.image, updatedAt: products.updatedAt })
      .from(products)
      .where(eq(products.isActive, true))
      .orderBy(desc(products.updatedAt)),
    db.select({ slug: categories.slug }).from(categories),
    db
      .select({ slug: posts.slug, image: posts.coverImage, updatedAt: posts.updatedAt })
      .from(posts)
      .where(and(eq(posts.status, "published"), lte(posts.publishedAt, now)))
      .orderBy(desc(posts.updatedAt)),
    db
      .select({ slug: pages.slug, updatedAt: pages.updatedAt })
      .from(pages)
      .where(and(eq(pages.isActive, true), lte(pages.publishedAt, now))),
  ]);

  const latest = (rows: { updatedAt: Date }[]) => rows[0]?.updatedAt ?? now;

  return [
    { url: base, lastModified: latest(productRows), changeFrequency: "daily", priority: 1 },
    { url: abs("/products"), lastModified: latest(productRows), changeFrequency: "daily", priority: 0.9 },
    ...categoryRows.map((c) => ({
      url: abs(`/products?category=${encodeURIComponent(c.slug)}`),
      lastModified: latest(productRows),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...productRows.map((p) => ({
      url: abs(`/products/${p.slug}`),
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
      images: p.image ? [abs(p.image)] : undefined,
    })),
    ...(postRows.length ? [{ url: abs("/blog"), lastModified: latest(postRows), changeFrequency: "weekly" as const, priority: 0.6 }] : []),
    ...postRows.map((p) => ({
      url: abs(`/blog/${p.slug}`),
      lastModified: p.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
      images: p.image ? [abs(p.image)] : undefined,
    })),
    ...pageRows.map((p) => ({
      url: abs(`/${p.slug}`),
      lastModified: p.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];
}
