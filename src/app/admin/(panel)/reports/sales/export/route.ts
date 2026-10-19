import { orderStatusMeta, paymentMethods, paymentStatusMeta } from "@/lib/checkout";
import { getSalesReport, parseReportFilters, reportTitleLines } from "@/server/admin/reports";
import { requireAdmin } from "@/server/auth";
import { getSettings } from "@/server/queries";
import { dhakaStamp, xlsxResponse } from "@/server/xlsx";

const payment = (id: string) => paymentMethods.find((m) => m.id === id)?.label ?? id;

export async function GET(req: Request) {
  await requireAdmin("orders");
  const f = parseReportFilters(Object.fromEntries(new URL(req.url).searchParams));
  const [r, settings] = await Promise.all([getSalesReport(f), getSettings()]);
  const title = reportTitleLines("Sales Report", f, settings.storeName);
  const t = r.totals;

  return xlsxResponse(
    [
      {
        name: "Summary",
        title,
        header: [f.group === "month" ? "Month" : "Date", "Orders", "Items", "Gross (৳)", "Discount (৳)", "Delivery (৳)", "Net revenue (৳)"],
        rows: r.rows.map((x) => [x.period, x.orders, x.items, x.subtotal, x.discount, x.shipping, x.total]),
        footer: ["Total", t.orders, t.items, t.subtotal, t.discount, t.shipping, t.total],
        widths: [16, 10, 10, 14, 14, 14, 18],
      },
      {
        name: "By payment & status",
        title,
        header: ["Group", "Name", "Orders", "Revenue (৳)"],
        rows: [
          ...r.byPayment.map((x) => ["Payment method", payment(x.method), x.orders, x.total]),
          ...r.byStatus.map((x) => ["Order status", orderStatusMeta[x.status]?.label ?? x.status, x.orders, x.total]),
        ],
        widths: [18, 26, 10, 16],
      },
      {
        name: "Orders",
        title,
        header: ["Order no", "Date (Dhaka)", "Customer", "Phone", "Division", "Status", "Payment", "Payment status", "Coupon", "Items", "Subtotal (৳)", "Discount (৳)", "Delivery (৳)", "Total (৳)"],
        rows: r.orders.map((o) => [
          o.orderNo,
          dhakaStamp(o.createdAt),
          o.customerName,
          o.phone,
          o.division,
          orderStatusMeta[o.status]?.label ?? o.status,
          payment(o.paymentMethod),
          paymentStatusMeta[o.paymentStatus]?.label ?? o.paymentStatus,
          o.couponCode ?? "",
          o.items,
          o.subtotal,
          o.discount,
          o.shipping,
          o.total,
        ]),
        footer: r.truncated ? ["Only the latest 5,000 orders are listed; the Summary sheet covers all of them."] : undefined,
      },
    ],
    `sales-report-${f.from}-to-${f.to}.xlsx`,
  );
}
