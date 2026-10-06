import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, Mail, MapPin, Phone, StickyNote, User, X } from "lucide-react";
import { OrderActions, OrderUpdateForm } from "@/components/admin/OrderForms";
import {
  Card,
  formatDateTime,
  formatTaka,
  PaymentMethodLabel,
  PaymentStatusBadge,
  StatusBadge,
  Thumb,
} from "@/components/admin/ui";
import { deliveryOptions, orderStatusMeta, paymentMethods, variantLabel } from "@/lib/checkout";
import { getOrderDetail } from "@/server/admin/queries";
import { requireAdmin } from "@/server/auth";

const flow = ["pending", "confirmed", "processing", "shipped", "delivered"] as const;

export async function generateMetadata({ params }: PageProps<"/admin/orders/[id]">) {
  const { id } = await params;
  return { title: `Order #${id}` };
}

export default async function OrderDetailPage({ params }: PageProps<"/admin/orders/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const data = await getOrderDetail(Number(id));
  if (!data) notFound();
  const { order: o, items, customerOrders, customerSpent } = data;

  const delivery = deliveryOptions.find((d) => d.id === o.delivery);
  const payment = paymentMethods.find((p) => p.id === o.paymentMethod);
  const step = flow.indexOf(o.status as (typeof flow)[number]);
  const cancelled = o.status === "cancelled";

  return (
    <>
      <Link href="/admin/orders" className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-body hover:text-brand print:hidden">
        <ArrowLeft className="size-4" /> All orders
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-heading">{o.orderNo}</h1>
            <StatusBadge status={o.status} />
            <PaymentStatusBadge status={o.paymentStatus} />
          </div>
          <p className="mt-1 text-sm text-body">Placed on {formatDateTime(o.createdAt)}</p>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <OrderActions id={o.id} orderNo={o.orderNo} />
        </div>
      </div>

      {/* Progress */}
      <Card className="mb-6 print:hidden">
        {cancelled ? (
          <p className="flex items-center gap-2 text-sm font-bold text-rose-600">
            <X className="size-5" /> This order was cancelled. Its items were returned to stock.
          </p>
        ) : (
          <ol className="flex items-center">
            {flow.map((s, i) => (
              <li key={s} className={`flex items-center ${i < flow.length - 1 ? "flex-1" : ""}`}>
                <span className="flex flex-col items-center gap-1.5">
                  <span
                    className={`grid size-9 place-items-center rounded-full text-sm font-bold ${
                      i <= step ? "bg-brand text-white" : "border-2 border-line bg-surface text-body"
                    } ${i === step ? "ring-4 ring-brand-light" : ""}`}
                  >
                    {i < step ? <Check className="size-4" strokeWidth={3} /> : i + 1}
                  </span>
                  <span className={`text-[11px] font-bold sm:text-xs ${i <= step ? "text-heading" : "text-body"}`}>
                    {orderStatusMeta[s].label}
                  </span>
                </span>
                {i < flow.length - 1 && (
                  <span className={`mx-1 mb-6 h-1 flex-1 rounded-full sm:mx-2 ${i < step ? "bg-brand" : "bg-line"}`} />
                )}
              </li>
            ))}
          </ol>
        )}
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-6">
          <Card title={`Items (${items.reduce((n, i) => n + i.qty, 0)})`} bodyClassName="">
            <ul className="divide-y divide-line">
              {items.map((item) => {
                const variant = variantLabel(item.variant);
                return (
                  <li key={item.id} className="flex items-center gap-4 px-5 py-4">
                    <Thumb emoji={item.emoji} tint={item.tint} image={item.image} name={item.productName} />
                    <div className="min-w-0 flex-1">
                      {item.productId ? (
                        <Link href={`/admin/products/${item.productId}`} className="line-clamp-2 text-sm font-bold text-heading hover:text-brand">
                          {item.productName}
                        </Link>
                      ) : (
                        <p className="line-clamp-2 text-sm font-bold text-heading">{item.productName}</p>
                      )}
                      <p className="text-xs text-body">
                        {variant ? `${variant} · ` : ""}
                        {formatTaka(item.price)} × {item.qty}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-heading tabular-nums">{formatTaka(item.price * item.qty)}</p>
                  </li>
                );
              })}
            </ul>
            <dl className="space-y-2.5 border-t border-line px-5 py-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-body">Subtotal</dt>
                <dd className="font-semibold text-heading tabular-nums">{formatTaka(o.subtotal)}</dd>
              </div>
              {o.discount > 0 && (
                <div className="flex justify-between">
                  <dt className="text-body">Discount {o.couponCode && <span className="rounded bg-soft px-1.5 py-0.5 text-xs font-bold">{o.couponCode}</span>}</dt>
                  <dd className="font-semibold text-rose-600 tabular-nums">−{formatTaka(o.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-body">Delivery ({delivery?.label})</dt>
                <dd className="font-semibold text-heading tabular-nums">{o.shipping === 0 ? "Free" : formatTaka(o.shipping)}</dd>
              </div>
              <div className="flex justify-between border-t border-dashed border-line pt-3 text-base">
                <dt className="font-bold text-heading">Total</dt>
                <dd className="font-bold text-brand tabular-nums">{formatTaka(o.total)}</dd>
              </div>
            </dl>
          </Card>

          {(o.note || o.adminNote) && (
            <Card title="Notes">
              {o.note && (
                <p className="flex gap-2 text-sm text-heading">
                  <StickyNote className="mt-0.5 size-4 shrink-0 text-brand" />
                  <span>
                    <b>Customer:</b> {o.note}
                  </span>
                </p>
              )}
              {o.adminNote && (
                <p className="mt-2 flex gap-2 text-sm text-heading">
                  <StickyNote className="mt-0.5 size-4 shrink-0 text-amber-500" />
                  <span>
                    <b>Internal:</b> {o.adminNote}
                  </span>
                </p>
              )}
            </Card>
          )}
        </div>

        <div className="min-w-0 space-y-6">
          <Card title="Update order" className="print:hidden">
            <OrderUpdateForm id={o.id} status={o.status} paymentStatus={o.paymentStatus} adminNote={o.adminNote} />
          </Card>

          <Card title="Customer">
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2.5 font-bold text-heading">
                <User className="size-4 text-brand" /> {o.customerName}
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="size-4 text-brand" />
                <a href={`tel:${o.phone}`} className="font-semibold text-heading hover:text-brand">
                  {o.phone}
                </a>
              </li>
              {o.email && (
                <li className="flex items-center gap-2.5">
                  <Mail className="size-4 text-brand" />
                  <a href={`mailto:${o.email}`} className="text-heading hover:text-brand">
                    {o.email}
                  </a>
                </li>
              )}
            </ul>
            <Link
              href={`/admin/orders?q=${encodeURIComponent(o.phone)}`}
              className="mt-4 flex justify-between rounded-lg bg-soft px-3 py-2.5 text-xs font-semibold text-heading hover:text-brand print:hidden"
            >
              <span>
                {customerOrders} order{customerOrders === 1 ? "" : "s"} · {formatTaka(customerSpent)} spent
              </span>
              <span className="text-brand">View all →</span>
            </Link>
          </Card>

          <Card title="Shipping address">
            <p className="flex gap-2.5 text-sm leading-6 text-heading">
              <MapPin className="mt-1 size-4 shrink-0 text-brand" />
              <span>
                {o.address}
                <br />
                {o.area}, {o.division}
                <br />
                <span className="text-body">
                  {delivery?.label} · {delivery?.eta}
                </span>
              </span>
            </p>
          </Card>

          <Card title="Payment">
            <div className="flex items-center justify-between">
              <PaymentMethodLabel method={o.paymentMethod} />
              <PaymentStatusBadge status={o.paymentStatus} />
            </div>
            <p className="mt-2 text-xs text-body">{payment?.label}</p>
            {o.trxId && (
              <p className="mt-3 rounded-lg bg-soft px-3 py-2 text-sm">
                <span className="text-body">Transaction ID: </span>
                <b className="font-mono text-heading">{o.trxId}</b>
              </p>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
