"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Lock, ShoppingBag, Trash2, X } from "lucide-react";
import { computeTotals, variantLabel } from "@/lib/checkout";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/ui";
import { useCart } from "./CartProvider";
import {
  CheckoutHeading,
  CouponBox,
  FreeShippingBar,
  PaymentBadges,
  ProductThumb,
  QtyStepper,
  SummaryRow,
  TrustList,
} from "./CheckoutUI";
import { ProductCard } from "./ProductCard";
import { CartSkeleton } from "./ShopSkeletons";
import { Reveal } from "./Reveal";
import { useStore } from "./StoreProvider";

function EmptyCart({ suggestions }: { suggestions: Product[] }) {
  return (
    <>
      <CheckoutHeading title="Shopping Cart" step={0} />
      <Reveal variant="zoom">
        <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed border-line px-6 py-16 text-center">
          <span className="grid size-28 place-items-center rounded-full bg-brand-light">
            <ShoppingBag className="size-14 text-brand" strokeWidth={1.3} />
          </span>
          <h2 className="mt-6 text-2xl font-bold text-heading">Your cart is empty</h2>
          <p className="mt-2 max-w-sm text-sm text-body">
            Looks like you haven’t added anything yet. Explore our organic products and fill it up!
          </p>
          <Link
            href="/products"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand px-7 py-3 text-sm font-bold text-white transition hover:bg-brand-dark"
          >
            Start Shopping <ArrowRight className="size-4" />
          </Link>
        </div>
      </Reveal>
      <section className="mt-12">
        <h2 className="mb-6 text-xl font-bold text-heading sm:text-2xl">Popular right now</h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
          {suggestions.slice(0, 4).map((p, i) => (
            <Reveal key={p.id} delay={i * 80} className="h-full">
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}

export function CartView({ suggestions }: { suggestions: Product[] }) {
  const { ready, lines, cartCount, subtotal, coupon, updateQty, removeLine, clearCart } = useCart();
  const { settings } = useStore();

  if (!ready) return <CartSkeleton standalone={false} />;

  if (lines.length === 0) return <EmptyCart suggestions={suggestions} />;

  const totals = computeTotals(subtotal, coupon, settings);

  return (
    <>
      <CheckoutHeading
        title="Shopping Cart"
        step={0}
        subtitle={
          <>
            There {cartCount === 1 ? "is" : "are"} <span className="font-bold text-brand">{cartCount}</span>{" "}
            {cartCount === 1 ? "product" : "products"} in your cart
          </>
        }
      />

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] xl:grid-cols-[minmax(0,1fr)_410px] xl:gap-10">
        <div className="min-w-0 space-y-5">
          <FreeShippingBar subtotal={subtotal} />

          <div className="overflow-hidden rounded-2xl border border-line bg-white">
            <div className="hidden grid-cols-[minmax(0,1fr)_110px_130px_110px_40px] gap-4 bg-soft px-6 py-3.5 text-xs font-bold tracking-wide text-heading uppercase md:grid">
              <span>Product</span>
              <span>Unit Price</span>
              <span>Quantity</span>
              <span>Subtotal</span>
              <span className="sr-only">Remove</span>
            </div>

            <ul>
              {lines.map((line) => {
                const variant = variantLabel(line.variant);
                return (
                  <li
                    key={line.key}
                    className="relative flex gap-4 border-t border-line p-4 first:border-t-0 md:grid md:grid-cols-[minmax(0,1fr)_110px_130px_110px_40px] md:items-center md:px-6 md:first:border-t"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-4">
                      <Link href={`/products/${line.productId}`}>
                        <ProductThumb product={line} />
                      </Link>
                      <div className="min-w-0 flex-1 pr-8 md:pr-0">
                        <Link
                          href={`/products/${line.productId}`}
                          className="line-clamp-2 text-sm font-bold text-heading transition hover:text-brand"
                        >
                          {line.name}
                        </Link>
                        {variant && (
                          <span className="mt-1 inline-block rounded bg-soft px-2 py-0.5 text-[11px] font-semibold text-body">
                            {variant}
                          </span>
                        )}
                        {/* Mobile: price, qty and subtotal under the name */}
                        <p className="mt-1 text-xs text-body md:hidden">{formatPrice(line.price)} each</p>
                        <div className="mt-3 flex items-center justify-between gap-2 md:hidden">
                          <QtyStepper value={line.qty} onChange={(n) => updateQty(line.key, n)} label={line.name} />
                          <span className="text-base font-bold text-brand">{formatPrice(line.price * line.qty)}</span>
                        </div>
                      </div>
                    </div>

                    <span className="hidden text-sm font-bold text-heading md:block">{formatPrice(line.price)}</span>
                    <div className="hidden md:block">
                      <QtyStepper value={line.qty} onChange={(n) => updateQty(line.key, n)} label={line.name} />
                    </div>
                    <span className="hidden text-base font-bold text-brand md:block">
                      {formatPrice(line.price * line.qty)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeLine(line.key)}
                      aria-label={`Remove ${line.name}`}
                      className="absolute top-3 right-3 grid size-8 place-items-center rounded-full text-body transition hover:bg-red-50 hover:text-red-500 md:static"
                    >
                      <X className="size-4 md:hidden" />
                      <Trash2 className="hidden size-4 md:block" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm font-bold text-heading transition hover:border-brand hover:text-brand"
            >
              <ArrowLeft className="size-4" /> Continue Shopping
            </Link>
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Remove all items from your cart?")) clearCart();
              }}
              className="inline-flex items-center gap-2 px-2 text-sm font-bold text-body transition hover:text-red-500"
            >
              <Trash2 className="size-4" /> Clear Cart
            </button>
          </div>
        </div>

        <aside>
          <div className="sticky top-6 space-y-5">
            <div className="rounded-2xl border border-line bg-white p-6 shadow-[0_8px_30px_-16px_rgba(0,0,0,0.15)]">
              <h2 className="border-b border-line pb-4 text-lg font-bold text-heading">Order Summary</h2>
              <dl className="mt-5 space-y-3">
                <SummaryRow label={`Subtotal (${cartCount} items)`} value={formatPrice(subtotal)} />
                {coupon && (
                  <SummaryRow
                    label={`Coupon (${coupon.code})`}
                    value={totals.couponActive ? `−${formatPrice(totals.discount)}` : "Not eligible"}
                    tone="discount"
                  />
                )}
                <SummaryRow
                  label="Delivery"
                  value={totals.freeShipping ? "FREE" : "Calculated at checkout"}
                  tone={totals.freeShipping ? "free" : undefined}
                />
              </dl>

              <div className="mt-5">
                <CouponBox />
              </div>

              <div className="mt-5 flex items-end justify-between border-t border-dashed border-line pt-5">
                <span className="font-bold text-heading">Estimated Total</span>
                <span className="text-2xl font-bold text-brand">{formatPrice(totals.total)}</span>
              </div>

              <Link
                href="/checkout"
                className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-dark text-sm font-bold text-white shadow-lg shadow-brand/25 transition hover:bg-brand"
              >
                <Lock className="size-4" /> Proceed to Checkout
              </Link>

              <div className="mt-6 border-t border-line pt-5">
                <PaymentBadges />
              </div>
            </div>

            <div className="rounded-2xl bg-soft p-5">
              <TrustList />
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
