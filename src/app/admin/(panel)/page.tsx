import Link from "next/link";
import { AlertTriangle, ArrowDownRight, ArrowRight, ArrowUpRight, Banknote, PackageX, ShoppingBag, Users, Wallet } from "lucide-react";
import { RevenueChart } from "@/components/admin/RevenueChart";
import { Card, formatDate, formatTaka, PaymentMethodLabel, StatusBadge, Thumb } from "@/components/admin/ui";
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
    {
      label: "Revenue",
      value: formatTaka(d.current.revenue),
      cur: d.current.revenue,
      prev: d.previous.revenue,
      icon: Banknote,
      chip: "from-teal-400 to-emerald-500 shadow-emerald-500/30",
      glow: "bg-emerald-400/15",
    },
    {
      label: "Orders",
      value: d.current.orders.toLocaleString(),
      cur: d.current.orders,
      prev: d.previous.orders,
      icon: ShoppingBag,
      chip: "from-indigo-500 to-violet-500 shadow-indigo-500/30",
      glow: "bg-indigo-400/15",
    },
    {
      label: "Average order value",
      value: formatTaka(d.current.aov),
      cur: d.current.aov,
      prev: d.previous.aov,
      icon: Wallet,
      chip: "from-amber-400 to-orange-500 shadow-orange-500/30",
      glow: "bg-amber-400/15",
    },
    {
      label: "Customers",
      value: d.current.customers.toLocaleString(),
      cur: d.current.customers,
      prev: d.previous.customers,
      icon: Users,
      chip: "from-rose-500 to-pink-500 shadow-rose-500/30",
      glow: "bg-rose-400/15",
    },
  ];

  const totalOrders = Object.values(d.statusCounts).reduce((a, b) => a + b, 0);
  const maxStatus = Math.max(1, ...Object.values(d.statusCounts));

  return (
    <>
      <section className="relative mb-6 overflow-hidden rounded-3xl bg-linear-to-br from-[#0e5f68] via-brand to-emerald-500 p-6 text-white shadow-xl shadow-brand/20 sm:p-8">
        <div aria-hidden="true" className="pointer-events-none absolute -top-16 -right-10 size-64 rounded-full bg-white/10 blur-2xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 left-1/3 size-72 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-white/75">Dashboard overview</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Welcome back, {admin.name.split(" ")[0]} 👋</h1>
            <p className="mt-2 max-w-xl text-sm text-white/80">
              Here’s how your store performed over the last 30 days. Cancelled orders are excluded.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/orders"
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-brand-dark shadow-md transition hover:bg-white/90"
            >
              View orders <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/admin/products/new"
              className="inline-flex h-10 items-center rounded-xl bg-white/15 px-4 text-sm font-bold text-white ring-1 ring-white/30 backdrop-blur transition hover:bg-white/25"
            >
              Add product
            </Link>
          </div>
        </div>
      </section>

      {d.pendingCount > 0 && (
        <Link
          href="/admin/orders?status=pending"
          className="mb-6 flex items-center gap-3 rounded-2xl border border-amber-200 bg-linear-to-r from-amber-50 to-orange-50 p-4 text-sm shadow-sm transition hover:border-amber-300 hover:shadow-md"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-linear-to-br from-amber-400 to-orange-500 text-white shadow-md shadow-orange-500/30">
            <AlertTriangle className="size-4.5" />
          </span>
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
        {tiles.map(({ label, value, cur, prev, icon: Icon, chip, glow }) => (
          <div
            key={label}
            className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_-12px_rgba(16,24,40,0.10)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_32px_-12px_rgba(16,24,40,0.18)]"
          >
            <div aria-hidden="true" className={`pointer-events-none absolute -top-10 -right-10 size-32 rounded-full blur-2xl ${glow}`} />
            <div className="relative flex items-start justify-between">
              <p className="text-sm font-semibold text-body">{label}</p>
              <span className={`grid size-11 place-items-center rounded-xl bg-linear-to-br text-white shadow-lg ${chip}`}>
                <Icon className="size-5" />
              </span>
            </div>
            <p className="relative mt-2 text-2xl font-bold tracking-tight text-heading tabular-nums">{value}</p>
            <div className="relative mt-2">
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
                      className="h-full rounded-full bg-linear-to-r from-brand to-emerald-400 transition-all"
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
              <thead className="bg-slate-50/80 text-left text-xs font-bold tracking-wide text-body uppercase">
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
                  <tr key={o.id} className="border-t border-slate-100 transition hover:bg-brand-light/30">
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
                    <span
                      className={`grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold ${
                        i === 0 ? "bg-linear-to-br from-amber-300 to-orange-400 text-white" : "bg-slate-100 text-body"
                      }`}
                    >
                      {i + 1}
                    </span>
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
