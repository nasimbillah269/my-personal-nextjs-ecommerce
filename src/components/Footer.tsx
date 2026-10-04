"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUp, Clock, Heart, House, LayoutGrid, Mail, MapPin, MessageCircle, Phone, ShoppingCart, User } from "lucide-react";
import { container } from "@/lib/ui";
import { useCart } from "./CartProvider";
import { Logo } from "./Logo";
import { Reveal } from "./Reveal";
import { useStore } from "./StoreProvider";

const toLink = (label: string) => ({ label, href: "#" });

const staticColumns = [
  { title: "Company", links: ["About Us", "Delivery Information", "Privacy Policy", "Terms & Conditions", "Contact Us"].map(toLink) },
  {
    title: "Account",
    links: [toLink("Sign In"), { label: "View Cart", href: "/cart" }, ...["My Wishlist", "Track My Order", "How to Order"].map(toLink)],
  },
];

export function Footer() {
  const { settings: contact, categories } = useStore();
  const columns = [
    ...staticColumns,
    { title: "Popular", links: categories.slice(0, 6).map((c) => ({ label: c.name, href: `/products?category=${c.slug}` })) },
  ];
  return (
    <footer id="footer" className="mt-12 border-t border-line pb-16 lg:mt-16 md:pb-0">
      <div className={`${container} grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr] lg:py-14`}>
        <Reveal>
          <Logo className="items-start" src={contact.logoUrl} alt={contact.storeName} />
          <p className="mt-4 max-w-xs text-sm text-body">
            Certified organic food and natural care products for a healthier everyday life.
          </p>
          <ul className="mt-4 space-y-2.5 text-sm text-heading">
            <li className="flex gap-2"><MapPin className="size-4 shrink-0 text-brand" /> {contact.address}</li>
            <li className="flex gap-2"><Phone className="size-4 shrink-0 text-brand" /> {contact.phone}</li>
            <li className="flex gap-2"><Mail className="size-4 shrink-0 text-brand" /> {contact.email}</li>
            <li className="flex gap-2"><Clock className="size-4 shrink-0 text-brand" /> 10:00 – 18:00, Sat – Thu</li>
          </ul>
        </Reveal>
        {columns.map((col, i) => (
          <Reveal key={col.title} delay={(i + 1) * 100}>
            <h3 className="mb-4 text-lg font-bold text-heading">{col.title}</h3>
            <ul className="space-y-2.5">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm text-heading/80 transition hover:pl-1 hover:text-brand">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </Reveal>
        ))}
      </div>
      <div className="border-t border-line">
        <div className={`${container} flex flex-col items-center justify-between gap-2 py-5 text-center text-xs text-body sm:flex-row`}>
          <p>© {new Date().getFullYear()} Ultimate Organic Life. All rights reserved.</p>
          <p>
            Hotline: <a href={`tel:${contact.phone}`} className="font-bold text-brand">{contact.phone}</a>
          </p>
        </div>
      </div>
    </footer>
  );
}

export function BackToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={`fixed right-4 bottom-36 z-40 grid size-11 place-items-center rounded-full bg-brand text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:bg-brand-dark md:bottom-22 ${
        show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      }`}
    >
      <ArrowUp className="size-5" />
    </button>
  );
}

export function ChatButton() {
  const { settings: contact } = useStore();
  return (
    <a
      href={`tel:${contact.phone}`}
      className="fixed right-4 bottom-20 z-40 flex items-center gap-2 md:bottom-6"
      aria-label="Chat with us"
    >
      <span className="hidden items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-semibold text-heading shadow-lg md:flex">
        <span className="size-2 rounded-full bg-amber-400" /> Chat with us
      </span>
      <span className="grid size-12 place-items-center rounded-full bg-heading text-white shadow-lg transition hover:bg-brand">
        <MessageCircle className="size-5" />
      </span>
    </a>
  );
}

export function MobileBottomNav() {
  const { cartCount, wishlist } = useCart();
  const items = [
    { label: "Home", icon: House, href: "/" },
    { label: "Categories", icon: LayoutGrid, href: "/products" },
    { label: "Cart", icon: ShoppingCart, href: "/cart", count: cartCount },
    { label: "Wishlist", icon: Heart, href: "#", count: wishlist.length },
    { label: "Account", icon: User, href: "#" },
  ];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
      {items.map(({ label, icon: Icon, href, count }) => (
        <Link key={label} href={href} className="flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold text-heading">
          <span className="relative">
            <Icon className="size-5" strokeWidth={1.7} />
            {count !== undefined && count > 0 && (
              <span className="absolute -top-1.5 -right-2.5 grid size-4 place-items-center rounded-full bg-brand text-[9px] font-bold text-white">
                {count}
              </span>
            )}
          </span>
          {label}
        </Link>
      ))}
    </nav>
  );
}
