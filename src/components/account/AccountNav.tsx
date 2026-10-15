"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, LogOut, Package, UserCog } from "lucide-react";
import { customerLogout } from "@/server/account-actions";

const links = [
  { href: "/account", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/account/orders", label: "My orders", icon: Package },
  { href: "/account/profile", label: "Profile & password", icon: UserCog },
];

export function AccountNav() {
  const pathname = usePathname();
  const item = "flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition";
  return (
    <nav aria-label="Account" className="no-scrollbar flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
      {links.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`${item} ${active ? "bg-brand text-white shadow-md shadow-brand/25" : "bg-white text-heading hover:bg-brand-light hover:text-brand"}`}
          >
            <Icon className="size-4.5" /> {label}
          </Link>
        );
      })}
      <form action={customerLogout} className="lg:mt-2 lg:border-t lg:border-line lg:pt-2">
        <button type="submit" className={`${item} w-full bg-white text-red-500 hover:bg-red-50`}>
          <LogOut className="size-4.5" /> Log out
        </button>
      </form>
    </nav>
  );
}
