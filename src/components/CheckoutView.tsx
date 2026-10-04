"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertCircle, ArrowLeft, Banknote, CreditCard, Info, Loader2, Lock, ShoppingBag, Smartphone } from "lucide-react";
import {
  computeTotals,
  deliveryFee,
  deliveryOptions,
  divisions,
  isValidBdPhone,
  paymentMethods,
  variantLabel,
  type DeliveryId,
  type PaymentId,
} from "@/lib/checkout";
import { formatPrice } from "@/lib/ui";
import { placeOrder } from "@/server/shop-actions";
import { useCart } from "./CartProvider";
import { useStore } from "./StoreProvider";
import { CheckoutHeading, CouponBox, ProductThumb, SummaryRow, TrustList } from "./CheckoutUI";
import { CheckoutSkeleton } from "./ShopSkeletons";

type Form = {
  name: string;
  phone: string;
  email: string;
  division: string;
  area: string;
  address: string;
  note: string;
  delivery: DeliveryId;
  payment: PaymentId;
  trxId: string;
  agree: boolean;
};

type Errors = Partial<Record<keyof Form, string>>;

const initialForm: Form = {
  name: "",
  phone: "",
  email: "",
  division: "Dhaka",
  area: "",
  address: "",
  note: "",
  delivery: "inside",
  payment: "cod",
  trxId: "",
  agree: false,
};

// Order matters: the first invalid field in this list gets focus.
const fieldOrder: (keyof Form)[] = ["name", "phone", "email", "division", "area", "address", "trxId", "agree"];

function validate(f: Form): Errors {
  const e: Errors = {};
  if (f.name.trim().length < 3) e.name = "Please enter your full name.";
  if (!isValidBdPhone(f.phone)) e.phone = "Enter a valid Bangladeshi mobile number (e.g. 01712345678).";
  if (f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = "Enter a valid email address.";
  if (!f.division) e.division = "Select your division.";
  if (f.area.trim().length < 2) e.area = "Enter your area / thana.";
  if (f.address.trim().length < 10) e.address = "Please enter your full address (house, road, area).";
  if ((f.payment === "bkash" || f.payment === "nagad") && !/^[A-Za-z0-9]{8,12}$/.test(f.trxId.trim()))
    e.trxId = "Enter the 8–12 character Transaction ID from your payment SMS.";
  if (!f.agree) e.agree = "Please accept the terms to place your order.";
  return e;
}

const inputClass = (error?: string) =>
  `w-full rounded-lg border bg-white px-4 text-sm text-heading outline-none transition placeholder:text-body/60 focus:border-brand focus:ring-4 focus:ring-brand-light ${
    error ? "border-red-400" : "border-line"
  }`;

function Field({
  id,
  label,
  required,
  error,
  hint,
  className = "",
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-bold text-heading">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs font-semibold text-red-500">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-body">{hint}</p>
      )}
    </div>
  );
}

