"use client";

import { createContext, useContext, useMemo, useSyncExternalStore } from "react";
import {
  getCartSnapshot,
  getServerCartSnapshot,
  setCartState,
  subscribeCart,
  type CartLine,
} from "@/lib/cart-store";
import type { AppliedCoupon } from "@/lib/types";

type AddItem = Omit<CartLine, "key" | "qty">;

const MAX_QTY = 99;

const actions = {
  addToCart(item: AddItem, qty = 1) {
    const key = `${item.productId}::${item.variant}`;
    setCartState((prev) => {
      const existing = prev.lines.find((l) => l.key === key);
      const lines = existing
        ? prev.lines.map((l) => (l.key === key ? { ...l, price: item.price, qty: Math.min(MAX_QTY, l.qty + qty) } : l))
        : [...prev.lines, { key, ...item, qty: Math.min(MAX_QTY, qty) }];
      return { ...prev, lines };
    });
  },
  updateQty(key: string, qty: number) {
    setCartState((prev) => ({
      ...prev,
      lines: prev.lines.map((l) => (l.key === key ? { ...l, qty: Math.max(1, Math.min(MAX_QTY, qty)) } : l)),
    }));
  },
  removeLine(key: string) {
    setCartState((prev) => ({ ...prev, lines: prev.lines.filter((l) => l.key !== key) }));
  },
  clearCart() {
    setCartState((prev) => ({ ...prev, lines: [], coupon: null }));
  },
  applyCoupon(coupon: AppliedCoupon | null) {
    setCartState((prev) => ({ ...prev, coupon }));
  },
  /** Apply server-side corrections after a failed checkout. */
  syncLines(priceUpdates: { key: string; price: number }[] = [], removeKeys: string[] = []) {
    setCartState((prev) => ({
      ...prev,
      lines: prev.lines
        .filter((l) => !removeKeys.includes(l.key))
        .map((l) => {
          const update = priceUpdates.find((u) => u.key === l.key);
          return update ? { ...l, price: update.price } : l;
        }),
    }));
  },
  toggleWishlist(id: string) {
    setCartState((prev) => ({
      ...prev,
      wishlist: prev.wishlist.includes(id) ? prev.wishlist.filter((x) => x !== id) : [...prev.wishlist, id],
    }));
  },
};

type CartContextValue = typeof actions & {
  /** False during SSR / first hydration pass, when the saved cart hasn't been read yet. */
  ready: boolean;
  lines: CartLine[];
  wishlist: string[];
  coupon: AppliedCoupon | null;
  cartCount: number;
  subtotal: number;
};

const CartContext = createContext<CartContextValue | null>(null);

const noopSubscribe = () => () => {};

export function CartProvider({ children }: { children: React.ReactNode }) {
  const state = useSyncExternalStore(subscribeCart, getCartSnapshot, getServerCartSnapshot);
  const ready = useSyncExternalStore(noopSubscribe, () => true, () => false);

  const value = useMemo<CartContextValue>(
    () => ({
      ...actions,
      ready,
      lines: state.lines,
      wishlist: state.wishlist,
      coupon: state.coupon,
      cartCount: state.lines.reduce((sum, l) => sum + l.qty, 0),
      subtotal: state.lines.reduce((sum, l) => sum + l.qty * l.price, 0),
    }),
    [state, ready],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
