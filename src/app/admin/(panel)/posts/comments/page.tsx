import { MessagesSquare } from "lucide-react";
import { CommentRow, EmptySpamButton } from "@/components/admin/CommentRow";
import { ListToolbar } from "@/components/admin/controls";
import { Card, EmptyState, PageHeader, Pagination, StatusTabs } from "@/components/admin/ui";
import { listComments, PAGE_SIZE } from "@/server/admin/queries";
import { requireAdmin } from "@/server/auth";

export const metadata = { title: "Comments" };

export default async function CommentsPage({ searchParams }: PageProps<"/admin/posts/comments">) {
  await requireAdmin("posts");
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === "string" && sp[k] ? (sp[k] as string) : undefined);
  const filters = { q: str("q"), status: str("status"), page: Math.max(1, Number(sp.page) || 1) };
  const { rows, total, statusCounts } = await listComments(filters);

  return (
    <>
      <PageHeader
        title="Comments"
        description="Approve, reply to or remove what readers write on your posts."
        actions={filters.status === "spam" && (statusCounts.spam ?? 0) > 0 && <EmptySpamButton />}
      />

      <StatusTabs
        basePath="/admin/posts/comments"
        active={filters.status}
        params={{ q: filters.q }}
        tabs={[
          { label: "All", count: statusCounts.all ?? 0 },
          { value: "pending", label: "Pending", count: statusCounts.pending ?? 0 },
          { value: "approved", label: "Approved", count: statusCounts.approved ?? 0 },
          { value: "spam", label: "Spam", count: statusCounts.spam ?? 0 },
        ]}
      />

      <Card bodyClassName="">
        <ListToolbar placeholder="Search by name, email, text or post title…" />
        {rows.length === 0 ? (
          <EmptyState
            icon={MessagesSquare}
            title="No comments found"
            text={filters.q || filters.status ? "Try a different search or filter." : "Comments readers leave on your blog posts show up here."}
          />
        ) : (
          <ul className="divide-y divide-line">
            {rows.map((c) => (
              <CommentRow key={c.id} c={c} />
            ))}
          </ul>
        )}
        <Pagination page={filters.page} total={total} pageSize={PAGE_SIZE} basePath="/admin/posts/comments" params={{ q: filters.q, status: filters.status }} />
      </Card>
    </>
  );
}