function SectionCard({ step, title, children }: { step: number; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-white p-5 sm:p-7">
      <h2 className="mb-6 flex items-center gap-3 text-lg font-bold text-heading">
        <span className="grid size-8 place-items-center rounded-full bg-brand text-sm text-white">{step}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

const paymentIcons: Record<PaymentId, typeof Banknote> = {
  cod: Banknote,
  bkash: Smartphone,
  nagad: Smartphone,
  card: CreditCard,
};

export function CheckoutView() {
  const router = useRouter();
  const { ready, lines, cartCount, subtotal, coupon, clearCart, applyCoupon, syncLines } = useCart();
  const { settings } = useStore();
  const [form, setForm] = useState<Form>(initialForm);
  const [errors, setErrors] = useState<Errors>({});
  const [placing, setPlacing] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  if (!ready) return <CheckoutSkeleton standalone={false} />;

  if (lines.length === 0 && !placing) {
    return (
      <>
        <CheckoutHeading title="Checkout" step={1} />
        <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed border-line px-6 py-16 text-center">
          <ShoppingBag className="size-14 text-brand" strokeWidth={1.3} />
          <h2 className="mt-4 text-xl font-bold text-heading">Your cart is empty</h2>
          <p className="mt-1 text-sm text-body">Add some products before checking out.</p>
          <Link
            href="/products"
            className="mt-6 rounded-full bg-brand px-7 py-3 text-sm font-bold text-white transition hover:bg-brand-dark"
          >
            Browse Products
          </Link>
        </div>
      </>
    );
  }

  const totals = computeTotals(subtotal, coupon, settings, form.delivery);
  const isMobilePay = form.payment === "bkash" || form.payment === "nagad";
  const selectedPayment = paymentMethods.find((p) => p.id === form.payment)!;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const found = validate(form);
    setErrors(found);
    const first = fieldOrder.find((k) => found[k]);
    if (first) {
      const el = document.getElementById(`field-${first}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.focus({ preventScroll: true });
      return;
    }

    setPlacing(true);
    try {
      const result = await placeOrder({
        lines: lines.map((l) => ({ key: l.key, slug: l.productId, variant: l.variant, qty: l.qty, price: l.price })),
        couponCode: coupon?.code ?? null,
        name: form.name,
        phone: form.phone,
        email: form.email.trim(),
        division: form.division,
        area: form.area,
        address: form.address,
        note: form.note,
        delivery: form.delivery,
        payment: form.payment,
        trxId: isMobilePay ? form.trxId : "",
      });

      if (result.ok) {
        clearCart();
        router.push("/checkout/success");
        return;
      }
      if (result.priceUpdates || result.removeKeys) syncLines(result.priceUpdates, result.removeKeys);
      if (result.couponInvalid) applyCoupon(null);
      setSubmitError(result.error);
    } catch {
      setSubmitError("Network error — please check your connection and try again.");
    }
    setPlacing(false);
  };

  const describedBy = (key: keyof Form) => (errors[key] ? `field-${key}-error` : undefined);

  return (
    <>
      <CheckoutHeading title="Checkout" step={1} subtitle="Fill in your details below to place your order." />

      <form
        noValidate
        onSubmit={handleSubmit}
        className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px] xl:grid-cols-[minmax(0,1fr)_440px] xl:gap-10"
      >
        <div className="min-w-0 space-y-6">
          <SectionCard step={1} title="Shipping Information">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field id="field-name" label="Full Name" required error={errors.name}>
                <input
                  id="field-name"
                  autoComplete="name"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="e.g. Rahim Uddin"
                  aria-invalid={!!errors.name}
                  aria-describedby={describedBy("name")}
                  className={`h-12 ${inputClass(errors.name)}`}
                />
              </Field>
              <Field id="field-phone" label="Mobile Number" required error={errors.phone} hint="We’ll call this number to confirm your order.">
                <input
                  id="field-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  placeholder="01XXXXXXXXX"
                  aria-invalid={!!errors.phone}
                  aria-describedby={describedBy("phone")}
                  className={`h-12 ${inputClass(errors.phone)}`}
                />
              </Field>
              <Field id="field-email" label="Email (optional)" error={errors.email} className="sm:col-span-2">
                <input
                  id="field-email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="you@example.com"
                  aria-invalid={!!errors.email}
                  aria-describedby={describedBy("email")}
                  className={`h-12 ${inputClass(errors.email)}`}
                />
              </Field>
              <Field id="field-division" label="Division" required error={errors.division}>
                <select
                  id="field-division"
                  value={form.division}
                  onChange={(e) => {
                    set("division", e.target.value);
                    set("delivery", e.target.value === "Dhaka" ? form.delivery : "outside");
                  }}
                  className={`h-12 cursor-pointer ${inputClass(errors.division)}`}
                >
                  {divisions.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </Field>
              <Field id="field-area" label="Area / Thana" required error={errors.area}>
                <input
                  id="field-area"
                  autoComplete="address-level2"
                  value={form.area}
                  onChange={(e) => set("area", e.target.value)}
                  placeholder="e.g. Dhanmondi"
                  aria-invalid={!!errors.area}
                  aria-describedby={describedBy("area")}
                  className={`h-12 ${inputClass(errors.area)}`}
                />
              </Field>
              <Field id="field-address" label="Full Address" required error={errors.address} className="sm:col-span-2">
                <textarea
                  id="field-address"
                  autoComplete="street-address"
                  rows={3}
                  value={form.address}
                  onChange={(e) => set("address", e.target.value)}
                  placeholder="House no, road no, block / sector, landmark"
                  aria-invalid={!!errors.address}
                  aria-describedby={describedBy("address")}
                  className={`resize-none py-3 ${inputClass(errors.address)}`}
                />
              </Field>
              <Field id="field-note" label="Order Note (optional)" className="sm:col-span-2">
                <textarea
                  id="field-note"
                  rows={2}
                  value={form.note}
                  onChange={(e) => set("note", e.target.value)}
                  placeholder="Any special instructions for delivery?"
                  className={`resize-none py-3 ${inputClass()}`}
                />
              </Field>
            </div>
          </SectionCard>

          <SectionCard step={2} title="Delivery Method">
            <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Delivery method">
              {deliveryOptions.map((d) => (
                <label
                  key={d.id}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-line p-4 transition hover:border-brand/50 has-checked:border-brand has-checked:bg-brand-light/40"
                >
                  <input
                    type="radio"
                    name="delivery"
                    value={d.id}
                    checked={form.delivery === d.id}
                    onChange={() => set("delivery", d.id)}
                    className="size-4 accent-brand"
                  />
                  <span className="flex-1">
                    <span className="block text-sm font-bold text-heading">{d.label}</span>
                    <span className="text-xs text-body">Delivery in {d.eta}</span>
                  </span>
                  <span className={`text-sm font-bold ${totals.freeShipping ? "text-leaf" : "text-brand"}`}>
                    {totals.freeShipping ? (
                      <>
                        <span className="mr-1 text-xs font-semibold text-body line-through">{formatPrice(deliveryFee(d.id, settings))}</span>
                        FREE
                      </>
                    ) : (
                      formatPrice(deliveryFee(d.id, settings))
                    )}
                  </span>
                </label>
              ))}
            </div>
          </SectionCard>

          <SectionCard step={3} title="Payment Method">
            <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Payment method">
              {paymentMethods.map((m) => {
                const Icon = paymentIcons[m.id];
                return (
                  <label
                    key={m.id}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-line p-4 transition hover:border-brand/50 has-checked:border-brand has-checked:bg-brand-light/40"
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={m.id}
                      checked={form.payment === m.id}
                      onChange={() => set("payment", m.id)}
                      className="size-4 accent-brand"
                    />
                    <span
                      className="grid size-10 shrink-0 place-items-center rounded-lg text-white"
                      style={{ background: m.color }}
                    >
                      <Icon className="size-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-heading">{m.label}</span>
                      <span className="block text-xs text-body">{m.description}</span>
                    </span>
                  </label>
                );
              })}
            </div>

            {isMobilePay && (
              <div className="mt-5 rounded-xl border p-5" style={{ borderColor: selectedPayment.color, background: `${selectedPayment.color}0d` }}>
                <p className="mb-3 text-sm font-bold" style={{ color: selectedPayment.color }}>
                  How to pay with {selectedPayment.label}
                </p>
                <ol className="list-decimal space-y-1.5 pl-5 text-sm text-heading">
                  <li>Open your {selectedPayment.label} app or dial {form.payment === "bkash" ? "*247#" : "*167#"}.</li>
                  <li>
                    Choose <b>Send Money</b> to <b className="font-bold">{settings.mobilePaymentNumber}</b>.
                  </li>
                  <li>
                    Amount: <b className="text-brand">{formatPrice(totals.total)}</b>
                  </li>
                  <li>Enter the Transaction ID (TrxID) from the confirmation SMS below.</li>
                </ol>
                <Field id="field-trxId" label="Transaction ID" required error={errors.trxId} className="mt-4">
                  <input
                    id="field-trxId"
                    value={form.trxId}
                    onChange={(e) => set("trxId", e.target.value)}
                    placeholder="e.g. 9BG7XK2LMQ"
                    aria-invalid={!!errors.trxId}
                    aria-describedby={describedBy("trxId")}
                    className={`h-12 uppercase placeholder:normal-case ${inputClass(errors.trxId)}`}
                  />
                </Field>
              </div>
            )}

            {form.payment === "card" && (
              <p className="mt-5 flex gap-2 rounded-xl bg-soft p-4 text-sm text-heading">
                <Info className="mt-0.5 size-4 shrink-0 text-brand" />
                After placing the order you’ll be redirected to our secure payment gateway to pay{" "}
                {formatPrice(totals.total)} by card or online banking.
              </p>
            )}
            {form.payment === "cod" && (
              <p className="mt-5 flex gap-2 rounded-xl bg-soft p-4 text-sm text-heading">
                <Info className="mt-0.5 size-4 shrink-0 text-brand" />
                Please keep {formatPrice(totals.total)} ready. You can check the products before paying the delivery
                person.
              </p>
            )}
          </SectionCard>

          <Link
            href="/cart"
            className="inline-flex items-center gap-2 text-sm font-bold text-heading transition hover:text-brand"
          >
            <ArrowLeft className="size-4" /> Back to Cart
          </Link>
        </div>

        {/* Order summary */}
        <aside>
          <div className="sticky top-6 space-y-5">
            <div className="rounded-2xl border border-line bg-white p-6 shadow-[0_8px_30px_-16px_rgba(0,0,0,0.15)]">
              <div className="flex items-center justify-between border-b border-line pb-4">
                <h2 className="text-lg font-bold text-heading">Your Order</h2>
                <Link href="/cart" className="text-xs font-bold text-brand hover:underline">
                  Edit cart ({cartCount})
                </Link>
              </div>

              <ul className="no-scrollbar mt-2 max-h-80 space-y-4 overflow-y-auto pt-3 pr-3">
                {lines.map((line) => {
                  const variant = variantLabel(line.variant);
                  return (
                    <li key={line.key} className="flex items-center gap-3">
                      <span className="relative">
                        <ProductThumb product={line} size="sm" />
                        <span className="absolute -top-2 -right-2 grid size-5 place-items-center rounded-full bg-heading text-[10px] font-bold text-white">
                          {line.qty}
                        </span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-1 text-sm font-bold text-heading">{line.name}</span>
                        <span className="text-xs text-body">
                          {variant ? `${variant} · ` : ""}
                          {formatPrice(line.price)} × {line.qty}
                        </span>
                      </span>
                      <span className="text-sm font-bold text-heading">{formatPrice(line.price * line.qty)}</span>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-5 border-t border-line pt-5">
                <CouponBox />
              </div>

              <dl className="mt-5 space-y-3">
                <SummaryRow label="Subtotal" value={formatPrice(totals.subtotal)} />
                {coupon && (
                  <SummaryRow
                    label={`Coupon (${coupon.code})`}
                    value={totals.couponActive ? `−${formatPrice(totals.discount)}` : "Not eligible"}
                    tone="discount"
                  />
                )}
                <SummaryRow
                  label={`Delivery (${deliveryOptions.find((d) => d.id === form.delivery)!.label})`}
                  value={totals.shipping === 0 ? "FREE" : formatPrice(totals.shipping ?? 0)}
                  tone={totals.shipping === 0 ? "free" : undefined}
                />
              </dl>

              <div className="mt-5 flex items-center justify-between border-t border-dashed border-line pt-5">
                <span className="font-bold text-heading">Total</span>
                <span className="text-right">
                  <span className="block text-2xl font-bold text-brand">{formatPrice(totals.total)}</span>
                  <span className="text-[11px] text-body">VAT included</span>
                </span>
              </div>

              <label
                htmlFor="field-agree"
                className={`mt-5 flex cursor-pointer gap-2.5 rounded-lg p-2 text-xs text-heading ${errors.agree ? "bg-red-50" : ""}`}
              >
                <input
                  id="field-agree"
                  type="checkbox"
                  checked={form.agree}
                  onChange={(e) => set("agree", e.target.checked)}
                  aria-invalid={!!errors.agree}
                  className="mt-0.5 size-4 shrink-0 cursor-pointer accent-brand"
                />
                <span>
                  I have read and agree to the{" "}
                  <Link href="#" className="font-bold text-brand hover:underline">Terms & Conditions</Link>,{" "}
                  <Link href="#" className="font-bold text-brand hover:underline">Privacy</Link> and{" "}
                  <Link href="#" className="font-bold text-brand hover:underline">Refund Policy</Link>.
                </span>
              </label>
              {errors.agree && <p className="mt-1 px-2 text-xs font-semibold text-red-500">{errors.agree}</p>}

              {submitError && (
                <p role="alert" className="mt-4 flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-600">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" /> {submitError}
                </p>
              )}

              <button
                type="submit"
                disabled={placing}
                className="mt-5 flex h-13 w-full items-center justify-center gap-2 rounded-full bg-brand-dark text-base font-bold text-white shadow-lg shadow-brand/25 transition hover:bg-brand disabled:cursor-wait disabled:opacity-80"
              >
                {placing ? (
                  <>
                    <Loader2 className="size-5 animate-spin" /> Placing your order…
                  </>
                ) : (
                  <>
                    <Lock className="size-4" /> Place Order · {formatPrice(totals.total)}
                  </>
                )}
              </button>
              <p className="mt-3 text-center text-[11px] text-body">
                Your personal data is used only to process and deliver your order.
              </p>
            </div>

            <div className="rounded-2xl bg-soft p-5">
              <TrustList />
            </div>
          </div>
        </aside>
      </form>
    </>
  );
}
