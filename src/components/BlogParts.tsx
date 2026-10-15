import Image from "next/image";
import Link from "next/link";
import { CalendarDays, FileText, Search } from "lucide-react";

export const formatPostDate = (d: Date | null) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Dhaka" }) : "";

export type PostCardData = {
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string | null;
  publishedAt: Date | null;
  categoryName: string | null;
  categorySlug: string | null;
};

export function PostCard({ post }: { post: PostCardData }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white transition hover:-translate-y-0.5 hover:shadow-lg">
      <Link href={`/blog/${post.slug}`} className="relative block aspect-[16/9] overflow-hidden bg-soft" tabIndex={-1} aria-hidden="true">
        {post.coverImage ? (
          <Image
            src={post.coverImage}
            alt=""
            fill
            sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <span className="grid size-full place-items-center bg-brand-light/50">
            <FileText className="size-10 text-brand/50" strokeWidth={1.5} />
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <p className="flex flex-wrap items-center gap-2 text-xs text-body">
          {post.categoryName && post.categorySlug && (
            <Link href={`/blog?category=${post.categorySlug}`} className="rounded-full bg-brand-light px-2.5 py-0.5 font-bold text-brand-dark">
              {post.categoryName}
            </Link>
          )}
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="size-3.5" /> {formatPostDate(post.publishedAt)}
          </span>
        </p>
        <h2 className="mt-3 line-clamp-2 text-lg leading-snug font-bold text-heading">
          <Link href={`/blog/${post.slug}`} className="hover:text-brand">
            {post.title}
          </Link>
        </h2>
        {post.excerpt && <p className="mt-2 line-clamp-3 text-sm leading-6 text-body">{post.excerpt}</p>}
        <Link href={`/blog/${post.slug}`} className="mt-auto pt-4 text-sm font-bold text-brand hover:underline">
          Read more →
        </Link>
      </div>
    </article>
  );
}

type Sidebar = {
  categories: { slug: string; name: string; n: number }[];
  tags: { slug: string; name: string }[];
  recent: { slug: string; title: string; coverImage: string | null; publishedAt: Date | null }[];
};

export function BlogSidebar({ data, q, activeCategory, activeTag }: { data: Sidebar; q?: string; activeCategory?: string; activeTag?: string }) {
  const box = "rounded-2xl border border-line bg-white p-5";
  const heading = "mb-4 border-b border-line pb-3 font-bold text-heading";
  return (
    <aside className="space-y-6">
      <form action="/blog" role="search" className={box}>
        <label className="relative block">
          <span className="sr-only">Search the blog</span>
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-body" />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search articles…"
            className="h-11 w-full rounded-lg border border-line pr-3 pl-10 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand-light"
          />
        </label>
      </form>

      {data.categories.length > 0 && (
        <div className={box}>
          <h2 className={heading}>Categories</h2>
          <ul className="space-y-1">
            {data.categories.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/blog?category=${c.slug}`}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    activeCategory === c.slug ? "bg-brand text-white" : "text-heading hover:bg-brand-light"
                  }`}
                >
                  {c.name}
                  <span className={`text-xs ${activeCategory === c.slug ? "text-white/80" : "text-body"}`}>{c.n}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.recent.length > 0 && (
        <div className={box}>
          <h2 className={heading}>Recent posts</h2>
          <ul className="space-y-4">
            {data.recent.map((p) => (
              <li key={p.slug}>
                <Link href={`/blog/${p.slug}`} className="group flex gap-3">
                  <span className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-lg bg-brand-light/50">
                    {p.coverImage ? (
                      <Image src={p.coverImage} alt="" fill sizes="64px" className="object-cover" />
                    ) : (
                      <FileText className="size-5 text-brand/50" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="line-clamp-2 text-sm leading-snug font-bold text-heading group-hover:text-brand">{p.title}</span>
                    <span className="mt-1 block text-xs text-body">{formatPostDate(p.publishedAt)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.tags.length > 0 && (
        <div className={box}>
          <h2 className={heading}>Tags</h2>
          <div className="flex flex-wrap gap-2">
            {data.tags.map((t) => (
              <Link
                key={t.slug}
                href={`/blog?tag=${t.slug}`}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  activeTag === t.slug ? "border-brand bg-brand text-white" : "border-line text-heading hover:border-brand hover:text-brand"
                }`}
              >
                #{t.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
