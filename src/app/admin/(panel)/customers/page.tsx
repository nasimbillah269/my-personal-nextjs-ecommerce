import Link from "next/link";
import { Users } from "lucide-react";
import { ListToolbar } from "@/components/admin/controls";
import { Card, EmptyState, formatDate, formatTaka, PageHeader, Pagination } from "@/components/admin/ui";
import { listCustomers, PAGE_SIZE } from "@/server/admin/queries";
import { requireAdmin } from "@/server/auth";

export const metadata = { title: "Customers" };

export default async function CustomersPage({ searchParams }: PageProps<"/admin/customers">) {
  await requireAdmin();
  const sp = await searchParams;
  const q = typeof sp.q === "string" && sp.q ? sp.q : undefined;
  const page = Math.max(1, Number(sp.page) || 1);
  const { rows, total } = await listCustomers({ q, page });

  return (
    <>
      <PageHeader
        title="Customers"
        description={`${total} customer${total === 1 ? "" : "s"}, grouped by phone number from their orders.`}
      />
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
                        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-light text-xs font-bold text-brand-dark">
                          {c.name
                            .split(/\s+/)
                            .map((w) => w[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase()}
                        </span>
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
        <Pagination page={page} total={total} pageSize={PAGE_SIZE} basePath="/admin/customers" params={{ q }} />
      </Card>
    </>
  );
}
