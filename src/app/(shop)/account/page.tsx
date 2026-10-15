import Link from "next/link";
import { ClipboardList, MapPin, Pencil, ShoppingBag, Truck, Wallet } from "lucide-react";
import { AccountCard, OrdersTable } from "@/components/account/AccountParts";
import { formatPrice } from "@/lib/ui";
import { getAccountOverview } from "@/server/account";
import { requireCustomer } from "@/server/customer-auth";

export default async function AccountDashboard() {
  const me = await requireCustomer();
  const overview = await getAccountOverview(me.id);
  const firstName = me.name.split(/\s+/)[0];
  const hasAddress = !!(me.address || me.area);

  const stats = [
    { label: "Total orders", value: overview.orders.toLocaleString(), icon: ClipboardList, tint: "bg-brand-light text-brand-dark" },
    { label: "In progress", value: overview.open.toLocaleString(), icon: Truck, tint: "bg-amber-100 text-amber-700" },
    { label: "Total spent", value: formatPrice(overview.spent), icon: Wallet, tint: "bg-emerald-100 text-emerald-700" },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-line bg-linear-to-r from-brand-light/70 to-white p-6">
        <h1 className="text-2xl font-bold text-heading">Hello, {firstName}! 👋</h1>
        <p className="mt-1 text-sm text-body">
          Member since {new Date(me.createdAt).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "Asia/Dhaka" })}. Here’s a quick look at your
          account.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, icon: Icon, tint }) => (
          <div key={label} className="flex items-center gap-4 rounded-2xl border border-line bg-white p-5">
            <span className={`grid size-12 shrink-0 place-items-center rounded-xl ${tint}`}>
              <Icon className="size-6" />
            </span>
            <span>
              <span className="block text-xs font-bold tracking-wide text-body uppercase">{label}</span>
              <span className="text-xl font-bold text-heading">{value}</span>
            </span>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <AccountCard
          title="Recent orders"
          action={
            overview.orders > 0 && (
              <Link href="/account/orders" className="text-xs font-bold text-brand hover:underline">
                View all
              </Link>
            )
          }
        >
          <OrdersTable rows={overview.recent} />
        </AccountCard>

        <div className="space-y-6">
          <AccountCard
            title="Delivery address"
            action={
              <Link href="/account/profile" className="inline-flex items-center gap-1 text-xs font-bold text-brand hover:underline">
                <Pencil className="size-3.5" /> Edit
              </Link>
            }
          >
            <div className="flex gap-3 p-5 text-sm">
              <MapPin className="mt-0.5 size-4 shrink-0 text-brand" />
              {hasAddress ? (
                <p className="text-heading">
                  {me.address}
                  {me.address && <br />}
                  {[me.area, me.division].filter(Boolean).join(", ")}
                </p>
              ) : (
                <p className="text-body">No address saved yet. Add one to check out faster.</p>
              )}
            </div>
          </AccountCard>

          <Link
            href="/products"
            className="flex items-center gap-4 rounded-2xl bg-linear-to-br from-brand to-brand-dark p-5 text-white transition hover:brightness-110"
          >
            <ShoppingBag className="size-8 shrink-0" />
            <span>
              <span className="block font-bold">Continue shopping</span>
              <span className="text-sm text-white/80">Fresh organic picks are waiting.</span>
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
