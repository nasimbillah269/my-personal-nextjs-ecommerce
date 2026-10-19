import { PageHeader, formatDate, formatTaka } from "@/components/admin/ui";
import { PrintHeader, ReportToolbar, StatGrid, reportHead, reportTable, td, th } from "@/components/admin/ReportParts";
import { getCustomerReport, parseReportFilters, REPORT_ROW_LIMIT } from "@/server/admin/reports";
import { requireAdmin } from "@/server/auth";
import { getSettings } from "@/server/queries";

export const metadata = { title: "Customer Report" };

export default async function CustomerReportPage({ searchParams }: PageProps<"/admin/reports/customers">) {
  await requireAdmin("orders");
  const f = parseReportFilters(await searchParams);
  const [{ rows, totals }, settings] = await Promise.all([getCustomerReport(f), getSettings()]);

  return (
    <>
      <div className="print:hidden">
        <PageHeader title="Customer Report" description="Who bought in this period, ranked by spend. Customers are matched by phone number." />
      </div>
      <ReportToolbar kind="customers" filters={f} searchPlaceholder="Name, phone or email…" />
      <PrintHeader title="Customer Report" filters={f} storeName={settings.storeName} extra={f.q ? [`Search: “${f.q}”`] : undefined} />

      <StatGrid
        stats={[
          { label: "Customers", value: totals.customers.toLocaleString("en-IN") },
          { label: "New customers", value: totals.newCustomers.toLocaleString("en-IN"), hint: "First order in this range" },
          { label: "Returning", value: (totals.customers - totals.newCustomers).toLocaleString("en-IN") },
          { label: "With account", value: totals.registered.toLocaleString("en-IN") },
          { label: "Orders", value: totals.orders.toLocaleString("en-IN") },
          { label: "Total spent", value: formatTaka(totals.spent), hint: `Avg ${formatTaka(totals.customers ? Math.round(totals.spent / totals.customers) : 0)} per customer` },
        ]}
      />

      <section className="overflow-hidden rounded-2xl border border-line bg-surface print:rounded-none print:border-0">
        <div className="overflow-x-auto">
          <table className={`${reportTable} min-w-[900px] print:min-w-0`}>
            <thead className={reportHead}>
              <tr>
                <th className={`${th} w-12`}>#</th>
                <th className={th}>Customer</th>
                <th className={th}>Phone</th>
                <th className={th}>Division</th>
                <th className={`${th} text-right`}>Orders</th>
                <th className={`${th} text-right`}>Items</th>
                <th className={`${th} text-right`}>Avg order</th>
                <th className={`${th} text-right`}>Total spent</th>
                <th className={th}>Last order</th>
                <th className={th}>Type</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-body">
                    No customers ordered in this range.
                  </td>
                </tr>
              )}
              {rows.map((r, i) => (
                <tr key={r.phone} className="border-t border-line">
                  <td className={`${td} text-body`}>{i + 1}</td>
                  <td className={td}>
                    <span className="block font-semibold text-heading">{r.name}</span>
                    {r.email && <span className="text-xs text-body">{r.email}</span>}
                  </td>
                  <td className={`${td} font-mono text-xs`}>{r.phone}</td>
                  <td className={`${td} text-body`}>{r.division}</td>
                  <td className={`${td} text-right`}>{r.orders}</td>
                  <td className={`${td} text-right`}>{r.items}</td>
                  <td className={`${td} text-right`}>{formatTaka(r.aov)}</td>
                  <td className={`${td} text-right font-bold text-heading`}>{formatTaka(r.spent)}</td>
                  <td className={`${td} whitespace-nowrap text-body`}>{formatDate(r.lastOrder)}</td>
                  <td className={td}>
                    <span className="flex flex-wrap gap-1">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${r.isNew ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-600"}`}>
                        {r.isNew ? "New" : "Returning"}
                      </span>
                      {r.registered && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">Account</span>}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            {rows.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-heading/20 bg-soft font-bold text-heading">
                  <td className={td} colSpan={4}>
                    Total ({totals.customers} customers)
                  </td>
                  <td className={`${td} text-right`}>{totals.orders}</td>
                  <td className={td} />
                  <td className={td} />
                  <td className={`${td} text-right`}>{formatTaka(totals.spent)}</td>
                  <td className={td} colSpan={2} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </section>
      {rows.length >= REPORT_ROW_LIMIT && (
        <p className="mt-4 text-xs text-body print:hidden">Showing the top {REPORT_ROW_LIMIT.toLocaleString("en-IN")} customers by spend.</p>
      )}
    </>
  );
}
