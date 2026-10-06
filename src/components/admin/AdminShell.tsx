"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, type ComponentType } from "react";
import {
  AlignLeft,
  Castle,
  ChartLine,
  ChevronRight,
  Contact,
  ExternalLink,
  FileText,
  Files,
  Images,
  LayoutDashboard,
  Laptop,
  LogOut,
  Mail,
  Menu,
  MessagesSquare,
  Network,
  Palette,
  Settings,
  Share2,
  ShieldCheck,
  SlidersHorizontal,
  UserCheck,
  UserCog,
  Users,
  X,
} from "lucide-react";
import { logout } from "@/server/admin/auth-actions";
import { LogoMark } from "../Logo";
import { ToastProvider } from "./Toast";

type Icon = ComponentType<{ className?: string }>;
type NavLink = { href: string; label: string; icon: Icon; exact?: boolean };
type NavGroup = {
  label: string;
  icon: Icon;
  badge?: "pending";
  children: { href: string; label: string; badge?: "pending" }[];
};
type NavSection = { title?: string; items: (NavLink | NavGroup)[] };

const sections: NavSection[] = [
  {
    items: [
      {
        label: "Posts",
        icon: FileText,
        children: [
          { href: "/admin/posts", label: "All Posts" },
          { href: "/admin/posts/new", label: "New Post" },
          { href: "/admin/posts/categories", label: "Categories" },
          { href: "/admin/posts/tags", label: "Tags" },
          { href: "/admin/posts/comments", label: "Comments" },
        ],
      },
      {
        label: "Pages",
        icon: Files,
        children: [
          { href: "/admin/pages", label: "All Pages" },
          { href: "/admin/pages/new", label: "New Page" },
        ],
      },
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
    ],
  },
  {
    title: "Products Unit",
    items: [
      {
        label: "Ecommerce Setting",
        icon: SlidersHorizontal,
        children: [
          { href: "/admin/categories", label: "Categories" },
          { href: "/admin/coupons", label: "Coupons" },
        ],
      },
      {
        label: "Products",
        icon: AlignLeft,
        children: [
          { href: "/admin/products", label: "All Products" },
          { href: "/admin/products/new", label: "Add Product" },
        ],
      },
      {
        label: "Order Management",
        icon: Network,
        badge: "pending",
        children: [
          { href: "/admin/orders", label: "All Orders", badge: "pending" },
        ],
      },
    ],
  },
  {
    title: "Report Unit",
    items: [
      {
        label: "Reports Management",
        icon: ChartLine,
        children: [
          { href: "/admin/reports/sales", label: "Sales Report" },
          { href: "/admin/reports/products", label: "Product Report" },
          { href: "/admin/reports/customers", label: "Customer Report" },
        ],
      },
    ],
  },
  {
    title: "General Unit",
    items: [
      { href: "/admin/clients", label: "Clients", icon: Contact },
      { href: "/admin/brands", label: "Brands", icon: Castle },
      { href: "/admin/sliders", label: "Sliders", icon: Laptop },
      { href: "/admin/galleries", label: "Galleries", icon: Images },
      { href: "/admin/menus", label: "Menus Setting", icon: Menu },
      { href: "/admin/theme", label: "Theme Setting", icon: Palette },
    ],
  },
  {
    title: "Users Management",
    items: [
      { href: "/admin/users/admins", label: "Administrator Users", icon: UserCog },
      { href: "/admin/users/roles", label: "Roles Users", icon: ShieldCheck },
      { href: "/admin/customers", label: "Customer Users", icon: Users },
      { href: "/admin/users/subscribers", label: "Subscribe Users", icon: UserCheck },
    ],
  },
  {
    title: "Apps Setting",
    items: [
      // exact: the mail/sms/social pages live under /admin/settings too.
      { href: "/admin/settings", label: "General Setting", icon: Settings, exact: true },
      { href: "/admin/settings/mail", label: "Mail Setting", icon: Mail },
      { href: "/admin/settings/sms", label: "SMS Setting", icon: MessagesSquare },
      { href: "/admin/settings/social", label: "Social Setting", icon: Share2 },
    ],
  },
];

const nav = sections.flatMap((s) => s.items);

const isGroup = (item: NavLink | NavGroup): item is NavGroup => "children" in item;

