import Link from "next/link";
import { AlertTriangle, ArrowDownRight, ArrowRight, ArrowUpRight, Banknote, PackageX, ShoppingBag, Users, Wallet } from "lucide-react";
import { RevenueChart } from "@/components/admin/RevenueChart";
import { Card, formatDate, formatTaka, PageHeader, PaymentMethodLabel, StatusBadge, Thumb } from "@/components/admin/ui";
import { ORDER_STATUSES } from "@/lib/constants";
import { orderStatusMeta } from "@/lib/checkout";
import { getDashboardData } from "@/server/admin/queries";
import { requireAdmin } from "@/server/auth";

export const metadata = { title: "Dashboard" };

function Delta({ current, previous }: { current: number; previous: number }) {
  if (previous === 0) return <span className="text-xs text-body">No data for previous 30 days</span>;
  const pct = Math.round(((current - previous) / previous) * 100);
  const up = pct >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className="flex items-center gap-1 text-xs">
      <span className={`inline-flex items-center gap-0.5 font-bold ${up ? "text-emerald-600" : "text-rose-600"}`}>
        <Icon className="size-3.5" />
        {up ? "+" : ""}
        {pct}%
      </span>
      <span className="text-body">vs previous 30 days</span>
    </span>
  );
}

export default async function DashboardPage() {
  const admin = await requireAdmin();
  const d = await getDashboardData();

  const tiles = [
    { label: "Revenue", value: formatTaka(d.current.revenue), cur: d.current.revenue, prev: d.previous.revenue, icon: Banknote },
    { label: "Orders", value: d.current.orders.toLocaleString(), cur: d.current.orders, prev: d.previous.orders, icon: ShoppingBag },
    { label: "Average order value", value: formatTaka(d.current.aov), cur: d.current.aov, prev: d.previous.aov, icon: Wallet },
    { label: "Customers", value: d.current.customers.toLocaleString(), cur: d.current.customers, prev: d.previous.customers, icon: Users },
  ];

  const totalOrders = Object.values(d.statusCounts).reduce((a, b) => a + b, 0);
  const maxStatus = Math.max(1, ...Object.values(d.statusCounts));

  return (
    <>
      <PageHeader
        title={`Welcome back, ${admin.name.split(" ")[0]} 👋`}
        description="Here’s how your store performed over the last 30 days. Cancelled orders are excluded."
      />

      {d.pendingCount > 0 && (
        <Link
          href="/admin/orders?status=pending"
          className="mb-6 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm transition hover:border-amber-300"
        >
          <AlertTriangle className="size-5 shrink-0 text-amber-600" />
          <span className="flex-1 text-heading">
            <b>
              {d.pendingCount} pending order{d.pendingCount === 1 ? "" : "s"}
            </b>{" "}
            waiting for confirmation.
          </span>
          <span className="flex items-center gap-1 font-bold text-amber-700">
            Review <ArrowRight className="size-4" />
          </span>
        </Link>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map(({ label, value, cur, prev, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-line bg-white p-5">
            <div className="flex items-start justify-between">
              <p className="text-sm font-semibold text-body">{label}</p>
              <span className="grid size-10 place-items-center rounded-xl bg-brand-light">
                <Icon className="size-5 text-brand-dark" />
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold text-heading">{value}</p>
            <div className="mt-2">
              <Delta current={cur} previous={prev} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card title="Daily revenue · last 30 days">
          <RevenueChart data={d.series} />
        </Card>

        <Card title="Orders by status" action={<span className="text-xs text-body">{totalOrders} total</span>}>
          <ul className="space-y-4">
            {ORDER_STATUSES.map((s) => (
              <li key={s}>
                <Link href={`/admin/orders?status=${s}`} className="group block">
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-semibold text-heading group-hover:text-brand">{orderStatusMeta[s].label}</span>
                    <span className="font-bold text-heading tabular-nums">{d.statusCounts[s]}</span>
                  </div>
                  <div className="h-2 rounded-full bg-soft">
                    <div
                      className="h-full rounded-full bg-brand transition-all"
                      style={{ width: `${(d.statusCounts[s] / maxStatus) * 100}%` }}
                    />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card
          title="Recent orders"
          bodyClassName=""
          action={
            <Link href="/admin/orders" className="text-xs font-bold text-brand hover:underline">
              View all
            </Link>
          }
        >
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="bg-soft text-left text-xs font-bold tracking-wide text-body uppercase">
                <tr>
                  <th className="px-5 py-3">Order</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Payment</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {d.recent.map((o) => (
                  <tr key={o.id} className="border-t border-line transition hover:bg-soft/60">
                    <td className="px-5 py-3">
                      <Link href={`/admin/orders/${o.id}`} className="font-bold text-brand hover:underline">
                        {o.orderNo}
                      </Link>
                      <p className="text-xs text-body">{formatDate(o.createdAt)}</p>
                    </td>
                    <td className="px-5 py-3 font-semibold text-heading">{o.customerName}</td>
                    <td className="px-5 py-3">
                      <PaymentMethodLabel method={o.paymentMethod} />
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="px-5 py-3 text-right font-bold text-heading tabular-nums">{formatTaka(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="min-w-0 space-y-6">
          <Card title="Top products · 30 days">
            {d.top.length === 0 ? (
              <p className="text-sm text-body">No sales yet.</p>
            ) : (
              <ol className="space-y-3">
                {d.top.map((p, i) => (
                  <li key={p.slug} className="flex items-center gap-3">
                    <span className="w-4 text-xs font-bold text-body">{i + 1}</span>
                    <Thumb emoji={p.emoji} tint={p.tint} name={p.name} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-1 text-sm font-semibold text-heading">{p.name}</span>
                      <span className="text-xs text-body">{p.qty} sold</span>
                    </span>
                    <span className="text-sm font-bold text-heading tabular-nums">{formatTaka(p.revenue)}</span>
                  </li>
                ))}
              </ol>
            )}
          </Card>

          <Card
            title="Low stock"
            action={
              <Link href="/admin/products?status=low" className="text-xs font-bold text-brand hover:underline">
                View all
              </Link>
            }
          >
            {d.lowStock.length === 0 ? (
              <p className="text-sm text-body">All products have more than 10 in stock. 👍</p>
            ) : (
              <ul className="space-y-3">
                {d.lowStock.map((p) => (
                  <li key={p.id}>
                    <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3 hover:text-brand">
                      <Thumb emoji={p.emoji} tint={p.tint} name={p.name} size="sm" />
                      <span className="line-clamp-1 flex-1 text-sm font-semibold text-heading">{p.name}</span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                          p.stock === 0 ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {p.stock === 0 && <PackageX className="size-3.5" />}
                        {p.stock === 0 ? "Out of stock" : `${p.stock} left`}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
