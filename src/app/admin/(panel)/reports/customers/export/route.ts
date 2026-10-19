import { getCustomerReport, parseReportFilters, reportTitleLines } from "@/server/admin/reports";
import { requireAdmin } from "@/server/auth";
import { getSettings } from "@/server/queries";
import { dhakaStamp, xlsxResponse } from "@/server/xlsx";

export async function GET(req: Request) {
  await requireAdmin("orders");
  const f = parseReportFilters(Object.fromEntries(new URL(req.url).searchParams));
  const [{ rows, totals }, settings] = await Promise.all([getCustomerReport(f), getSettings()]);

  return xlsxResponse(
    [
      {
        name: "Customers",
        title: reportTitleLines("Customer Report", f, settings.storeName, [f.q && `Search: ${f.q}`]),
        header: ["#", "Customer", "Phone", "Email", "Division", "Orders", "Items", "Avg order (৳)", "Total spent (৳)", "First order", "Last order", "Type", "Account"],
        rows: rows.map((r, i) => [
          i + 1,
          r.name,
          r.phone,
          r.email,
          r.division,
          r.orders,
          r.items,
          r.aov,
          r.spent,
          dhakaStamp(r.firstOrder),
          dhakaStamp(r.lastOrder),
          r.isNew ? "New" : "Returning",
          r.registered ? "Yes" : "No",
        ]),
        footer: ["", `Total (${totals.customers} customers)`, "", "", "", totals.orders, "", "", totals.spent],
        widths: [6, 28, 16, 28, 14, 9, 9, 14, 16, 18, 18, 12, 10],
      },
    ],
    `customer-report-${f.from}-to-${f.to}.xlsx`,
  );
}
