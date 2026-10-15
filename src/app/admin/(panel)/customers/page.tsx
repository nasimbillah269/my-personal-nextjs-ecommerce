import Link from "next/link";
import { UserRound, Users } from "lucide-react";
import { ListToolbar } from "@/components/admin/controls";
import { CustomerRowActions } from "@/components/admin/CustomerRowActions";
import { Card, EmptyState, formatDate, formatTaka, PageHeader, Pagination, StatusTabs } from "@/components/admin/ui";
import { listCustomers, listRegisteredCustomers, PAGE_SIZE } from "@/server/admin/queries";
import { requireAdmin } from "@/server/auth";

export const metadata = { title: "Customers" };

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

export default async function CustomersPage({ searchParams }: PageProps<"/admin/customers">) {
  await requireAdmin("customers");
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === "string" && sp[k] ? (sp[k] as string) : undefined);
  const view = str("view") === "guests" ? "guests" : "accounts";
  const q = str("q");
  const page = Math.max(1, Number(sp.page) || 1);

  const viewTab = (v: "accounts" | "guests", label: string) => (
    <Link
      href={v === "guests" ? "/admin/customers?view=guests" : "/admin/customers"}
      aria-current={view === v ? "page" : undefined}
      className={`rounded-lg px-4 py-2 text-sm font-bold transition ${view === v ? "bg-surface text-heading shadow-sm" : "text-body hover:text-heading"}`}
    >
      {label}
    </Link>
  );

  return (
    <>
      <PageHeader
        title="Customers"
        description={view === "accounts" ? "Shoppers who created an account on the store." : "Everyone who ordered, grouped by phone number — including guests."}
        actions={
          <div className="flex rounded-xl bg-soft p-1">
            {viewTab("accounts", "Registered accounts")}
            {viewTab("guests", "All buyers")}
          </div>
        }
      />
      {view === "accounts" ? <Accounts q={q} status={str("status")} page={page} /> : <Guests q={q} page={page} />}
    </>
  );
}

async function Accounts({ q, status, page }: { q?: string; status?: string; page: number }) {
  const { rows, total, counts } = await listRegisteredCustomers({ q, status, page });
  return (
    <>
      <StatusTabs
        basePath="/admin/customers"
        active={status}
        params={{ q }}
        tabs={[
          { label: "All", count: counts.all },
          { value: "active", label: "Active", count: counts.active },
          { value: "blocked", label: "Blocked", count: counts.blocked },
        ]}
      />
      <Card bodyClassName="">
        <ListToolbar placeholder="Search by name, phone or email…" />
        {rows.length === 0 ? (
          <EmptyState icon={UserRound} title="No accounts found" text={q || status ? "Try a different search or filter." : "Customers appear here after they sign up on the store."} />
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="bg-soft text-left text-xs font-bold tracking-wide text-body uppercase">
                <tr>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Location</th>
                  <th className="px-5 py-3 text-center">Orders</th>
                  <th className="px-5 py-3 text-right">Total spent</th>
                  <th className="px-5 py-3">Joined</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id} className={`border-t border-line hover:bg-soft/60 ${c.isActive ? "" : "opacity-70"}`}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-light text-xs font-bold text-brand-dark">{initials(c.name)}</span>
                        <span className="min-w-0">
                          <span className="block font-bold text-heading">{c.name}</span>
                          <a href={`tel:${c.phone}`} className="text-xs text-body hover:text-brand">
                            {c.phone}
                          </a>
                          {c.email && <span className="text-xs text-body"> · {c.email}</span>}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-heading">{[c.area, c.division].filter(Boolean).join(", ") || <span className="text-body">—</span>}</td>
                    <td className="px-5 py-3 text-center">
                      <Link
                        href={`/admin/orders?q=${encodeURIComponent(c.phone)}`}
                        className="inline-flex min-w-8 justify-center rounded-full bg-soft px-2.5 py-1 text-xs font-bold text-heading hover:bg-brand-light hover:text-brand-dark"
                      >
                        {c.orders}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-right font-bold text-heading tabular-nums">{formatTaka(c.spent)}</td>
                    <td className="px-5 py-3 text-heading">
                      {formatDate(c.createdAt)}
                      <span className="block text-xs text-body">{c.lastLoginAt ? `Last login ${formatDate(c.lastLoginAt)}` : "Never logged in again"}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${c.isActive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                        {c.isActive ? "Active" : "Blocked"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <CustomerRowActions id={c.id} name={c.name} isActive={c.isActive} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} total={total} pageSize={PAGE_SIZE} basePath="/admin/customers" params={{ q, status }} />
      </Card>
    </>
  );
}

async function Guests({ q, page }: { q?: string; page: number }) {
  const { rows, total } = await listCustomers({ q, page });
  return (
    <Card bodyClassName="">
      <ListToolbar placeholder="Search by name or phone…" />
      {rows.length === 0 ? (
        <EmptyState icon={Users} title="No customers found" text="Customers appear here after they place an order." />
      ) : (
        <div className="relative overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-soft text-left text-xs font-bold tracking-wide text-body uppercase">
              <tr>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Location</th>
                <th className="px-5 py-3 text-center">Orders</th>
                <th className="px-5 py-3 text-right">Total spent</th>
                <th className="px-5 py-3">Last order</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.phone} className="border-t border-line hover:bg-soft/60">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-light text-xs font-bold text-brand-dark">{initials(c.name)}</span>
                      <span>
                        <span className="block font-bold text-heading">{c.name}</span>
                        <a href={`tel:${c.phone}`} className="text-xs text-body hover:text-brand">
                          {c.phone}
                        </a>
                        {c.email && <span className="text-xs text-body"> · {c.email}</span>}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-heading">{c.location}</td>
                  <td className="px-5 py-3 text-center">
                    <Link
                      href={`/admin/orders?q=${encodeURIComponent(c.phone)}`}
                      className="inline-flex min-w-8 justify-center rounded-full bg-soft px-2.5 py-1 text-xs font-bold text-heading hover:bg-brand-light hover:text-brand-dark"
                    >
                      {c.orders}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-right font-bold text-heading tabular-nums">{formatTaka(c.spent)}</td>
                  <td className="px-5 py-3 text-heading">{formatDate(c.lastOrder)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} total={total} pageSize={PAGE_SIZE} basePath="/admin/customers" params={{ q, view: "guests" }} />
    </Card>
  );
}
