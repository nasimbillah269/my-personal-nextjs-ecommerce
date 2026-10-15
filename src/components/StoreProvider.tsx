"use client";

import { createContext, useContext } from "react";
import type { Category, StoreSettings } from "@/lib/types";
import type { StoreMenus } from "@/server/menus";

type StoreContextValue = {
  settings: StoreSettings;
  categories: Category[];
  /** Featured store pages (About, Privacy Policy, …) for the footer. */
  footerPages: { slug: string; title: string }[];
  /** Menus built in Admin → Menus, by location. A missing location falls back to the built-in links. */
  menus: StoreMenus;
  /** The signed-in shopper (just what the header and checkout need), or null for guests. */
  customer: { name: string; phone: string; email: string | null; division: string; area: string; address: string } | null;
};

const StoreContext = createContext<StoreContextValue | null>(null);

/** Store-wide data loaded once per request in the shop layout. */
export function StoreProvider({ value, children }: { value: StoreContextValue; children: React.ReactNode }) {
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}
