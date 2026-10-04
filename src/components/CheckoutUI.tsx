"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import {
  Check,
  ChevronRight,
  ClipboardList,
  Minus,
  PackageCheck,
  Plus,
  RotateCcw,
  ShieldCheck,
  ShoppingCart,
  TicketPercent,
  Truck,
  X,
} from "lucide-react";
import { describeCoupon, paymentMethods } from "@/lib/checkout";
import { formatPrice } from "@/lib/ui";
import { checkCoupon } from "@/server/shop-actions";
import { useCart } from "./CartProvider";
import { useStore } from "./StoreProvider";

/* ---------- Page heading + progress steps ---------- */

const steps = [
  { label: "Shopping Cart", icon: ShoppingCart, href: "/cart" },
  { label: "Checkout", icon: ClipboardList, href: "/checkout" },
  { label: "Order Complete", icon: PackageCheck, href: null },
];

export function CheckoutSteps({ current }: { current: 0 | 1 | 2 }) {
  return (
    <ol className="flex w-full max-w-xl items-center">
      {steps.map(({ label, icon: Icon, href }, i) => {
        const done = i < current || current === 2;
        const active = i === current;
        const circle = (
          <span
            className={`grid size-10 place-items-center rounded-full transition sm:size-12 ${
              done
                ? "bg-brand text-white"
                : active
                  ? "bg-brand text-white ring-4 ring-brand-light"
                  : "border-2 border-line bg-white text-body"
            }`}
          >
            {done && !active ? <Check className="size-5" strokeWidth={3} /> : <Icon className="size-5" />}
          </span>
        );
        return (
          <li key={label} className={`flex items-center ${i < steps.length - 1 ? "flex-1" : ""}`}>
            <div className="flex flex-col items-center gap-1.5 text-center">
              {href && done && !active ? (
                <Link href={href} aria-label={label}>
                  {circle}
                </Link>
              ) : (
                circle
              )}
              <span
                className={`text-[11px] font-bold whitespace-nowrap sm:text-xs ${active || done ? "text-heading" : "text-body"}`}
                aria-current={active ? "step" : undefined}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <span className="mx-2 mb-6 h-1 flex-1 overflow-hidden rounded-full bg-line sm:mx-3">
                <span
                  className="block h-full rounded-full bg-brand transition-all duration-500"
                  style={{ width: i < current ? "100%" : "0%" }}
                />
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

export function CheckoutHeading({
  title,
  subtitle,
  step,
}: {
  title: string;
  subtitle?: React.ReactNode;
  step: 0 | 1 | 2;
}) {
  return (
    <section
      className="flex flex-col gap-6 rounded-2xl px-6 py-7 sm:px-10 lg:flex-row lg:items-center lg:justify-between lg:px-12 lg:py-10"
      style={{ background: "linear-gradient(110deg,#e2f4f3 0%,#f6fbf0 55%,#e6f3d3 100%)" }}
    >
      <div>
        <h1 className="text-2xl font-bold text-heading sm:text-4xl">{title}</h1>
        <nav aria-label="Breadcrumb" className="mt-2 flex items-center gap-1.5 text-xs">
          <Link href="/" className="font-semibold text-brand hover:underline">Home</Link>
          <ChevronRight className="size-3 text-body" />
          <span className="text-body">{title}</span>
        </nav>
        {subtitle && <p className="mt-3 text-sm text-body">{subtitle}</p>}
      </div>
      <CheckoutSteps current={step} />
    </section>
  );
}

/* ---------- Small building blocks ---------- */

type ThumbSource = { name: string; emoji: string; tint: string; image?: string | null };

export function ProductThumb({ product, size = "md" }: { product: ThumbSource; size?: "sm" | "md" }) {
  const box = size === "sm" ? "size-14 rounded-lg" : "size-20 rounded-xl sm:size-24";
  return (
    <span className={`relative grid shrink-0 place-items-center overflow-hidden border border-line bg-white ${box}`}>
      {product.image ? (
        <Image src={product.image} alt={product.name} fill sizes="96px" className="object-cover" />
      ) : (
        <span
          className="grid size-[78%] place-items-center rounded-full"
          style={{ background: product.tint }}
          role="img"
          aria-label={product.name}
        >
          <span className={size === "sm" ? "text-2xl" : "text-3xl sm:text-4xl"}>{product.emoji}</span>
        </span>
      )}
    </span>
  );
}

export function QtyStepper({ value, onChange, label }: { value: number; onChange: (n: number) => void; label: string }) {
  return (
    <div className="flex w-fit items-center rounded-lg border border-line bg-white">
      <button
        type="button"
        aria-label={`Decrease quantity of ${label}`}
        onClick={() => onChange(value - 1)}
        disabled={value <= 1}
        className="grid size-9 place-items-center text-heading transition hover:text-brand disabled:opacity-30"
      >
        <Minus className="size-3.5" />
      </button>
      <input
        type="number"
        aria-label={`Quantity of ${label}`}
        value={value}
        min={1}
        max={99}
        onChange={(e) => onChange(Number(e.target.value) || 1)}
        className="h-9 w-10 [appearance:textfield] text-center text-sm font-bold text-heading outline-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button
        type="button"
        aria-label={`Increase quantity of ${label}`}
        onClick={() => onChange(value + 1)}
        disabled={value >= 99}
        className="grid size-9 place-items-center text-heading transition hover:text-brand disabled:opacity-30"
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}

export function CouponBox() {
  const { coupon, applyCoupon, subtotal } = useCart();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checking, startCheck] = useTransition();

  if (coupon) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-brand bg-brand-light/50 px-4 py-3">
        <p className="flex items-center gap-2 text-sm">
          <TicketPercent className="size-5 shrink-0 text-brand" />
          <span>
            <span className="font-bold text-brand-dark">{coupon.code}</span>
            <span className="block text-xs text-body">{describeCoupon(coupon)}</span>
          </span>
        </p>
        <button
          type="button"
          onClick={() => applyCoupon(null)}
          aria-label="Remove coupon"
          className="grid size-8 place-items-center rounded-full text-body transition hover:bg-white hover:text-red-500"
        >
          <X className="size-4" />
        </button>
      </div>
    );
  }

  const submit = () => {
    if (!code.trim()) return setError("Enter a coupon code.");
    startCheck(async () => {
      const result = await checkCoupon(code, subtotal);
      if (result.ok) {
        applyCoupon(result.coupon);
        setCode("");
        setError(null);
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <div>
      <div className="flex gap-2">
        <label className="relative flex-1">
          <span className="sr-only">Coupon code</span>
          <TicketPercent className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-body" />
          <input
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Coupon code"
            className={`h-11 w-full rounded-lg border bg-white pr-3 pl-9 text-sm uppercase outline-none placeholder:normal-case focus:border-brand ${
              error ? "border-red-400" : "border-line"
            }`}
          />
        </label>
        <button
          type="button"
          onClick={submit}
          disabled={checking}
          className="h-11 rounded-lg bg-heading px-5 text-sm font-bold text-white transition hover:bg-brand disabled:opacity-60"
        >
          {checking ? "Checking…" : "Apply"}
        </button>
      </div>
      {error ? (
        <p className="mt-1.5 text-xs font-semibold text-red-500">{error}</p>
      ) : (
        <p className="mt-1.5 text-xs text-body">
          Have a coupon code? Enter it above to get your discount.
        </p>
      )}
    </div>
  );
}

export function FreeShippingBar({ subtotal }: { subtotal: number }) {
  const { freeShippingMin } = useStore().settings;
  if (freeShippingMin <= 0) return null;
  const remaining = freeShippingMin - subtotal;
  const pct = Math.min(100, (subtotal / freeShippingMin) * 100);
  return (
    <div className="rounded-xl border border-line bg-white p-4">
      <p className="flex items-center gap-2 text-sm text-heading">
        <Truck className="size-5 shrink-0 text-brand" />
        {remaining > 0 ? (
          <span>
            Add <span className="font-bold text-brand">{formatPrice(remaining)}</span> more to get{" "}
            <span className="font-bold">FREE delivery</span>
          </span>
        ) : (
          <span className="font-bold text-leaf">Congratulations! You’ve unlocked FREE delivery 🎉</span>
        )}
      </p>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-soft">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand to-leaf transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function PaymentBadges() {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold text-body">We accept</p>
      <div className="flex flex-wrap gap-2">
        {paymentMethods.map((m) => (
          <span
            key={m.id}
            className="rounded-md border border-line bg-white px-2.5 py-1 text-[11px] font-black tracking-wide"
            style={{ color: m.color }}
          >
            {m.short}
          </span>
        ))}
      </div>
    </div>
  );
}

export function TrustList() {
  const items = [
    { icon: ShieldCheck, text: "Secure & encrypted checkout" },
    { icon: Truck, text: "Fast delivery all over Bangladesh" },
    { icon: RotateCcw, text: "Easy 7-day returns" },
  ];
  return (
    <ul className="space-y-2.5">
      {items.map(({ icon: Icon, text }) => (
        <li key={text} className="flex items-center gap-2.5 text-xs font-semibold text-heading">
          <span className="grid size-7 place-items-center rounded-full bg-brand-light">
            <Icon className="size-3.5 text-brand-dark" />
          </span>
          {text}
        </li>
      ))}
    </ul>
  );
}

export function SummaryRow({
  label,
  value,
  tone,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  tone?: "discount" | "free";
}) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <dt className="text-body">{label}</dt>
      <dd className={`text-right font-bold ${tone === "discount" ? "text-red-500" : tone === "free" ? "text-leaf" : "text-heading"}`}>
        {value}
      </dd>
    </div>
  );
}
