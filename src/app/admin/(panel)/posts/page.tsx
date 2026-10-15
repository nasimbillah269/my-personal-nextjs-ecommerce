import Image from "next/image";
import Link from "next/link";
import { FileText, MessageSquare, Plus } from "lucide-react";
import { ListToolbar } from "@/components/admin/controls";
import { PostRowActions } from "@/components/admin/PostRowActions";
import { btnPrimary, Card, EmptyState, formatDate, PageHeader, Pagination, StatusTabs } from "@/components/admin/ui";
import { listPostCategories, listPosts, PAGE_SIZE } from "@/server/admin/queries";
import { requireAdmin } from "@/server/auth";

export const metadata = { title: "Posts" };

export default async function PostsAdminPage({ searchParams }: PageProps<"/admin/posts">) {
  await requireAdmin("posts");
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === "string" && sp[k] ? (sp[k] as string) : undefined);
  const filters = { q: str("q"), status: str("status"), category: str("category"), tag: str("tag"), page: Math.max(1, Number(sp.page) || 1) };
  const [{ rows, total, statusCounts }, categories] = await Promise.all([listPosts(filters), listPostCategories()]);

  const addButton = (
    <Link href="/admin/posts/new" className={btnPrimary}>
      <Plus className="size-4" /> New post
    </Link>
  );

  return (
    <>
      <PageHeader
        title="Posts"
        description={
          filters.tag ? (
            <>
              Showing posts tagged <b className="text-heading">#{filters.tag}</b> ·{" "}
              <Link href="/admin/posts" className="font-semibold text-brand hover:underline">
                Clear
              </Link>
            </>
          ) : (
            "Write and manage articles for the store blog."
          )
        }
        actions={addButton}
      />

      <StatusTabs
        basePath="/admin/posts"
        active={filters.status}
        params={{ q: filters.q, category: filters.category, tag: filters.tag }}
        tabs={[
          { label: "All", count: statusCounts.all },
          { value: "published", label: "Published", count: statusCounts.published },
          { value: "scheduled", label: "Scheduled", count: statusCounts.scheduled },
          { value: "draft", label: "Drafts", count: statusCounts.draft },
        ]}
      />

      <Card bodyClassName="">
        <ListToolbar
          placeholder="Search posts…"
          filters={[
            {
              name: "category",
              label: "All categories",
              options: [...categories.map((c) => ({ value: c.slug, label: c.name })), { value: "none", label: "Uncategorised" }],
            },
          ]}
        />

        {rows.length === 0 ? (
          <EmptyState icon={FileText} title="No posts found" text="Try another search, or write your first post." action={addButton} />
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-soft text-left text-xs font-bold tracking-wide text-body uppercase">
                <tr>
                  <th className="px-5 py-3">Post</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Author</th>
                  <th className="px-5 py-3 text-center">Comments</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => {
                  const scheduled = p.isScheduled;
                  return (
                    <tr key={p.id} className="border-t border-line transition hover:bg-soft/60">
                      <td className="px-5 py-3">
                        <Link href={`/admin/posts/${p.id}`} className="flex items-center gap-3">
                          <span className="relative grid aspect-[16/10] w-20 shrink-0 place-items-center overflow-hidden rounded-lg border border-line bg-soft">
                            {p.coverImage ? (
                              <Image src={p.coverImage} alt="" fill sizes="80px" className="object-cover" />
                            ) : (
                              <FileText className="size-5 text-body/60" />
                            )}
                          </span>
                          <span className="min-w-0">
                            <span className="line-clamp-1 font-bold text-heading hover:text-brand">{p.title}</span>
                            <span className="line-clamp-1 text-xs text-body">
                              /{p.slug}
                              {p.tags.length > 0 && ` · ${p.tags.map((t) => `#${t}`).join(" ")}`}
                            </span>
                          </span>
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-heading">{p.categoryName ?? <span className="text-body">—</span>}</td>
                      <td className="px-5 py-3 text-body">{p.authorName ?? "—"}</td>
                      <td className="px-5 py-3 text-center">
                        <Link
                          href={`/admin/posts/comments?q=${encodeURIComponent(p.title)}`}
                          className="inline-flex items-center gap-1 font-semibold text-heading hover:text-brand"
                        >
                          <MessageSquare className="size-3.5 text-body" />
                          {p.comments}
                          {p.pendingComments > 0 && (
                            <span className="rounded-full bg-amber-100 px-1.5 text-[11px] font-bold text-amber-700" title="Awaiting approval">
                              +{p.pendingComments}
                            </span>
                          )}
                        </Link>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                            scheduled
                              ? "bg-sky-100 text-sky-700"
                              : p.status === "published"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {scheduled ? "Scheduled" : p.status === "published" ? "Published" : "Draft"}
                        </span>
                        <span className="mt-1 block text-xs text-body">
                          {p.publishedAt ? formatDate(p.publishedAt) : `Edited ${formatDate(p.updatedAt)}`}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <PostRowActions id={p.id} slug={p.slug} title={p.title} published={p.status === "published"} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <Pagination
          page={filters.page}
          total={total}
          pageSize={PAGE_SIZE}
          basePath="/admin/posts"
          params={{ q: filters.q, status: filters.status, category: filters.category, tag: filters.tag }}
        />
      </Card>
    </>
  );
}
