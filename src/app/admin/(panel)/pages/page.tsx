import Image from "next/image";
import Link from "next/link";
import { Files, Plus } from "lucide-react";
import { ListToolbar } from "@/components/admin/controls";
import { PageActiveSwitch, PageFeaturedButton, PageRowActions } from "@/components/admin/PageRowActions";
import { btnPrimary, Card, EmptyState, formatDate, PageHeader, Pagination, StatusTabs } from "@/components/admin/ui";
import { PAGE_TEMPLATE_LABELS } from "@/lib/constants";
import { listPages, PAGE_SIZE } from "@/server/admin/queries";
import { requireAdmin } from "@/server/auth";

export const metadata = { title: "Pages" };

export default async function PagesAdminPage({ searchParams }: PageProps<"/admin/pages">) {
  await requireAdmin("pages");
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === "string" && sp[k] ? (sp[k] as string) : undefined);
  const filters = { q: str("q"), status: str("status"), page: Math.max(1, Number(sp.page) || 1) };
  const { rows, total, statusCounts } = await listPages(filters);

  const addButton = (
    <Link href="/admin/pages/new" className={btnPrimary}>
      <Plus className="size-4" /> New page
    </Link>
  );

  return (
    <>
      <PageHeader title="Pages" description="Static store pages such as About Us, Privacy Policy and Terms." actions={addButton} />

      <StatusTabs
        basePath="/admin/pages"
        active={filters.status}
        params={{ q: filters.q }}
        tabs={[
          { label: "All", count: statusCounts.all },
          { value: "live", label: "Live", count: statusCounts.live },
          { value: "scheduled", label: "Scheduled", count: statusCounts.scheduled },
          { value: "hidden", label: "Hidden", count: statusCounts.hidden },
          { value: "featured", label: "In footer", count: statusCounts.featured },
        ]}
      />

      <Card bodyClassName="">
        <ListToolbar placeholder="Search pages…" />

        {rows.length === 0 ? (
          <EmptyState icon={Files} title="No pages found" text="Try another search, or create your first page." action={addButton} />
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="bg-soft text-left text-xs font-bold tracking-wide text-body uppercase">
                <tr>
                  <th className="px-5 py-3">Page</th>
                  <th className="px-5 py-3">Template</th>
                  <th className="px-5 py-3">Published</th>
                  <th className="px-5 py-3 text-center">Order</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => {
                  const thumb = p.image ?? p.banner;
                  return (
                    <tr key={p.id} className="border-t border-line transition hover:bg-soft/60">
                      <td className="px-5 py-3">
                        <Link href={`/admin/pages/${p.id}`} className="flex items-center gap-3">
                          <span className="relative grid aspect-[16/10] w-20 shrink-0 place-items-center overflow-hidden rounded-lg border border-line bg-soft">
                            {thumb ? <Image src={thumb} alt="" fill sizes="80px" className="object-cover" /> : <Files className="size-5 text-body/60" />}
                          </span>
                          <span className="min-w-0">
                            <span className="line-clamp-1 font-bold text-heading hover:text-brand">{p.title}</span>
                            <span className="text-xs text-body">/{p.slug}</span>
                          </span>
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-body">{PAGE_TEMPLATE_LABELS[p.template].split(" (")[0]}</td>
                      <td className="px-5 py-3 text-body">
                        {p.publishedAt ? formatDate(p.publishedAt) : "—"}
                        {p.isScheduled && <span className="ml-2 rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-bold text-sky-700">Scheduled</span>}
                      </td>
                      <td className="px-5 py-3 text-center text-body">{p.sortOrder}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <PageActiveSwitch id={p.id} isActive={p.isActive} />
                          <PageFeaturedButton id={p.id} isFeatured={p.isFeatured} />
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <PageRowActions id={p.id} slug={p.slug} title={p.title} isActive={p.isActive} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={filters.page} total={total} pageSize={PAGE_SIZE} basePath="/admin/pages" params={{ q: filters.q, status: filters.status }} />
      </Card>
    </>
  );
}
