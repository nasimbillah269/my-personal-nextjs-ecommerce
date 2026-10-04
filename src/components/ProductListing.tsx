"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  PackageSearch,
  RotateCcw,
  SlidersHorizontal,
  Tag,
  X,
} from "lucide-react";
import { CategoryIcon } from "@/lib/category-icons";
import type { Category, Product } from "@/lib/types";
import { formatPrice } from "@/lib/ui";
import { ProductCard } from "./ProductCard";
import { Reveal } from "./Reveal";

/* ---------- Filter state (lives in the URL) ---------- */

type Bounds = { min: number; max: number };

function priceBounds(list: Product[]): Bounds {
  if (list.length === 0) return { min: 0, max: 1000 };
  const min = Math.floor(Math.min(...list.map((p) => p.price)) / 100) * 100;
  const max = Math.ceil(Math.max(...list.map((p) => p.price)) / 100) * 100;
  return { min, max: max > min ? max : min + 100 };
}
const PRICE_STEP = 50;

const sortOptions = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "name", label: "Name: A to Z" },
  { value: "discount", label: "Best Discount" },
] as const;

const perPageOptions = [12, 24, 48];

const quickPrices = (b: Bounds) => [
  { label: `Under ${formatPrice(1000)}`, min: b.min, max: 1000 },
  { label: `${formatPrice(1000)} – ${formatPrice(2000)}`, min: 1000, max: 2000 },
  { label: `${formatPrice(2000)} – ${formatPrice(3000)}`, min: 2000, max: 3000 },
  { label: `Above ${formatPrice(3000)}`, min: 3000, max: b.max },
];

type Filters = {
  q: string;
  cats: string[];
  min: number;
  max: number;
  sale: boolean;
  sort: string;
  page: number;
  perPage: number;
};

function readFilters(params: URLSearchParams, b: Bounds): Filters {
  const num = (key: string, fallback: number) => {
    const n = Number(params.get(key));
    return params.has(key) && Number.isFinite(n) ? n : fallback;
  };
  const perPage = num("show", 12);
  return {
    q: params.get("q")?.trim() ?? "",
    cats: params.get("category")?.split(",").filter(Boolean) ?? [],
    min: Math.max(b.min, num("min", b.min)),
    max: Math.min(b.max, num("max", b.max)),
    sale: params.get("sale") === "1",
    sort: params.get("sort") ?? "featured",
    page: Math.max(1, num("page", 1)),
    perPage: perPageOptions.includes(perPage) ? perPage : 12,
  };
}

const discountOf = (p: Product) => (p.oldPrice ? 1 - p.price / p.oldPrice : 0);

function matches(p: Product, f: Filters, ignore?: "category" | "sale") {
  if (f.q && !p.name.toLowerCase().includes(f.q.toLowerCase())) return false;
  if (ignore !== "category" && f.cats.length && !f.cats.includes(p.category)) return false;
  if (p.price < f.min || p.price > f.max) return false;
  if (ignore !== "sale" && f.sale && !p.oldPrice) return false;
  return true;
}

function sortProducts(list: Product[], sort: string) {
  const sorted = [...list];
  switch (sort) {
    case "price-asc":
      return sorted.sort((a, b) => a.price - b.price);
    case "price-desc":
      return sorted.sort((a, b) => b.price - a.price);
    case "name":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case "discount":
      return sorted.sort((a, b) => discountOf(b) - discountOf(a));
    default:
      return sorted;
  }
}

/* ---------- Sidebar pieces ---------- */

function FilterCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-white p-5 shadow-[0_4px_20px_-12px_rgba(0,0,0,0.12)]">
      <h3 className="relative mb-5 border-b border-line pb-3 text-lg font-bold text-heading after:absolute after:-bottom-px after:left-0 after:h-0.5 after:w-12 after:bg-brand">
        {title}
      </h3>
      {children}
    </section>
  );
}

