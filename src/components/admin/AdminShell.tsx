"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ExternalLink,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Settings,
  ShoppingBag,
  TicketPercent,
  Users,
  X,
} from "lucide-react";
import { logout } from "@/server/admin/auth-actions";
import { LogoMark } from "../Logo";
import { ToastProvider } from "./Toast";

const nav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag, badge: "pending" as const },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/coupons", label: "Coupons", icon: TicketPercent },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminShell({
  admin,
  pendingCount,
  storeName,
  logoUrl,
  children,
}: {
  admin: { name: string; email: string };
  pendingCount: number;
  storeName: string;
  logoUrl: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const initials = admin.name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const isActive = (href: string, exact?: boolean) => (exact ? pathname === href : pathname.startsWith(href));
  const current = nav.find((n) => isActive(n.href, n.exact));

  const sidebar = (
    <div className="flex h-full flex-col">
      <Link href="/admin" className="block px-6 py-6" onClick={() => setOpen(false)}>
        {logoUrl ? (
          <span className="block">
            <span className="flex h-14 items-center justify-center rounded-xl bg-white px-3">
              <Image src={logoUrl} alt={storeName} width={200} height={56} className="h-10 w-auto max-w-full object-contain" />
            </span>
            <span className="mt-2 block text-center text-[11px] font-semibold tracking-wider text-white/50 uppercase">Admin panel</span>
          </span>
        ) : (
          <span className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-white">
              <LogoMark className="h-7 w-9" />
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-bold text-white">{storeName}</span>
              <span className="text-[11px] font-semibold tracking-wider text-white/50 uppercase">Admin panel</span>
            </span>
          </span>
        )}
      </Link>

      <nav className="flex-1 space-y-1 px-3" aria-label="Admin">
        {nav.map(({ href, label, icon: Icon, exact, badge }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                active ? "bg-brand text-white shadow-lg shadow-black/20" : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon className="size-5 shrink-0" />
              <span className="flex-1">{label}</span>
              {badge === "pending" && pendingCount > 0 && (
                <span
                  className={`grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11px] font-bold ${
                    active ? "bg-white text-brand-dark" : "bg-amber-400 text-heading"
                  }`}
                >
                  {pendingCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-white/10 p-3">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          <ExternalLink className="size-5" /> View store
        </Link>
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <LogOut className="size-5" /> Log out
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <ToastProvider>
      <div className="min-h-screen bg-soft">
        {/* Desktop sidebar */}
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 bg-heading lg:block print:hidden">{sidebar}</aside>

        {/* Mobile drawer */}
        <div className={`fixed inset-0 z-50 lg:hidden ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
          <div
            onClick={() => setOpen(false)}
            className={`absolute inset-0 bg-black/50 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
          />
          <aside
            className={`absolute inset-y-0 left-0 w-72 bg-heading transition-transform duration-300 ${
              open ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="absolute top-6 right-4 p-1 text-white/70"
            >
              <X className="size-5" />
            </button>
            {sidebar}
          </aside>
        </div>

        <div className="lg:pl-64">
          <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-white/90 px-4 backdrop-blur sm:px-6 lg:px-8 print:hidden">
            <button type="button" onClick={() => setOpen(true)} aria-label="Open menu" className="-ml-1 p-1 text-heading lg:hidden">
              <Menu className="size-6" />
            </button>
            <p className="text-sm font-semibold text-body">
              Admin <span className="mx-1">/</span>
              <span className="text-heading">{current?.label ?? "Dashboard"}</span>
            </p>
            <div className="ml-auto flex items-center gap-3">
              <span className="hidden text-right leading-tight sm:block">
                <span className="block text-sm font-bold text-heading">{admin.name}</span>
                <span className="text-xs text-body">{admin.email}</span>
              </span>
              <Link
                href="/admin/settings"
                aria-label="Account settings"
                className="grid size-10 place-items-center rounded-full bg-brand text-sm font-bold text-white"
              >
                {initials || "A"}
              </Link>
            </div>
          </header>
          <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
