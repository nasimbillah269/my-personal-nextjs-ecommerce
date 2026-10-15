import { Download, MailCheck } from "lucide-react";
import { ListToolbar } from "@/components/admin/controls";
import { AddSubscriberForm, SubscriberRowActions } from "@/components/admin/SubscriberControls";
import { btnSecondary, Card, EmptyState, formatDate, PageHeader, Pagination, StatusTabs } from "@/components/admin/ui";
import { listSubscribers, PAGE_SIZE } from "@/server/admin/queries";
import { requireAdmin } from "@/server/auth";

export const metadata = { title: "Subscribers" };

const sourceLabel: Record<string, string> = { home: "Home page", admin: "Added by admin", website: "Website" };

export default async function SubscribersPage({ searchParams }: PageProps<"/admin/users/subscribers">) {
  await requireAdmin("subscribers");
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === "string" && sp[k] ? (sp[k] as string) : undefined);
  const filters = { q: str("q"), status: str("status"), page: Math.max(1, Number(sp.page) || 1) };
  const { rows, total, counts } = await listSubscribers(filters);

  return (
    <>
      <PageHeader
        title="Subscribers"
        description="People who joined the newsletter from the home page."
        actions={
          // A plain link: the route handler streams a CSV download.
          <a href={`/admin/users/subscribers/export${filters.status ? `?status=${filters.status}` : ""}`} className={btnSecondary}>
            <Download className="size-4" /> Export CSV
          </a>
        }
      />
      <StatusTabs
        basePath="/admin/users/subscribers"
        active={filters.status}
        params={{ q: filters.q }}
        tabs={[
          { label: "All", count: counts.all },
          { value: "subscribed", label: "Subscribed", count: counts.subscribed },
          { value: "unsubscribed", label: "Unsubscribed", count: counts.unsubscribed },
        ]}
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card bodyClassName="">
          <ListToolbar placeholder="Search by email or name…" />
          {rows.length === 0 ? (
            <EmptyState
              icon={MailCheck}
              title="No subscribers found"
              text={filters.q || filters.status ? "Try a different search or filter." : "Sign-ups from the home page newsletter form show up here."}
            />
          ) : (
            <div className="relative overflow-x-auto">
              <table className="w-full min-w-[620px] text-sm">
                <thead className="bg-soft text-left text-xs font-bold tracking-wide text-body uppercase">
                  <tr>
                    <th className="px-5 py-3">Subscriber</th>
                    <th className="px-5 py-3">Source</th>
                    <th className="px-5 py-3">Joined</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((s) => (
                    <tr key={s.id} className="border-t border-line hover:bg-soft/60">
                      <td className="px-5 py-3">
                        <a href={`mailto:${s.email}`} className="font-bold text-heading hover:text-brand">
                          {s.email}
                        </a>
                        {s.name && <span className="block text-xs text-body">{s.name}</span>}
                      </td>
                      <td className="px-5 py-3 text-body">{sourceLabel[s.source] ?? s.source}</td>
                      <td className="px-5 py-3 text-heading">{formatDate(s.createdAt)}</td>
                      <td className="px-5 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                            s.status === "subscribed" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {s.status === "subscribed" ? "Subscribed" : "Unsubscribed"}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <SubscriberRowActions id={s.id} email={s.email} subscribed={s.status === "subscribed"} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pagination page={filters.page} total={total} pageSize={PAGE_SIZE} basePath="/admin/users/subscribers" params={{ q: filters.q, status: filters.status }} />
        </Card>
        <Card title="Add subscriber" className="self-start">
          <AddSubscriberForm />
        </Card>
      </div>
    </>
  );
}
