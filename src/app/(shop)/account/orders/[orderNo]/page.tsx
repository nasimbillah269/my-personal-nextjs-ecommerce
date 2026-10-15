import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, MapPin, Phone, X } from "lucide-react";
import { AccountCard, formatOrderDate, OrderStatus } from "@/components/account/AccountParts";
import { paymentMethods, paymentStatusMeta, variantLabel } from "@/lib/checkout";
import { formatPrice } from "@/lib/ui";
import { getCustomerOrder } from "@/server/account";
import { requireCustomer } from "@/server/customer-auth";

const steps = ["pending", "confirmed", "processing", "shipped", "delivered"] as const;
const stepLabels: Record<(typeof steps)[number], string> = {
  pending: "Placed",
  confirmed: "Confirmed",
  processing: "Packing",
  shipped: "On the way",
  delivered: "Delivered",
};

export default async function AccountOrderPage({ params }: PageProps<"/account/orders/[orderNo]">) {
  const { orderNo } = await params;
  const me = await requireCustomer(`/account/orders/${orderNo}`);
  const order = await getCustomerOrder(me.id, orderNo);
  if (!order) notFound();

  const cancelled = order.status === "cancelled";
  const reached = steps.indexOf(order.status as (typeof steps)[number]);
  const payment = paymentMethods.find((p) => p.id === order.paymentMethod);
  const payStatus = paymentStatusMeta[order.paymentStatus];
  const t = order.totals;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/account/orders" className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline">
            <ArrowLeft className="size-4" /> My orders
          </Link>
          <h1 className="mt-2 flex flex-wrap items-center gap-3 text-2xl font-bold text-heading">
            {order.orderNo} <OrderStatus status={order.status} />
          </h1>
          <p className="mt-1 text-sm text-body">Placed on {formatOrderDate(order.createdAt)}</p>
        </div>
      </div>

      {/* Progress */}
      <AccountCard>
        {cancelled ? (
          <p className="flex items-center gap-3 p-5 text-sm font-semibold text-rose-600">
            <span className="grid size-9 place-items-center rounded-full bg-rose-100">
              <X className="size-4" />
            </span>
            This order was cancelled.
          </p>
        ) : (
          <ol className="flex items-start p-5">
            {steps.map((s, i) => {
              const done = i <= reached;
              return (
                <li key={s} className={`flex items-start ${i < steps.length - 1 ? "flex-1" : ""}`}>
                  <span className="flex flex-col items-center gap-1.5 text-center">
                    <span
                      className={`grid size-9 place-items-center rounded-full text-sm font-bold ${
                        done ? "bg-brand text-white" : "border-2 border-line text-body"
                      }`}
                    >
                      {done ? <Check className="size-4" /> : i + 1}
                    </span>
                    <span className={`text-[11px] font-semibold sm:text-xs ${done ? "text-heading" : "text-body"}`}>{stepLabels[s]}</span>
                  </span>
                  {i < steps.length - 1 && <span className={`mt-4 h-1 flex-1 rounded-full ${i < reached ? "bg-brand" : "bg-line"}`} />}
                </li>
              );
            })}
          </ol>
        )}
      </AccountCard>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <AccountCard title={`Items (${order.items.reduce((n, i) => n + i.qty, 0)})`}>
          <ul className="divide-y divide-line">
            {order.items.map((item, i) => (
              <li key={i} className="flex items-center gap-4 px-5 py-4">
                <span className="relative grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl" style={{ background: item.tint }}>
                  {item.image ? <Image src={item.image} alt="" fill sizes="56px" className="object-cover" /> : <span className="text-2xl">{item.emoji}</span>}
                </span>
                <span className="min-w-0 flex-1">
                  <Link href={`/products/${item.slug}`} className="line-clamp-2 text-sm font-bold text-heading hover:text-brand">
                    {item.name}
                  </Link>
                  <span className="text-xs text-body">
                    {variantLabel(item.variant) ? `${item.variant} · ` : ""}
                    {formatPrice(item.price)} × {item.qty}
                  </span>
                </span>
                <span className="font-bold text-heading">{formatPrice(item.price * item.qty)}</span>
              </li>
            ))}
          </ul>
          <dl className="space-y-2 border-t border-line bg-soft/50 px-5 py-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-body">Subtotal</dt>
              <dd className="font-semibold text-heading">{formatPrice(t.subtotal)}</dd>
            </div>
            {t.discount > 0 && (
              <div className="flex justify-between">
                <dt className="text-body">Discount{t.coupon ? ` (${t.coupon})` : ""}</dt>
                <dd className="font-semibold text-leaf">−{formatPrice(t.discount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-body">Delivery</dt>
              <dd className="font-semibold text-heading">{t.shipping ? formatPrice(t.shipping) : "Free"}</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-2 text-base">
              <dt className="font-bold text-heading">Total</dt>
              <dd className="font-bold text-brand">{formatPrice(t.total)}</dd>
            </div>
          </dl>
        </AccountCard>

        <div className="space-y-6">
          <AccountCard title="Delivery">
            <div className="space-y-2.5 p-5 text-sm text-heading">
              <p className="font-bold">{order.customer.name}</p>
              <p className="flex gap-2">
                <Phone className="mt-0.5 size-4 shrink-0 text-brand" /> {order.customer.phone}
              </p>
              <p className="flex gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0 text-brand" />
                <span>
                  {order.customer.address}
                  <br />
                  {order.customer.area}, {order.customer.division}
                </span>
              </p>
              {order.customer.note && <p className="rounded-lg bg-soft p-3 text-xs text-body">Note: {order.customer.note}</p>}
            </div>
          </AccountCard>
          <AccountCard title="Payment">
            <div className="space-y-2 p-5 text-sm">
              <p className="flex justify-between">
                <span className="text-body">Method</span>
                <span className="font-semibold text-heading">{payment?.label ?? order.paymentMethod}</span>
              </p>
              <p className="flex items-center justify-between">
                <span className="text-body">Status</span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${payStatus?.className ?? "bg-soft text-body"}`}>
                  {payStatus?.label ?? order.paymentStatus}
                </span>
              </p>
              {order.trxId && (
                <p className="flex justify-between">
                  <span className="text-body">Transaction ID</span>
                  <span className="font-mono font-semibold text-heading">{order.trxId}</span>
                </p>
              )}
            </div>
          </AccountCard>
        </div>
      </div>
    </div>
  );
}
