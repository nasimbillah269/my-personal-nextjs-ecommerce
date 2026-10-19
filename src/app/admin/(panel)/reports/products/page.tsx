import { PageHeader, formatTaka } from "@/components/admin/ui";
import { PrintHeader, ReportToolbar, StatGrid, reportHead, reportTable, td, th } from "@/components/admin/ReportParts";
import { getProductReport, listReportCategories, parseReportFilters, REPORT_ROW_LIMIT } from "@/server/admin/reports";
import { requireAdmin } from "@/server/auth";
import { getSettings } from "@/server/queries";

export const metadata = { title: "Product Report" };

export default async function ProductReportPage({ searchParams }: PageProps<"/admin/reports/products">) {
  await requireAdmin("orders");
  const f = parseReportFilters(await searchParams);
  const [report, categories, settings] = await Promise.all([getProductReport(f), listReportCategories(), getSettings()]);
  const { rows, totals } = report;
  const category = categories.find((c) => c.id === f.category)?.name;
  const top = rows[0];

  return (
    <>
      <div className="print:hidden">
        <PageHeader title="Product Report" description="What sold: quantity, orders and revenue per product, with current stock." />
      </div>
      <ReportToolbar kind="products" filters={f} categories={categories} searchPlaceholder="Product name…" />
      <PrintHeader
        title="Product Report"
        filters={f}
        storeName={settings.storeName}
        extra={[category && `Category: ${category}`, f.q && `Search: “${f.q}”`].filter((x): x is string => !!x)}
      />

      <StatGrid
        stats={[
          { label: "Products sold", value: rows.length.toLocaleString("en-IN") },
          { label: "Units sold", value: totals.qty.toLocaleString("en-IN") },
          { label: "Product revenue", value: formatTaka(totals.revenue), hint: "Excludes delivery & discounts" },
          { label: "Avg unit price", value: formatTaka(totals.qty ? Math.round(totals.revenue / totals.qty) : 0) },
          { label: "Top product", value: top ? top.name : "—", hint: top ? `${top.qty} units` : undefined },
          { label: "Low stock (≤ 5)", value: String(rows.filter((r) => r.stock !== null && r.stock <= 5).length), hint: "Among sold products" },
        ]}
      />

      <section className="overflow-hidden rounded-2xl border border-line bg-surface print:rounded-none print:border-0">
        <div className="overflow-x-auto">
          <table className={`${reportTable} min-w-[760px] print:min-w-0`}>
            <thead className={reportHead}>
              <tr>
                <th className={`${th} w-12`}>#</th>
                <th className={th}>Product</th>
                <th className={th}>Category</th>
                <th className={`${th} text-right`}>Qty sold</th>
                <th className={`${th} text-right`}>Orders</th>
                <th className={`${th} text-right`}>Avg price</th>
                <th className={`${th} text-right`}>Revenue</th>
                <th className={`${th} text-right`}>Share</th>
                <th className={`${th} text-right`}>Stock</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-body">
                    No products sold in this range.
                  </td>
                </tr>
              )}
              {rows.map((r, i) => (
                <tr key={`${r.slug}-${r.name}`} className="border-t border-line">
                  <td className={`${td} text-body`}>{i + 1}</td>
                  <td className={td}>
                    <span className="font-semibold text-heading">{r.name}</span>
                    {r.deleted && <span className="ml-2 text-xs text-body">(deleted)</span>}
                  </td>
                  <td className={`${td} text-body`}>{r.category ?? "—"}</td>
                  <td className={`${td} text-right font-bold text-heading`}>{r.qty}</td>
                  <td className={`${td} text-right`}>{r.orders}</td>
                  <td className={`${td} text-right`}>{formatTaka(r.avgPrice)}</td>
                  <td className={`${td} text-right font-bold text-heading`}>{formatTaka(r.revenue)}</td>
                  <td className={`${td} text-right text-body`}>{totals.revenue ? `${((r.revenue / totals.revenue) * 100).toFixed(1)}%` : "—"}</td>
                  <td className={`${td} text-right ${r.stock !== null && r.stock <= 5 ? "font-bold text-red-500" : ""}`}>{r.stock ?? "—"}</td>
                </tr>
              ))}
            </tbody>
            {rows.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-heading/20 bg-soft font-bold text-heading">
                  <td className={td} colSpan={3}>
                    Total
                  </td>
                  <td className={`${td} text-right`}>{totals.qty}</td>
                  <td className={td} />
                  <td className={td} />
                  <td className={`${td} text-right`}>{formatTaka(totals.revenue)}</td>
                  <td className={`${td} text-right`}>100%</td>
                  <td className={td} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </section>
      <p className="mt-4 text-xs text-body print:hidden">
        Export Excel adds a sheet with sales per product variant (size/weight).
        {rows.length >= REPORT_ROW_LIMIT && ` Showing the top ${REPORT_ROW_LIMIT.toLocaleString("en-IN")} products.`}
      </p>
    </>
  );
}
