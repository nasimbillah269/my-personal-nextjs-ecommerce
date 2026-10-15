import Link from "next/link";
import { ChevronRight, Package } from "lucide-react";
import { orderStatusMeta, paymentMethods } from "@/lib/checkout";
import { formatPrice } from "@/lib/ui";

export const formatOrderDate = (d: Date | string) =>
  new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Dhaka" });

export function OrderStatus({ status }: { status: string }) {
  const meta = orderStatusMeta[status] ?? { label: status, className: "bg-soft text-body" };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${meta.className}`}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {meta.label}
    </span>
  );
}

export type OrderRow = {
  orderNo: string;
  status: string;
  paymentMethod: string;
  total: number;
  createdAt: Date;
  items: number;
};

/** Card list on phones, table from sm up. */
export function OrdersTable({ rows }: { rows: OrderRow[] }) {
  if (!rows.length) {
    return (
      <div className="flex flex-col items-center px-6 py-14 text-center">
        <span className="grid size-16 place-items-center rounded-full bg-brand-light">
          <Package className="size-8 text-brand" strokeWidth={1.5} />
        </span>
        <p className="mt-4 font-bold text-heading">No orders yet</p>
        <p className="mt-1 text-sm text-body">Orders you place while logged in will show up here.</p>
        <Link href="/products" className="mt-5 rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white transition hover:bg-brand-dark">
          Start shopping
        </Link>
      </div>
    );
  }
  return (
    <>
      <ul className="divide-y divide-line sm:hidden">
        {rows.map((o) => (
          <li key={o.orderNo}>
            <Link href={`/account/orders/${o.orderNo}`} className="flex items-center gap-3 px-4 py-3.5">
              <span className="min-w-0 flex-1">
                <span className="block font-bold text-heading">{o.orderNo}</span>
                <span className="text-xs text-body">
                  {formatOrderDate(o.createdAt)} · {o.items} item{o.items === 1 ? "" : "s"}
                </span>
                <span className="mt-1.5 block">
                  <OrderStatus status={o.status} />
                </span>
              </span>
              <span className="font-bold text-heading">{formatPrice(o.total)}</span>
              <ChevronRight className="size-4 text-body" />
            </Link>
          </li>
        ))}
      </ul>
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full text-sm">
          <thead className="bg-soft text-left text-xs font-bold tracking-wide text-body uppercase">
            <tr>
              <th className="px-5 py-3">Order</th>
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3 text-center">Items</th>
              <th className="px-5 py-3">Payment</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Total</th>
              <th className="px-5 py-3">
                <span className="sr-only">View</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.orderNo} className="border-t border-line transition hover:bg-soft/60">
                <td className="px-5 py-3.5 font-bold text-heading">{o.orderNo}</td>
                <td className="px-5 py-3.5 text-body">{formatOrderDate(o.createdAt)}</td>
                <td className="px-5 py-3.5 text-center text-heading">{o.items}</td>
                <td className="px-5 py-3.5 text-heading">{paymentMethods.find((p) => p.id === o.paymentMethod)?.short ?? o.paymentMethod}</td>
                <td className="px-5 py-3.5">
                  <OrderStatus status={o.status} />
                </td>
                <td className="px-5 py-3.5 text-right font-bold text-heading">{formatPrice(o.total)}</td>
                <td className="px-5 py-3.5 text-right">
                  <Link href={`/account/orders/${o.orderNo}`} className="text-xs font-bold text-brand hover:underline">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function AccountCard({ title, action, children, className = "" }: { title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`overflow-hidden rounded-2xl border border-line bg-white ${className}`}>
      {title && (
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
          <h2 className="font-bold text-heading">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
