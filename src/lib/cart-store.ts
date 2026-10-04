/**
 * Tiny external store for the cart, persisted to localStorage and synced across tabs.
 * Read it through useCart() (CartProvider) — never import this from server code.
 */

import type { AppliedCoupon } from "./types";

export type CartLine = {
  key: string;
  /** Product slug */
  productId: string;
  variant: string;
  price: number;
  qty: number;
  // Display snapshot so the cart renders without a catalog lookup.
  name: string;
  emoji: string;
  tint: string;
  image: string | null;
};

export type CartState = {
  lines: CartLine[];
  wishlist: string[];
  coupon: AppliedCoupon | null;
};

const STORAGE_KEY = "uol-cart-v2";
const EMPTY: CartState = { lines: [], wishlist: [], coupon: null };

let state: CartState = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<CartState>) : null;
    state = {
      lines: Array.isArray(parsed?.lines)
        ? parsed.lines.filter((l) => l && typeof l.productId === "string" && typeof l.name === "string" && l.qty > 0)
        : [],
      wishlist: Array.isArray(parsed?.wishlist) ? parsed.wishlist : [],
      coupon: parsed?.coupon && typeof parsed.coupon === "object" && "code" in parsed.coupon ? parsed.coupon : null,
    };
  } catch {
    state = EMPTY;
  }
}

export function setCartState(update: (prev: CartState) => CartState) {
  load();
  state = update(state);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or blocked — keep the in-memory cart working.
  }
  listeners.forEach((l) => l());
}

export function subscribeCart(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY) return;
    loaded = false;
    load();
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export const getCartSnapshot = () => {
  load();
  return state;
};

export const getServerCartSnapshot = () => EMPTY;
