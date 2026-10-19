import { getProductReport, listReportCategories, parseReportFilters, reportTitleLines } from "@/server/admin/reports";
import { requireAdmin } from "@/server/auth";
import { getSettings } from "@/server/queries";
import { xlsxResponse } from "@/server/xlsx";

export async function GET(req: Request) {
  await requireAdmin("orders");
  const f = parseReportFilters(Object.fromEntries(new URL(req.url).searchParams));
  const [r, categories, settings] = await Promise.all([getProductReport(f), listReportCategories(), getSettings()]);
  const category = categories.find((c) => c.id === f.category)?.name;
  const title = reportTitleLines("Product Report", f, settings.storeName, [category && `Category: ${category}`, f.q && `Search: ${f.q}`]);

  return xlsxResponse(
    [
      {
        name: "Products",
        title,
        header: ["#", "Product", "Category", "Qty sold", "Orders", "Avg price (৳)", "Revenue (৳)", "Share %", "Current stock"],
        rows: r.rows.map((x, i) => [
          i + 1,
          x.deleted ? `${x.name} (deleted)` : x.name,
          x.category ?? "",
          x.qty,
          x.orders,
          x.avgPrice,
          x.revenue,
          r.totals.revenue ? Math.round((x.revenue / r.totals.revenue) * 1000) / 10 : 0,
          x.stock,
        ]),
        footer: ["", "Total", "", r.totals.qty, "", "", r.totals.revenue, 100, ""],
        widths: [6, 40, 20, 10, 10, 14, 14, 10, 14],
      },
      {
        name: "Variants",
        title,
        header: ["Product", "Variant", "Qty sold", "Revenue (৳)"],
        rows: r.variants.map((v) => [v.name, v.variant, v.qty, v.revenue]),
        widths: [40, 18, 10, 14],
      },
    ],
    `product-report-${f.from}-to-${f.to}.xlsx`,
  );
}
