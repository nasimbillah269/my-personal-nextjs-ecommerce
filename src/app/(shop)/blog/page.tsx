import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { BlogSidebar, PostCard } from "@/components/BlogParts";
import { container } from "@/lib/ui";
import { BLOG_PAGE_SIZE, getBlogSidebar, listPublishedPosts } from "@/server/blog";
import { getSettings } from "@/server/queries";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    title: `Blog — ${settings.storeName}`,
    description: `Health tips, recipes and guides to organic living from ${settings.storeName}.`,
  };
}

export default async function BlogPage({ searchParams }: PageProps<"/blog">) {
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === "string" && sp[k] ? (sp[k] as string).slice(0, 120) : undefined);
  const filters = { q: str("q"), category: str("category"), tag: str("tag"), page: Math.max(1, Number(sp.page) || 1) };
  const [{ rows, total }, sidebar] = await Promise.all([listPublishedPosts(filters), getBlogSidebar()]);

  const category = sidebar.categories.find((c) => c.slug === filters.category);
  const tag = sidebar.tags.find((t) => t.slug === filters.tag);
  const heading = category?.name ?? (filters.tag ? `#${tag?.name ?? filters.tag}` : filters.q ? `Search: “${filters.q}”` : "Our Blog");
  const intro =
    category?.description ||
    (filters.q || filters.category || filters.tag
      ? `${total} article${total === 1 ? "" : "s"} found.`
      : "Health tips, recipes and guides to living a little more naturally.");

  const pages = Math.max(1, Math.ceil(total / BLOG_PAGE_SIZE));
  const pageHref = (p: number) => {
    const q = new URLSearchParams();
    for (const k of ["q", "category", "tag"] as const) if (filters[k]) q.set(k, filters[k]!);
    if (p > 1) q.set("page", String(p));
    const s = q.toString();
    return s ? `/blog?${s}` : "/blog";
  };
  const pageBtn = "grid size-10 place-items-center rounded-lg border border-line bg-white text-heading transition hover:border-brand hover:text-brand";

  return (
    <main className={`${container} flex-1 pt-4 pb-12 lg:pt-6`}>
      <nav aria-label="Breadcrumb" className="mb-6 text-xs">
        <Link href="/" className="font-semibold text-brand hover:underline">
          Home
        </Link>
        <ChevronRight className="mx-1.5 inline size-3 text-body" />
        {heading === "Our Blog" ? (
          <span className="text-body">Blog</span>
        ) : (
          <Link href="/blog" className="font-semibold text-brand hover:underline">
            Blog
          </Link>
        )}
      </nav>

      <header className="mb-8 rounded-2xl bg-linear-to-r from-brand-light to-white px-6 py-8 sm:px-10">
        <h1 className="text-2xl font-bold text-heading sm:text-3xl">{heading}</h1>
        <p className="mt-2 max-w-2xl text-sm text-body sm:text-base">{intro}</p>
        {(filters.q || filters.category || filters.tag) && (
          <Link href="/blog" className="mt-3 inline-block text-sm font-bold text-brand hover:underline">
            ← All articles
          </Link>
        )}
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          {rows.length === 0 ? (
            <div className="flex flex-col items-center rounded-2xl border border-line bg-white px-6 py-16 text-center">
              <FileText className="size-10 text-brand/60" strokeWidth={1.5} />
              <p className="mt-4 font-bold text-heading">No articles yet</p>
              <p className="mt-1 text-sm text-body">
                {filters.q || filters.category || filters.tag ? "Try a different search or topic." : "Check back soon for new posts."}
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {rows.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          )}

          {pages > 1 && (
            <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-2">
              {filters.page > 1 ? (
                <Link href={pageHref(filters.page - 1)} aria-label="Previous page" className={pageBtn}>
                  <ChevronLeft className="size-4" />
                </Link>
              ) : (
                <span className={`${pageBtn} pointer-events-none opacity-40`}>
                  <ChevronLeft className="size-4" />
                </span>
              )}
              <span className="px-3 text-sm font-semibold text-heading">
                Page {Math.min(filters.page, pages)} of {pages}
              </span>
              {filters.page < pages ? (
                <Link href={pageHref(filters.page + 1)} aria-label="Next page" className={pageBtn}>
                  <ChevronRight className="size-4" />
                </Link>
              ) : (
                <span className={`${pageBtn} pointer-events-none opacity-40`}>
                  <ChevronRight className="size-4" />
                </span>
              )}
            </nav>
          )}
        </div>

        <BlogSidebar data={sidebar} q={filters.q} activeCategory={filters.category} activeTag={filters.tag} />
      </div>
    </main>
  );
}
