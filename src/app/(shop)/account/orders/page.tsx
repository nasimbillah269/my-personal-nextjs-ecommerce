import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AccountCard, OrdersTable } from "@/components/account/AccountParts";
import { ACCOUNT_PAGE_SIZE, listCustomerOrders } from "@/server/account";
import { requireCustomer } from "@/server/customer-auth";

const tabs = [
  { value: undefined, label: "All" },
  { value: "active", label: "In progress" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

export default async function AccountOrdersPage({ searchParams }: PageProps<"/account/orders">) {
  const me = await requireCustomer("/account/orders");
  const sp = await searchParams;
  const status = typeof sp.status === "string" ? sp.status : undefined;
  const page = Math.max(1, Number(sp.page) || 1);
  const { rows, total } = await listCustomerOrders(me.id, page, status);
  const pages = Math.max(1, Math.ceil(total / ACCOUNT_PAGE_SIZE));
  const href = (p: number, s = status) => {
    const q = new URLSearchParams();
    if (s) q.set("status", s);
    if (p > 1) q.set("page", String(p));
    const str = q.toString();
    return str ? `/account/orders?${str}` : "/account/orders";
  };
  const pageBtn = "grid size-9 place-items-center rounded-lg border border-line text-heading transition hover:border-brand hover:text-brand";

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-heading">My orders</h1>
      <nav className="no-scrollbar flex gap-2 overflow-x-auto" aria-label="Filter orders">
        {tabs.map((t) => (
          <Link
            key={t.label}
            href={href(1, t.value)}
            aria-current={status === t.value ? "page" : undefined}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${
              status === t.value ? "bg-brand text-white" : "bg-white text-heading hover:bg-brand-light"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>
      <AccountCard>
        <OrdersTable rows={rows} />
        {pages > 1 && (
          <div className="flex items-center justify-between border-t border-line px-5 py-4 text-sm text-body">
            <span>
              Page {Math.min(page, pages)} of {pages}
            </span>
            <span className="flex gap-2">
              {page > 1 && (
                <Link href={href(page - 1)} aria-label="Previous page" className={pageBtn}>
                  <ChevronLeft className="size-4" />
                </Link>
              )}
              {page < pages && (
                <Link href={href(page + 1)} aria-label="Next page" className={pageBtn}>
                  <ChevronRight className="size-4" />
                </Link>
              )}
            </span>
          </div>
        )}
      </AccountCard>
    </div>
  );
}
