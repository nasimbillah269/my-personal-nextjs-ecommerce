"use client";

import Image from "next/image";
import Link from "next/link";
import { createContext, useCallback, useContext, useState } from "react";
import { ArrowRight, CheckCircle2, ShoppingBag, X } from "lucide-react";
import type { CartLine } from "@/lib/cart-store";
import { formatPrice } from "@/lib/ui";
import { useCart } from "./CartProvider";

type AddedItem = Omit<CartLine, "key" | "qty">;
type Notice = { id: number; item: AddedItem; qty: number };

const CartToastContext = createContext<(item: AddedItem, qty?: number) => void>(() => {});

/** Shows a "added to cart" card. Call the returned function right after addToCart(). */
export const useCartToast = () => useContext(CartToastContext);

const VISIBLE_MS = 4500;

export function CartToastProvider({ children }: { children: React.ReactNode }) {
  const [notice, setNotice] = useState<Notice | null>(null);

  const show = useCallback((item: AddedItem, qty = 1) => {
    setNotice((prev) =>
      // Adding the same item again while the card is open bumps its count and restarts the timer.
      prev && prev.item.productId === item.productId && prev.item.variant === item.variant
        ? { id: Date.now(), item, qty: prev.qty + qty }
        : { id: Date.now(), item, qty },
    );
  }, []);

  return (
    <CartToastContext.Provider value={show}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-3 top-3 z-[70] flex justify-center sm:inset-x-auto sm:top-5 sm:right-5 sm:justify-end"
      >
        {notice && <CartToastCard key={notice.id} notice={notice} onClose={() => setNotice(null)} />}
      </div>
    </CartToastContext.Provider>
  );
}

function CartToastCard({ notice, onClose }: { notice: Notice; onClose: () => void }) {
  const { cartCount, subtotal } = useCart();
  const { item, qty } = notice;

  return (
    <div
      role="status"
      className="group pointer-events-auto w-full max-w-sm animate-toast-in overflow-hidden rounded-2xl border border-line bg-white shadow-[0_20px_50px_-12px_rgba(37,61,78,0.35)]"
    >
      <div className="flex items-center gap-2 bg-brand-light/70 px-4 py-2.5">
        <CheckCircle2 className="size-5 shrink-0 text-leaf" />
        <p className="flex-1 text-sm font-bold text-heading">Added to your cart</p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close notification"
          className="grid size-7 place-items-center rounded-full text-body transition hover:bg-white hover:text-heading"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="flex items-center gap-3 px-4 pt-3.5 pb-4">
        <span className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl border border-line" style={{ background: item.tint }}>
          {item.image ? (
            <Image src={item.image} alt="" fill sizes="64px" className="object-cover" />
          ) : (
            <span className="text-3xl" aria-hidden="true">
              {item.emoji}
            </span>
          )}
          {qty > 1 && (
            <span className="absolute top-1 right-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-[11px] font-bold text-white">
              ×{qty}
            </span>
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm leading-5 font-bold text-heading">{item.name}</p>
          <p className="mt-0.5 text-xs text-body">
            {item.variant} · <span className="font-bold text-brand">{formatPrice(item.price)}</span>
          </p>
          <p className="mt-1 text-xs text-body">
            Cart: <b className="text-heading">{cartCount} item{cartCount === 1 ? "" : "s"}</b> · Subtotal{" "}
            <b className="text-heading">{formatPrice(subtotal)}</b>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 px-4 pb-4">
        <Link
          href="/cart"
          onClick={onClose}
          className="flex h-10 items-center justify-center gap-1.5 rounded-full border border-brand text-sm font-bold text-brand transition hover:bg-brand-light"
        >
          <ShoppingBag className="size-4" /> View cart
        </Link>
        <Link
          href="/checkout"
          onClick={onClose}
          className="flex h-10 items-center justify-center gap-1.5 rounded-full bg-brand text-sm font-bold text-white transition hover:bg-brand-dark"
        >
          Checkout <ArrowRight className="size-4" />
        </Link>
      </div>

      {/* Countdown bar: the card closes when it finishes, and hovering pauses it. */}
      <div className="h-1 bg-brand-light">
        <div
          onAnimationEnd={onClose}
          style={{ animationDuration: `${VISIBLE_MS}ms` }}
          className="h-full origin-left animate-toast-timer bg-linear-to-r from-brand to-leaf group-hover:[animation-play-state:paused]"
        />
      </div>
    </div>
  );
}
