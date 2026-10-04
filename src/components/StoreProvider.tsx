"use client";

import { createContext, useContext } from "react";
import type { Category, StoreSettings } from "@/lib/types";

type StoreContextValue = { settings: StoreSettings; categories: Category[] };

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