function PriceFilter({
  bounds,
  min,
  max,
  onCommit,
}: {
  bounds: Bounds;
  min: number;
  max: number;
  onCommit: (min: number, max: number) => void;
}) {
  // Local while dragging; committed to the URL on release so the list doesn't thrash.
  const [lo, setLo] = useState(min);
  const [hi, setHi] = useState(max);

  const commit = (nextLo = lo, nextHi = hi) => {
    const a = Math.max(bounds.min, Math.min(nextLo, nextHi));
    const b = Math.min(bounds.max, Math.max(nextLo, nextHi));
    if (a !== min || b !== max) onCommit(a, b);
  };

  const pct = (v: number) => ((v - bounds.min) / (bounds.max - bounds.min)) * 100;
  const rangeEvents = { onPointerUp: () => commit(), onKeyUp: () => commit(), onTouchEnd: () => commit() };

  return (
    <div>
      <div className="relative h-5">
        <div className="absolute top-1/2 h-1.5 w-full -translate-y-1/2 rounded-full bg-line" />
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-brand"
          style={{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }}
        />
        <input
          type="range"
          aria-label="Minimum price"
          min={bounds.min}
          max={bounds.max}
          step={PRICE_STEP}
          value={lo}
          onChange={(e) => setLo(Math.min(Number(e.target.value), hi - PRICE_STEP))}
          className="range-thumb"
          {...rangeEvents}
        />
        <input
          type="range"
          aria-label="Maximum price"
          min={bounds.min}
          max={bounds.max}
          step={PRICE_STEP}
          value={hi}
          onChange={(e) => setHi(Math.max(Number(e.target.value), lo + PRICE_STEP))}
          className="range-thumb"
          {...rangeEvents}
        />
      </div>

      <div className="mt-4 flex items-center gap-2">
        {(
          [
            ["Min", lo, setLo],
            ["Max", hi, setHi],
          ] as const
        ).map(([label, value, set], i) => (
          <label key={label} className="flex-1">
            <span className="mb-1 block text-[11px] font-semibold text-body">{label}</span>
            <span className="flex h-10 items-center rounded-lg border border-line px-3 focus-within:border-brand">
              <span className="text-sm text-body">৳</span>
              <input
                type="number"
                inputMode="numeric"
                value={value}
                onChange={(e) => set(Number(e.target.value) || 0)}
                onBlur={() => commit()}
                onKeyDown={(e) => e.key === "Enter" && commit()}
                className="w-full [appearance:textfield] bg-transparent pl-1 text-sm font-bold text-heading outline-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </span>
            {i === 0 && <span className="sr-only">to</span>}
          </label>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {quickPrices(bounds).map((q) => {
          const active = min === q.min && max === q.max;
          return (
            <button
              key={q.label}
              type="button"
              onClick={() => (active ? onCommit(bounds.min, bounds.max) : onCommit(q.min, q.max))}
              aria-pressed={active}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                active ? "border-brand bg-brand text-white" : "border-line text-heading hover:border-brand hover:text-brand"
              }`}
            >
              {q.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Sidebar({
  bounds,
  categories,
  filters,
  categoryCounts,
  saleCount,
  update,
}: {
  bounds: Bounds;
  categories: Category[];
  filters: Filters;
  categoryCounts: Record<string, number>;
  saleCount: number;
  update: (changes: Record<string, string | null>) => void;
}) {
  const toggleCategory = (slug: string) => {
    const next = filters.cats.includes(slug) ? filters.cats.filter((c) => c !== slug) : [...filters.cats, slug];
    update({ category: next.length ? next.join(",") : null });
  };

  return (
    <div className="space-y-6">
      <FilterCard title="Category">
        <ul className="space-y-1">
          {categories.map(({ slug, name, icon }) => {
            const checked = filters.cats.includes(slug);
            const count = categoryCounts[slug] ?? 0;
            return (
              <li key={slug}>
                <label
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 transition ${
                    checked ? "border-brand/50 bg-brand-light/60" : "border-transparent hover:border-line"
                  } ${count === 0 && !checked ? "opacity-50" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleCategory(slug)}
                    className="size-4 shrink-0 cursor-pointer accent-brand"
                  />
                  <CategoryIcon name={icon} className="size-5 shrink-0 text-brand" strokeWidth={1.5} />
                  <span className="flex-1 text-sm font-semibold text-heading">{name}</span>
                  <span className="grid h-5 min-w-6 place-items-center rounded-full bg-brand-light px-1.5 text-[11px] font-bold text-brand-dark">
                    {count}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </FilterCard>

      <FilterCard title="Filter by Price">
        <PriceFilter
          bounds={bounds}
          key={`${filters.min}-${filters.max}`}
          min={filters.min}
          max={filters.max}
          onCommit={(min, max) =>
            update({
              min: min === bounds.min ? null : String(min),
              max: max === bounds.max ? null : String(max),
            })
          }
        />
      </FilterCard>

      <FilterCard title="Offers">
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={filters.sale}
            onChange={() => update({ sale: filters.sale ? null : "1" })}
            className="size-4 cursor-pointer accent-brand"
          />
          <Tag className="size-5 text-brand" strokeWidth={1.5} />
          <span className="flex-1 text-sm font-semibold text-heading">On sale</span>
          <span className="grid h-5 min-w-6 place-items-center rounded-full bg-brand-light px-1.5 text-[11px] font-bold text-brand-dark">
            {saleCount}
          </span>
        </label>
      </FilterCard>

      <Link
        href="/products?sale=1"
        className="block overflow-hidden rounded-2xl p-6 transition hover:-translate-y-0.5"
        style={{ background: "linear-gradient(160deg,#f3f9d9 0%,#d7ecb0 60%,#a9d47a 100%)" }}
      >
        <p className="text-xs font-bold tracking-wider text-brand-dark uppercase">Special offer</p>
        <p className="mt-1 font-serif text-2xl text-brand-dark italic">Save 10% on organic care</p>
        <span className="mt-4 inline-block rounded-md bg-brand px-3 py-1.5 text-xs font-bold text-white">Shop deals →</span>
        <p className="mt-3 text-right text-4xl">🌿🍯🥥</p>
      </Link>
    </div>
  );
}

/* ---------- Pagination ---------- */

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1,
  );
  const btn = "grid size-10 place-items-center rounded-full text-sm font-bold transition";

  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-2">
      <button
        type="button"
        aria-label="Previous page"
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
        className={`${btn} bg-soft text-heading hover:bg-brand hover:text-white disabled:pointer-events-none disabled:opacity-40`}
      >
        <ChevronLeft className="size-4" />
      </button>
      {pages.map((p, i) => (
        <span key={p} className="flex items-center gap-2">
          {i > 0 && p - pages[i - 1] > 1 && <span className="text-body">…</span>}
          <button
            type="button"
            aria-current={p === page ? "page" : undefined}
            onClick={() => onChange(p)}
            className={`${btn} ${p === page ? "bg-brand text-white" : "bg-soft text-heading hover:bg-brand hover:text-white"}`}
          >
            {p}
          </button>
        </span>
      ))}
      <button
        type="button"
        aria-label="Next page"
        disabled={page === totalPages}
        onClick={() => onChange(page + 1)}
        className={`${btn} bg-soft text-heading hover:bg-brand hover:text-white disabled:pointer-events-none disabled:opacity-40`}
      >
        <ChevronRight className="size-4" />
      </button>
    </nav>
  );
}

/* ---------- Page ---------- */

export function ProductListing({ products, categories }: { products: Product[]; categories: Category[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const bounds = useMemo(() => priceBounds(products), [products]);
  const filters = useMemo(() => readFilters(new URLSearchParams(params.toString()), bounds), [params, bounds]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const listTop = useRef<HTMLDivElement>(null);

  const update = (changes: Record<string, string | null>, keepPage = false) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(changes)) {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    }
    if (!keepPage) next.delete("page");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const clearAll = () => router.replace(pathname, { scroll: false });

  const { results, categoryCounts, saleCount } = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of products) if (matches(p, filters, "category")) counts[p.category] = (counts[p.category] ?? 0) + 1;
    return {
      results: sortProducts(products.filter((p) => matches(p, filters)), filters.sort),
      categoryCounts: counts,
      saleCount: products.filter((p) => p.oldPrice && matches(p, filters, "sale")).length,
    };
  }, [filters, products]);

  const totalPages = Math.max(1, Math.ceil(results.length / filters.perPage));
  const page = Math.min(filters.page, totalPages);
  const pageItems = results.slice((page - 1) * filters.perPage, page * filters.perPage);

  const goToPage = (p: number) => {
    update({ page: p === 1 ? null : String(p) }, true);
    listTop.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  // Active filter chips
  const chips: { label: string; clear: () => void }[] = [];
  if (filters.q) chips.push({ label: `Search: “${filters.q}”`, clear: () => update({ q: null }) });
  for (const slug of filters.cats) {
    const name = categories.find((c) => c.slug === slug)?.name ?? slug;
    chips.push({
      label: name,
      clear: () => {
        const rest = filters.cats.filter((c) => c !== slug);
        update({ category: rest.length ? rest.join(",") : null });
      },
    });
  }
  if (filters.min !== bounds.min || filters.max !== bounds.max)
    chips.push({
      label: `${formatPrice(filters.min)} – ${formatPrice(filters.max)}`,
      clear: () => update({ min: null, max: null }),
    });
  if (filters.sale) chips.push({ label: "On sale", clear: () => update({ sale: null }) });

  const title =
    filters.cats.length === 1
      ? (categories.find((c) => c.slug === filters.cats[0])?.name ?? "Products")
      : filters.q
        ? `Results for “${filters.q}”`
        : "All Products";

  const sidebar = (
    <Sidebar bounds={bounds} categories={categories} filters={filters} categoryCounts={categoryCounts} saleCount={saleCount} update={update} />
  );

  return (
    <>
      {/* Page banner */}
      <Reveal variant="zoom">
        <section
          className="relative overflow-hidden rounded-2xl px-6 py-8 sm:px-10 lg:px-14 lg:py-12"
          style={{ background: "linear-gradient(110deg,#e2f4f3 0%,#f6fbf0 55%,#e6f3d3 100%)" }}
        >
          <h1 className="text-2xl font-bold text-heading sm:text-4xl">{title}</h1>
          <nav aria-label="Breadcrumb" className="mt-2 flex items-center gap-1.5 text-xs">
            <Link href="/" className="font-semibold text-brand hover:underline">Home</Link>
            <ChevronRight className="size-3 text-body" />
            <span className="text-body">Products</span>
          </nav>
          <div className="no-scrollbar mt-5 flex gap-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => update({ category: null })}
              className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition ${
                filters.cats.length === 0 ? "bg-brand text-white" : "bg-white text-heading hover:text-brand"
              }`}
            >
              All
            </button>
            {categories.map((c) => {
              const active = filters.cats.length === 1 && filters.cats[0] === c.slug;
              return (
                <button
                  key={c.slug}
                  type="button"
                  onClick={() => update({ category: active ? null : c.slug })}
                  className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition ${
                    active ? "bg-brand text-white" : "bg-white text-heading hover:text-brand"
                  }`}
                >
                  {c.name}
                </button>
              );
            })}
          </div>
          <p className="pointer-events-none absolute -right-2 -bottom-4 hidden text-8xl opacity-80 md:block lg:right-10 lg:text-9xl">
            🛒
          </p>
        </section>
      </Reveal>

      <div className="mt-8 grid gap-8 lg:grid-cols-[290px_minmax(0,1fr)] lg:gap-10">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-6">{sidebar}</div>
        </aside>

        <div ref={listTop} className="scroll-mt-28">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-body">
              We found <span className="font-bold text-brand">{results.length}</span> items for you!
            </p>
            <div className="flex w-full items-center gap-2 sm:w-auto">
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="relative flex h-10 items-center gap-2 rounded-lg border border-line px-4 text-sm font-bold text-heading lg:hidden"
              >
                <SlidersHorizontal className="size-4" /> Filters
                {chips.length > 0 && (
                  <span className="grid size-5 place-items-center rounded-full bg-brand text-[10px] text-white">
                    {chips.length}
                  </span>
                )}
              </button>
              <label className="hidden h-10 items-center gap-2 rounded-lg border border-line px-3 text-sm sm:flex">
                <span className="text-body">Show:</span>
                <select
                  value={filters.perPage}
                  onChange={(e) => update({ show: e.target.value === "12" ? null : e.target.value })}
                  className="cursor-pointer bg-transparent font-bold text-heading outline-none"
                >
                  {perPageOptions.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </label>
              <label className="flex h-10 flex-1 items-center gap-2 rounded-lg border border-line px-3 text-sm sm:flex-none">
                <span className="shrink-0 text-body">Sort by:</span>
                <select
                  value={filters.sort}
                  onChange={(e) => update({ sort: e.target.value === "featured" ? null : e.target.value })}
                  className="min-w-0 flex-1 cursor-pointer bg-transparent font-bold text-heading outline-none"
                >
                  {sortOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {/* Active filters */}
          {chips.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {chips.map((c) => (
                <button
                  key={c.label}
                  type="button"
                  onClick={c.clear}
                  className="flex items-center gap-1.5 rounded-full bg-brand-light px-3 py-1.5 text-xs font-bold text-brand-dark transition hover:bg-brand hover:text-white"
                >
                  {c.label} <X className="size-3.5" />
                </button>
              ))}
              <button
                type="button"
                onClick={clearAll}
                className="flex items-center gap-1 px-2 text-xs font-bold text-body underline-offset-2 hover:text-brand hover:underline"
              >
                <RotateCcw className="size-3.5" /> Clear all
              </button>
            </div>
          )}

          {/* Grid */}
          {pageItems.length > 0 ? (
            <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4 xl:gap-5">
              {pageItems.map((p, i) => (
                <Reveal key={p.id} delay={(i % 4) * 70} className="h-full">
                  <ProductCard product={p} />
                </Reveal>
              ))}
            </div>
          ) : (
            <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-line px-6 py-16 text-center">
              <PackageSearch className="size-14 text-brand" strokeWidth={1.2} />
              <p className="mt-4 text-lg font-bold text-heading">No products match your filters</p>
              <p className="mt-1 text-sm text-body">Try removing a filter or widening the price range.</p>
              <button
                type="button"
                onClick={clearAll}
                className="mt-5 rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white transition hover:bg-brand-dark"
              >
                Clear all filters
              </button>
            </div>
          )}

          <Pagination page={page} totalPages={totalPages} onChange={goToPage} />
        </div>
      </div>

      {/* Mobile filter drawer */}
      <div className={`fixed inset-0 z-50 lg:hidden ${drawerOpen ? "" : "pointer-events-none"}`} aria-hidden={!drawerOpen}>
        <div
          onClick={() => setDrawerOpen(false)}
          className={`absolute inset-0 bg-black/40 transition-opacity ${drawerOpen ? "opacity-100" : "opacity-0"}`}
        />
        <aside
          className={`absolute inset-y-0 left-0 flex w-[88%] max-w-sm flex-col bg-soft shadow-2xl transition-transform duration-300 ${
            drawerOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-line bg-white px-5 py-4">
            <p className="flex items-center gap-2 text-lg font-bold text-heading">
              <SlidersHorizontal className="size-5 text-brand" /> Filters
            </p>
            <button type="button" aria-label="Close filters" onClick={() => setDrawerOpen(false)} className="p-1">
              <X className="size-6 text-heading" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">{sidebar}</div>
          <div className="flex gap-3 border-t border-line bg-white p-4">
            <button
              type="button"
              onClick={clearAll}
              className="flex-1 rounded-full border border-line py-3 text-sm font-bold text-heading"
            >
              Clear all
            </button>
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="flex-[2] rounded-full bg-brand py-3 text-sm font-bold text-white"
            >
              Show {results.length} products
            </button>
          </div>
        </aside>
      </div>
    </>
  );
}
