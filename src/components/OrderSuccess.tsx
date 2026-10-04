"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  Check,
  ClipboardCheck,
  Copy,
  House,
  MapPin,
  PackageCheck,
  PhoneCall,
  Printer,
  Truck,
  Wallet,
} from "lucide-react";
import { deliveryOptions, paymentMethods, variantLabel } from "@/lib/checkout";
import type { OrderView } from "@/lib/types";
import { formatPrice } from "@/lib/ui";
import { CheckoutHeading, ProductThumb, SummaryRow } from "./CheckoutUI";

export function OrderSuccess({ order }: { order: OrderView | null }) {
  const [copied, setCopied] = useState(false);

  if (!order) {
    return (
      <>
        <CheckoutHeading title="Order Complete" step={2} />
        <div className="mt-8 rounded-2xl border border-dashed border-line px-6 py-16 text-center">
          <p className="text-lg font-bold text-heading">No recent order found</p>
          <Link href="/products" className="mt-4 inline-block font-bold text-brand hover:underline">
            Continue shopping →
          </Link>
        </div>
      </>
    );
  }

  const delivery = deliveryOptions.find((d) => d.id === order.delivery)!;
  const payment = paymentMethods.find((p) => p.id === order.paymentMethod)!;
  const placedAt = new Date(order.createdAt);
  const paidOnline = order.paymentMethod === "bkash" || order.paymentMethod === "nagad";

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(order.orderNo);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard blocked — ignore
    }
  };

  const timeline = [
    { icon: ClipboardCheck, title: "Order placed", text: placedAt.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }), done: true },
    { icon: PhoneCall, title: "Order confirmation", text: `Our team will call ${order.customer.phone} to confirm.` },
    { icon: Truck, title: "Packed & shipped", text: "You’ll get an SMS when your parcel is on the way." },
    { icon: PackageCheck, title: "Delivered", text: `Expected within ${delivery.eta}.` },
  ];

  return (
    <>
      <div className="print:hidden">
        <CheckoutHeading title="Order Complete" step={2} />
      </div>

      {/* Hero */}
      <section className="mt-8 rounded-2xl border border-line bg-white px-6 py-10 text-center sm:px-10 lg:py-14">
        <div className="relative mx-auto grid size-24 place-items-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-brand/20 [animation-iteration-count:2]" />
          <span className="relative grid size-24 animate-pop place-items-center rounded-full bg-brand text-white shadow-xl shadow-brand/30">
            <Check className="size-12" strokeWidth={3} />
          </span>
        </div>
        <h2 className="mt-6 text-2xl font-bold text-heading sm:text-3xl">Thank you for your order!</h2>
        <p className="mt-2 font-bangla text-base text-leaf">আপনার অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে।</p>
        <p className="mx-auto mt-2 max-w-lg text-sm text-body">
          We’ve received your order and will contact you shortly to confirm it.
          {order.customer.email && ` A confirmation has been sent to ${order.customer.email}.`}
        </p>

        <div className="mx-auto mt-8 grid max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line text-left md:grid-cols-4">
          {[
            {
              label: "Order number",
              value: (
                <button
                  type="button"
                  onClick={copyId}
                  className="flex items-center gap-1.5 text-brand hover:underline print:hidden"
                  aria-label="Copy order number"
                >
                  {order.orderNo}
                  {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                </button>
              ),
            },
            { label: "Date", value: placedAt.toLocaleDateString("en-GB", { dateStyle: "medium" }) },
            { label: "Total", value: formatPrice(order.totals.total) },
            { label: "Payment", value: payment.label },
          ].map((cell) => (
            <div key={cell.label} className="bg-white p-4">
              <p className="text-[11px] font-semibold tracking-wide text-body uppercase">{cell.label}</p>
              <div className="mt-1 text-sm font-bold text-heading">{cell.value}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px]">
        {/* Order details */}
        <section className="self-start rounded-2xl border border-line bg-white p-6 sm:p-7">
          <h3 className="border-b border-line pb-4 text-lg font-bold text-heading">Order Details</h3>
          <ul className="divide-y divide-line">
            {order.items.map((item) => {
              const variant = variantLabel(item.variant);
              return (
                <li key={`${item.slug}-${item.variant}`} className="flex items-center gap-4 py-4">
                  <ProductThumb product={item} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 text-sm font-bold text-heading">{item.name}</span>
                    <span className="text-xs text-body">
                      {variant ? `${variant} · ` : ""}
                      {formatPrice(item.price)} × {item.qty}
                    </span>
                  </span>
                  <span className="text-sm font-bold text-heading">{formatPrice(item.price * item.qty)}</span>
                </li>
              );
            })}
          </ul>
          <dl className="space-y-3 border-t border-line pt-5">
            <SummaryRow label="Subtotal" value={formatPrice(order.totals.subtotal)} />
            {order.totals.discount > 0 && (
              <SummaryRow
                label={`Discount${order.totals.coupon ? ` (${order.totals.coupon})` : ""}`}
                value={`−${formatPrice(order.totals.discount)}`}
                tone="discount"
              />
            )}
            <SummaryRow
              label={`Delivery (${delivery.label})`}
              value={order.totals.shipping === 0 ? "FREE" : formatPrice(order.totals.shipping)}
              tone={order.totals.shipping === 0 ? "free" : undefined}
            />
          </dl>
          <div className="mt-5 flex items-end justify-between border-t border-dashed border-line pt-5">
            <span className="font-bold text-heading">Total</span>
            <span className="text-2xl font-bold text-brand">{formatPrice(order.totals.total)}</span>
          </div>
        </section>

        <div className="space-y-6">
          {/* Delivery + payment */}
          <section className="rounded-2xl border border-line bg-white p-6">
            <h3 className="mb-4 flex items-center gap-2 font-bold text-heading">
              <MapPin className="size-5 text-brand" /> Delivery Address
            </h3>
            <address className="text-sm leading-6 text-heading not-italic">
              <span className="font-bold">{order.customer.name}</span>
              <br />
              {order.customer.phone}
              <br />
              {order.customer.address}
              <br />
              {order.customer.area}, {order.customer.division}
            </address>
            {order.customer.note && (
              <p className="mt-3 rounded-lg bg-soft p-3 text-xs text-body">Note: {order.customer.note}</p>
            )}

            <h3 className="mt-6 mb-3 flex items-center gap-2 border-t border-line pt-5 font-bold text-heading">
              <Wallet className="size-5 text-brand" /> Payment
            </h3>
            <p className="text-sm text-heading">
              <span className="font-bold" style={{ color: payment.color }}>{payment.label}</span>
            </p>
            <p className="mt-1 text-xs text-body">
              {order.paymentMethod === "cod" && `Please pay ${formatPrice(order.totals.total)} to the delivery person.`}
              {paidOnline && `TrxID ${order.trxId} — we’ll verify your payment and confirm shortly.`}
              {order.paymentMethod === "card" && "Complete your payment on the secure payment page."}
            </p>
          </section>

          {/* What's next */}
          <section className="rounded-2xl border border-line bg-white p-6">
            <h3 className="mb-5 font-bold text-heading">What happens next?</h3>
            <ol>
              {timeline.map(({ icon: Icon, title, text, done }, i) => (
                <li key={title} className="relative flex gap-4 pb-6 last:pb-0">
                  {i < timeline.length - 1 && (
                    <span className={`absolute top-10 left-[19px] h-[calc(100%-2.75rem)] w-0.5 ${done ? "bg-brand" : "bg-line"}`} />
                  )}
                  <span
                    className={`grid size-10 shrink-0 place-items-center rounded-full ${
                      done ? "bg-brand text-white" : "bg-soft text-body"
                    }`}
                  >
                    <Icon className="size-5" />
                  </span>
                  <span className="pt-1">
                    <span className="block text-sm font-bold text-heading">{title}</span>
                    <span className="text-xs text-body">{text}</span>
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3 print:hidden">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 rounded-full bg-brand px-7 py-3 text-sm font-bold text-white transition hover:bg-brand-dark"
        >
          Continue Shopping <ArrowRight className="size-4" />
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-line px-7 py-3 text-sm font-bold text-heading transition hover:border-brand hover:text-brand"
        >
          <House className="size-4" /> Back to Home
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-full border border-line px-7 py-3 text-sm font-bold text-heading transition hover:border-brand hover:text-brand"
        >
          <Printer className="size-4" /> Print Receipt
        </button>
      </div>
    </>
  );
}
