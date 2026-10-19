import { PageHeader, formatTaka } from "@/components/admin/ui";
import { PrintHeader, ReportToolbar, StatGrid, reportHead, reportTable, td, th } from "@/components/admin/ReportParts";
import { orderStatusMeta, paymentMethods } from "@/lib/checkout";
import { getSalesReport, parseReportFilters } from "@/server/admin/reports";
import { requireAdmin } from "@/server/auth";
import { getSettings } from "@/server/queries";

export const metadata = { title: "Sales Report" };

const periodLabel = (key: string, group: "day" | "month") =>
  group === "month"
    ? new Date(`${key}-01T00:00:00Z`).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" })
    : new Date(`${key}T00:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export default async function SalesReportPage({ searchParams }: PageProps<"/admin/reports/sales">) {
  await requireAdmin("orders");
  const f = parseReportFilters(await searchParams);
  const [report, settings] = await Promise.all([getSalesReport(f), getSettings()]);
  const { totals } = report;
  // Long daily ranges: hide empty days on screen and paper (the Excel file keeps every day).
  const rows = f.group === "day" && report.rows.length > 62 ? report.rows.filter((r) => r.orders) : report.rows;

  return (
    <>
      <div className="print:hidden">
        <PageHeader title="Sales Report" description="Orders and revenue over time, by payment method and status." />
      </div>
      <ReportToolbar kind="sales" filters={f} />
      <PrintHeader title="Sales Report" filters={f} storeName={settings.storeName} extra={[`Grouped by ${f.group}`]} />

      <StatGrid
        stats={[
          { label: "Orders", value: totals.orders.toLocaleString("en-IN") },
          { label: "Items sold", value: totals.items.toLocaleString("en-IN") },
          { label: "Gross sales", value: formatTaka(totals.subtotal), hint: "Before discounts" },
          { label: "Discounts", value: formatTaka(totals.discount) },
          { label: "Delivery charges", value: formatTaka(totals.shipping) },
          { label: "Net revenue", value: formatTaka(totals.total), hint: `Avg order ${formatTaka(totals.aov)}` },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px] print:block">
        <section className="overflow-hidden rounded-2xl border border-line bg-surface print:mb-6 print:rounded-none print:border-0">
          <h2 className="border-b border-line px-5 py-4 font-bold text-heading print:px-0 print:py-2">Sales by {f.group}</h2>
          <div className="overflow-x-auto">
            <table className={`${reportTable} min-w-[680px] print:min-w-0`}>
              <thead className={reportHead}>
                <tr>
                  <th className={th}>{f.group === "month" ? "Month" : "Date"}</th>
                  <th className={`${th} text-right`}>Orders</th>
                  <th className={`${th} text-right`}>Items</th>
                  <th className={`${th} text-right`}>Gross</th>
                  <th className={`${th} text-right`}>Discount</th>
                  <th className={`${th} text-right`}>Delivery</th>
                  <th className={`${th} text-right`}>Net revenue</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-body">
                      No orders in this range.
                    </td>
                  </tr>
                )}
                {rows.map((r) => (
                  <tr key={r.period} className={`border-t border-line ${r.orders ? "" : "text-body/60"}`}>
                    <td className={td}>{periodLabel(r.period, f.group)}</td>
                    <td className={`${td} text-right`}>{r.orders}</td>
                    <td className={`${td} text-right`}>{r.items}</td>
                    <td className={`${td} text-right`}>{formatTaka(r.subtotal)}</td>
                    <td className={`${td} text-right`}>{r.discount ? `−${formatTaka(r.discount)}` : "—"}</td>
                    <td className={`${td} text-right`}>{formatTaka(r.shipping)}</td>
                    <td className={`${td} text-right font-bold text-heading`}>{formatTaka(r.total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-heading/20 bg-soft font-bold text-heading">
                  <td className={td}>Total</td>
                  <td className={`${td} text-right`}>{totals.orders}</td>
                  <td className={`${td} text-right`}>{totals.items}</td>
                  <td className={`${td} text-right`}>{formatTaka(totals.subtotal)}</td>
                  <td className={`${td} text-right`}>{totals.discount ? `−${formatTaka(totals.discount)}` : "—"}</td>
                  <td className={`${td} text-right`}>{formatTaka(totals.shipping)}</td>
                  <td className={`${td} text-right`}>{formatTaka(totals.total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        <div className="space-y-6 print:grid print:grid-cols-2 print:gap-6 print:space-y-0">
          <BreakdownTable
            title="By payment method"
            rows={report.byPayment.map((r) => ({ key: r.method, label: paymentMethods.find((m) => m.id === r.method)?.label ?? r.method, orders: r.orders, total: r.total }))}
            grand={totals.total}
          />
          <BreakdownTable
            title="By order status"
            rows={report.byStatus.map((r) => ({ key: r.status, label: orderStatusMeta[r.status]?.label ?? r.status, orders: r.orders, total: r.total }))}
            grand={totals.total}
          />
        </div>
      </div>

      <p className="mt-4 text-xs text-body print:hidden">
        Export Excel adds a sheet with every order in the range{report.truncated ? " (first 5,000)" : ""}.
      </p>
    </>
  );
}

function BreakdownTable({ title, rows, grand }: { title: string; rows: { key: string; label: string; orders: number; total: number }[]; grand: number }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-surface print:rounded-none print:border-0">
      <h2 className="border-b border-line px-5 py-4 font-bold text-heading print:px-0 print:py-2">{title}</h2>
      <table className={reportTable}>
        <thead className={reportHead}>
          <tr>
            <th className={th}>Name</th>
            <th className={`${th} text-right`}>Orders</th>
            <th className={`${th} text-right`}>Revenue</th>
            <th className={`${th} text-right`}>Share</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-6 text-center text-body">
                No orders.
              </td>
            </tr>
          )}
          {rows.map((r) => (
            <tr key={r.key} className="border-t border-line">
              <td className={td}>{r.label}</td>
              <td className={`${td} text-right`}>{r.orders}</td>
              <td className={`${td} text-right`}>{formatTaka(r.total)}</td>
              <td className={`${td} text-right text-body`}>{grand ? `${Math.round((r.total / grand) * 100)}%` : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