export function AdminShell({
  admin,
  pendingCount,
  storeName,
  faviconUrl,
  children,
}: {
  admin: { name: string; email: string };
  pendingCount: number;
  storeName: string;
  faviconUrl: string | null;
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

  const matches = (href: string) => pathname === href || pathname.startsWith(href + "/");
  // Longest matching child wins, so /admin/products/new highlights "Add Product" rather than "All Products".
  const activeChild = nav
    .flatMap((n) => (isGroup(n) ? n.children : []))
    .filter((c) => matches(c.href))
    .sort((a, b) => b.href.length - a.href.length)[0];
  const isLinkActive = (l: NavLink) => (l.exact ? pathname === l.href : matches(l.href));
  const isGroupActive = (g: NavGroup) => !!activeChild && g.children.includes(activeChild);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(nav.filter(isGroup).map((g) => [g.label, isGroupActive(g)])),
  );
  const toggleGroup = (label: string) => setOpenGroups((s) => ({ ...s, [label]: !s[label] }));
  const current = activeChild ?? nav.filter((n): n is NavLink => !isGroup(n)).find(isLinkActive);

  const pendingBadge = (active: boolean) =>
    pendingCount > 0 && (
      <span
        className={`grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11px] font-bold ${
          active ? "bg-white text-brand-dark" : "bg-amber-400 text-heading"
        }`}
      >
        {pendingCount}
      </span>
    );

  const sidebar = (
    <div className="flex h-full flex-col">
      <Link
        href="/admin"
        onClick={() => setOpen(false)}
        className="mx-3 mt-4 mb-3 flex items-center gap-3 rounded-xl py-3 pr-10 pl-3 transition hover:bg-white/5 lg:pr-3"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-white shadow-sm ring-1 ring-white/10">
          {faviconUrl ? (
            // .ico files can't go through the image optimizer.
            <Image src={faviconUrl} alt="" width={24} height={24} unoptimized className="size-6 object-contain" />
          ) : (
            <LogoMark className="h-5 w-7" />
          )}
        </span>
        <span className="min-w-0 leading-tight">
          <span className="block truncate text-[15px] font-bold text-white" title={storeName}>
            {storeName}
          </span>
          <span className="mt-0.5 block text-[11px] font-medium tracking-wider text-white/45 uppercase">Admin panel</span>
        </span>
      </Link>
      <div className="mx-6 mb-3 h-px bg-white/10" />

      <nav className="sidebar-scroll flex-1 overflow-y-auto pr-1 pb-4 pl-3" aria-label="Admin">
        {sections.map((section, i) => (
          <div key={section.title ?? i} className={i > 0 ? "mt-5" : ""}>
            {section.title && (
              <p className="mb-2 px-3 text-xs font-bold tracking-wider text-brand uppercase">{section.title}</p>
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
                if (isGroup(item)) {
                  const { label, icon: Icon, children, badge } = item;
                  const expanded = openGroups[label] ?? false;
                  return (
                    <div key={label}>
                      <button
                        type="button"
                        onClick={() => toggleGroup(label)}
                        aria-expanded={expanded}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold whitespace-nowrap transition ${
                          isGroupActive(item) ? "bg-white/10 text-white ring-1 ring-white/10" : "text-white/70 hover:bg-white/[0.07] hover:text-white"
                        }`}
                      >
                        <Icon className="size-5 shrink-0" />
                        <span className="min-w-0 flex-1 truncate text-left">{label}</span>
                        {badge === "pending" && !expanded && pendingBadge(false)}
                        <ChevronRight className={`size-4 shrink-0 transition-transform ${expanded ? "rotate-90" : ""}`} />
                      </button>
                      {expanded && (
                        <div className="mt-1 ml-6 space-y-0.5 border-l-2 border-brand/60 pl-3">
                          {children.map((c) => {
                            const active = c === activeChild;
                            return (
                              <Link
                                key={c.href}
                                href={c.href}
                                onClick={() => setOpen(false)}
                                aria-current={active ? "page" : undefined}
                                className={`flex items-center rounded-lg px-3 py-2 text-sm font-medium transition ${
                                  active ? "bg-linear-to-r from-brand to-emerald-500 text-white shadow-md shadow-brand/30" : "text-white/60 hover:bg-white/[0.07] hover:text-white"
                                }`}
                              >
                                <span className="min-w-0 flex-1 truncate">{c.label}</span>
                                {c.badge === "pending" && pendingBadge(active)}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }
                const { href, label, icon: Icon } = item;
                const active = isLinkActive(item);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold whitespace-nowrap transition ${
                      active ? "bg-linear-to-r from-brand to-emerald-500 text-white shadow-lg shadow-brand/30" : "text-white/70 hover:bg-white/[0.07] hover:text-white"
                    }`}
                  >
                    <Icon className="size-5 shrink-0" />
                    <span className="min-w-0 flex-1 truncate">{label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
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
      <div className="min-h-screen bg-[#f3f6fb] bg-[radial-gradient(1200px_500px_at_100%_-10%,rgba(19,162,168,0.10),transparent_60%),radial-gradient(900px_400px_at_0%_0%,rgba(99,102,241,0.06),transparent_60%)] bg-fixed">
        {/* Desktop sidebar */}
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 bg-linear-to-b from-[#0f2537] via-[#132f45] to-[#0c3a44] shadow-xl shadow-slate-900/10 lg:block print:hidden">{sidebar}</aside>

        {/* Mobile drawer */}
        <div className={`fixed inset-0 z-50 lg:hidden ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
          <div
            onClick={() => setOpen(false)}
            className={`absolute inset-0 bg-black/50 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
          />
          <aside
            className={`absolute inset-y-0 left-0 w-72 bg-linear-to-b from-[#0f2537] via-[#132f45] to-[#0c3a44] transition-transform duration-300 ${
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

        <div className="lg:pl-72">
          <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200/70 bg-white/75 px-4 backdrop-blur-xl sm:px-6 lg:px-8 print:hidden">
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
                className="grid size-10 place-items-center rounded-full bg-linear-to-br from-brand to-emerald-500 text-sm font-bold text-white shadow-md shadow-brand/30 ring-2 ring-white"
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
