"use client";

import Link from "next/link";
import { Fragment, useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  Headset,
  Heart,
  LayoutGrid,
  Menu,
  Phone,
  ShoppingCart,
  Truck,
  User,
  X,
} from "lucide-react";
import { CategoryIcon } from "@/lib/category-icons";
import { container } from "@/lib/ui";
import { useCart } from "./CartProvider";
import { Logo } from "./Logo";
import { SearchBar } from "./SearchBar";
import { useStore } from "./StoreProvider";
import type { MenuLink } from "@/server/menus";

/** Used until a menu is assigned to "Header navigation" in Admin → Menus. */
const defaultNav: MenuLink[] = [
  { label: "Home", href: "/" },
  { label: "All Products", href: "/products" },
  { label: "FAQ", href: "#" },
  { label: "Contact", href: "#footer" },
  { label: "Blogs", href: "/blog" },
  { label: "How to Order", href: "#" },
].map((l) => ({ ...l, newTab: false, children: [] }));

function NavLink({ link, className, onClick, children }: { link: MenuLink; className: string; onClick?: () => void; children?: React.ReactNode }) {
  return (
    <Link
      href={link.href}
      onClick={onClick}
      className={className}
      {...(link.newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {link.label}
      {children}
    </Link>
  );
}

function HeaderAction({
  icon: Icon,
  label,
  count,
  href = "#",
  className = "",
}: {
  icon: typeof Heart;
  label: string;
  count?: number;
  href?: string;
  className?: string;
}) {
  return (
    <Link href={href} className={`flex items-end gap-1.5 text-heading hover:text-brand ${className}`}>
      <span className="relative">
        <Icon className="size-6" strokeWidth={1.6} />
        {count !== undefined && (
          <span className="absolute -top-1.5 -right-2 grid size-4 place-items-center rounded-full bg-brand text-[10px] font-bold text-white">
            {count}
          </span>
        )}
      </span>
      <span className="hidden text-sm text-body lg:inline">{label}</span>
    </Link>
  );
}

export function Header() {
  const { cartCount, wishlist } = useCart();
  const { settings: contact, categories, menus, customer } = useStore();
  const nav = menus.header?.items ?? defaultNav;
  const topLinks = menus["top-bar"]?.items;
  const [menuOpen, setMenuOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const catRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!catOpen) return;
    const close = (e: MouseEvent) => {
      if (!catRef.current?.contains(e.target as Node)) setCatOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [catOpen]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
  }, [menuOpen]);

  return (
    <header className="bg-white">
      {/* Top bar */}
      <div className="hidden border-b border-line md:block">
        <div className={`${container} flex h-9 items-center justify-between text-xs text-body`}>
          <div className="flex items-center gap-3">
            {topLinks ? (
              topLinks.map((l, i) => (
                <Fragment key={`${l.href}-${i}`}>
                  {i > 0 && <span className="h-3 w-px bg-line" />}
                  <NavLink link={l} className="hover:text-brand" />
                </Fragment>
              ))
            ) : (
              <>
                <Link href="#" className="hover:text-brand">About Us</Link>
                <span className="h-3 w-px bg-line" />
                <Link href="#" className="flex items-center gap-1 hover:text-brand">
                  <Truck className="size-3.5" /> Order Tracking
                </Link>
              </>
            )}
          </div>
          <p className="flex items-center gap-1">
            Need help? Call Us:
            <a href={`tel:${contact.phone}`} className="flex items-center gap-1 font-semibold text-brand">
              <Phone className="size-3" /> {contact.phone}
            </a>
          </p>
        </div>
      </div>

      {/* Main header */}
      <div className="sticky top-0 z-40 border-b border-line bg-white lg:static lg:border-0">
        <div className={`${container} flex items-center gap-3 py-2.5 md:gap-6 lg:gap-12 lg:py-5`}>
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setMenuOpen(true)}
            className="-ml-1 p-1 text-heading lg:hidden"
          >
            <Menu className="size-6" />
          </button>
          <Link href="/" aria-label="Ultimate Organic Life home">
            <Logo src={contact.logoUrl} alt={contact.storeName} />
          </Link>
          <SearchBar className="mx-auto hidden max-w-[820px] flex-1 md:flex" />
          <div className="ml-auto flex items-center gap-4 md:ml-0 lg:gap-7">
            <HeaderAction icon={Heart} label="Wishlist" count={wishlist.length} href="/wishlist" />
            <HeaderAction icon={ShoppingCart} label="Cart" count={cartCount} href="/cart" />
            <HeaderAction
              icon={User}
              label={customer ? customer.name.split(/\s+/)[0] : "Account"}
              href={customer ? "/account" : "/login"}
              className="hidden sm:flex"
            />
          </div>
        </div>
        <div className={`${container} pb-3 md:hidden`}>
          <SearchBar />
        </div>
      </div>

      {/* Navigation */}
      <nav className="hidden border-y border-line lg:block">
        <div className={`${container} flex h-[60px] items-center justify-between gap-6`}>
          <div ref={catRef} className="relative">
            <button
              type="button"
              onClick={() => setCatOpen((v) => !v)}
              aria-expanded={catOpen}
              className="flex h-10 items-center gap-2 rounded-md border border-brand px-4 text-sm font-bold text-heading transition hover:bg-brand-light"
            >
              <LayoutGrid className="size-4" /> Browse All Categories
              <ChevronDown className={`size-4 transition ${catOpen ? "rotate-180" : ""}`} />
            </button>
            {catOpen && (
              <div className="absolute top-12 left-0 z-50 grid w-[420px] grid-cols-2 gap-2 rounded-xl border border-line bg-white p-4 shadow-xl">
                {categories.map(({ slug, name, icon }) => (
                  <Link
                    key={slug}
                    href={`/products?category=${slug}`}
                    onClick={() => setCatOpen(false)}
                    className="flex items-center gap-3 rounded-lg border border-line px-3 py-2.5 text-sm font-semibold text-heading transition hover:border-brand hover:text-brand"
                  >
                    <CategoryIcon name={icon} className="size-5 text-brand" strokeWidth={1.6} /> {name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <ul className="flex items-center gap-8 xl:gap-10">
            {nav.map((l, i) =>
              l.children.length ? (
                <li key={`${l.href}-${i}`} className="group relative">
                  <NavLink link={l} className="flex items-center gap-1 text-sm font-bold text-heading transition group-hover:text-brand">
                    <ChevronDown className="size-3.5 transition group-focus-within:rotate-180 group-hover:rotate-180" />
                  </NavLink>
                  {/* Dropdown opens on hover and on keyboard focus */}
                  <div className="invisible absolute top-full left-1/2 z-50 -translate-x-1/2 pt-4 opacity-0 transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                    <ul className="min-w-52 rounded-xl border border-line bg-white p-2 shadow-xl">
                      {l.children.map((c, j) => (
                        <li key={`${c.href}-${j}`}>
                          <NavLink
                            link={c}
                            className="block rounded-lg px-3 py-2 text-sm font-semibold whitespace-nowrap text-heading transition hover:bg-brand-light hover:text-brand"
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              ) : (
                <li key={`${l.href}-${i}`}>
                  <NavLink link={l} className="text-sm font-bold text-heading transition hover:text-brand" />
                </li>
              ),
            )}
          </ul>

          <a href={`tel:${contact.phone}`} className="flex items-center gap-2.5">
            <Headset className="size-8 text-heading" strokeWidth={1.5} />
            <span className="leading-tight">
              <span className="block text-2xl font-bold text-brand">{contact.phone}</span>
              <span className="block text-[11px] text-body">7 Days customer support</span>
            </span>
          </a>
        </div>
      </nav>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${menuOpen ? "" : "pointer-events-none"}`}
        aria-hidden={!menuOpen}
      >
        <div
          onClick={() => setMenuOpen(false)}
          className={`absolute inset-0 bg-black/40 transition-opacity ${menuOpen ? "opacity-100" : "opacity-0"}`}
        />
        <aside
          className={`absolute inset-y-0 left-0 flex w-[85%] max-w-sm flex-col overflow-y-auto bg-white shadow-2xl transition-transform duration-300 ${
            menuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-line p-4">
            <Logo src={contact.logoUrl} alt={contact.storeName} />
            <button type="button" aria-label="Close menu" onClick={() => setMenuOpen(false)} className="p-1">
              <X className="size-6 text-heading" />
            </button>
          </div>
          <ul className="border-b border-line p-4">
            {nav.map((l, i) => (
              <li key={`${l.href}-${i}`}>
                <NavLink link={l} onClick={() => setMenuOpen(false)} className="block py-2.5 font-bold text-heading hover:text-brand" />
                {l.children.length > 0 && (
                  <ul className="mb-1 ml-3 border-l-2 border-brand-light pl-3">
                    {l.children.map((c, j) => (
                      <li key={`${c.href}-${j}`}>
                        <NavLink link={c} onClick={() => setMenuOpen(false)} className="block py-2 text-sm font-semibold text-body hover:text-brand" />
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
          <div className="p-4">
            <p className="mb-3 text-xs font-bold tracking-wider text-body uppercase">Categories</p>
            <div className="grid grid-cols-2 gap-2">
              {categories.map(({ slug, name, icon }) => (
                <Link
                  key={slug}
                  href={`/products?category=${slug}`}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 rounded-lg bg-soft px-3 py-2.5 text-sm font-semibold text-heading"
                >
                  <CategoryIcon name={icon} className="size-4 shrink-0 text-brand" /> {name}
                </Link>
              ))}
            </div>
          </div>
          <a
            href={`tel:${contact.phone}`}
            className="mx-4 mt-auto mb-6 flex items-center gap-3 rounded-xl bg-brand-light p-4"
          >
            <Headset className="size-7 text-brand" />
            <span className="leading-tight">
              <span className="block text-lg font-bold text-brand">{contact.phone}</span>
              <span className="text-xs text-body">7 Days customer support</span>
            </span>
          </a>
        </aside>
      </div>
    </header>
  );
}
