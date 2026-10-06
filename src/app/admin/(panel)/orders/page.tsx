import Link from "next/link";
import { ChevronRight, ShoppingBag } from "lucide-react";
import { ListToolbar } from "@/components/admin/controls";
import {
  Card,
  EmptyState,
  formatDateTime,
  formatTaka,
  PageHeader,
  Pagination,
  PaymentMethodLabel,
  PaymentStatusBadge,
  StatusBadge,
} from "@/components/admin/ui";
import { ORDER_STATUSES } from "@/lib/constants";
import { orderStatusMeta, paymentMethods } from "@/lib/checkout";
import { listOrders, PAGE_SIZE } from "@/server/admin/queries";
import { requireAdmin } from "@/server/auth";

export const metadata = { title: "Orders" };

export default async function OrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  await requireAdmin();
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === "string" && sp[k] ? (sp[k] as string) : undefined);
  const filters = { q: str("q"), status: str("status"), payment: str("payment"), page: Math.max(1, Number(sp.page) || 1) };
  const { rows, total, statusCounts } = await listOrders(filters);

  const tabHref = (status?: string) => {
    const q = new URLSearchParams();
    if (filters.q) q.set("q", filters.q);
    if (filters.payment) q.set("payment", filters.payment);
    if (status) q.set("status", status);
    const s = q.toString();
    return s ? `/admin/orders?${s}` : "/admin/orders";
  };

  const tabs = [{ value: undefined, label: "All", count: statusCounts.all ?? 0 }, ...ORDER_STATUSES.map((s) => ({ value: s, label: orderStatusMeta[s].label, count: statusCounts[s] ?? 0 }))];

  return (
    <>
      <PageHeader title="Orders" description="Track, confirm and fulfil customer orders." />

      <nav className="no-scrollbar mb-4 flex gap-2 overflow-x-auto" aria-label="Filter by status">
        {tabs.map((t) => {
          const active = filters.status === t.value;
          return (
            <Link
              key={t.label}
              href={tabHref(t.value)}
              aria-current={active ? "page" : undefined}
              className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition ${
                active ? "bg-brand text-white" : "bg-surface text-heading hover:bg-brand-light"
              }`}
            >
              {t.label}
              <span className={`rounded-full px-2 text-xs ${active ? "bg-white/20" : "bg-soft text-body"}`}>{t.count}</span>
            </Link>
          );
        })}
      </nav>

      <Card bodyClassName="">
        <ListToolbar
          placeholder="Search order no., customer name or phone…"
          filters={[{ name: "payment", label: "All payment methods", options: paymentMethods.map((m) => ({ value: m.id, label: m.label })) }]}
        />
        {rows.length === 0 ? (
          <EmptyState icon={ShoppingBag} title="No orders found" text="Try a different search or filter." />
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="bg-soft text-left text-xs font-bold tracking-wide text-body uppercase">
                <tr>
                  <th className="px-5 py-3">Order</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3 text-center">Items</th>
                  <th className="px-5 py-3">Payment</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Total</th>
                  <th className="px-5 py-3">
                    <span className="sr-only">Open</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((o) => (
                  <tr key={o.id} className="group border-t border-line transition hover:bg-soft/60">
                    <td className="px-5 py-3.5">
                      <Link href={`/admin/orders/${o.id}`} className="font-bold text-brand hover:underline">
                        {o.orderNo}
                      </Link>
                      <p className="text-xs text-body">{formatDateTime(o.createdAt)}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-heading">{o.customerName}</p>
                      <p className="text-xs text-body">
                        {o.phone} · {o.division}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 text-center font-semibold text-heading tabular-nums">{o.items}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col items-start gap-1">
                        <PaymentMethodLabel method={o.paymentMethod} />
                        <PaymentStatusBadge status={o.paymentStatus} />
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-heading tabular-nums">{formatTaka(o.total)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        aria-label={`Open order ${o.orderNo}`}
                        className="inline-grid size-8 place-items-center rounded-lg text-body transition group-hover:bg-surface group-hover:text-brand"
                      >
                        <ChevronRight className="size-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={filters.page} total={total} pageSize={PAGE_SIZE} basePath="/admin/orders" params={{ q: filters.q, status: filters.status, payment: filters.payment }} />
      </Card>
    </>
  );
}
