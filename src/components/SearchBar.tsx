"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { ArrowRight, ChevronDown, Loader2, Search, X } from "lucide-react";
import { searchWords } from "@/lib/search";
import { formatPrice } from "@/lib/ui";
import { useStore } from "./StoreProvider";

type Suggestion = {
  id: string;
  name: string;
  price: number;
  oldPrice: number | null;
  category: string;
  image: string | null;
  emoji: string;
  tint: string;
  stock: number;
};

const DEBOUNCE_MS = 250;

/** Bolds the typed words inside a product name. */
function Highlight({ text, q }: { text: string; q: string }) {
  const words = searchWords(q).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (words.length === 0) return <>{text}</>;
  const parts = text.split(new RegExp(`(${words.join("|")})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="bg-transparent font-bold text-brand">
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}

export function SearchBar({ className = "" }: { className?: string }) {
  const router = useRouter();
  const { categories } = useStore();
  const listId = useId();
  const rootRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ items: Suggestion[]; total: number; for: string } | null>(null);
  const [active, setActive] = useState(-1);

  const term = q.trim();
  const categoryName = (slug: string) => categories.find((c) => c.slug === slug)?.name ?? "";

  // Fetch suggestions while typing (debounced; stale requests are aborted).
  useEffect(() => {
    if (!term) return;
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ q: term });
        if (category) params.set("category", category);
        const res = await fetch(`/api/search?${params}`, { signal: ctrl.signal });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as { items: Suggestion[]; total: number };
        setResults({ ...data, for: `${term}|${category}` });
        setActive(-1);
      } catch (err) {
        if ((err as Error).name !== "AbortError") setResults({ items: [], total: 0, for: `${term}|${category}` });
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [term, category]);

  // Close when clicking outside.
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const items = term ? (results?.items ?? []) : [];
  const showPanel = open && !!term && (results !== null || loading);
  const fresh = results?.for === `${term}|${category}`;

  const goToResults = () => {
    const params = new URLSearchParams();
    if (term) params.set("q", term);
    if (category) params.set("category", category);
    setOpen(false);
    inputRef.current?.blur();
    router.push(`/products${params.size ? `?${params}` : ""}`);
  };

  const goToProduct = (s: Suggestion) => {
    setOpen(false);
    setQ("");
    router.push(`/products/${s.id}`);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" && items.length) {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (i + 1) % items.length);
    } else if (e.key === "ArrowUp" && items.length) {
      e.preventDefault();
      setActive((i) => (i <= 0 ? items.length - 1 : i - 1));
    } else if (e.key === "Escape") {
      setOpen(false);
      setActive(-1);
    }
  };

  return (
    <form
      ref={rootRef}
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        if (open && active >= 0 && items[active]) goToProduct(items[active]);
        else goToResults();
      }}
      className={`relative flex h-11 items-center rounded-lg border border-brand/60 bg-white pr-1 lg:h-12 ${className}`}
    >
      <label className="relative hidden h-full items-center border-r border-line sm:flex">
        <span className="sr-only">Category</span>
        <select
          name="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-full cursor-pointer appearance-none bg-transparent pr-8 pl-4 text-xs font-semibold text-heading outline-none"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 size-3.5 text-body" />
      </label>
      <input
        ref={inputRef}
        type="text"
        name="q"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder="Search for items..."
        autoComplete="off"
        role="combobox"
        aria-expanded={showPanel}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        className="h-full min-w-0 flex-1 bg-transparent px-4 text-sm outline-none placeholder:text-body/80"
      />
      {loading ? (
        <Loader2 className="mr-2 size-4 shrink-0 animate-spin text-body" aria-hidden />
      ) : (
        q && (
          <button
            type="button"
            onClick={() => {
              setQ("");
              setResults(null);
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
            className="mr-1 grid size-8 shrink-0 place-items-center rounded-full text-body hover:text-heading"
          >
            <X className="size-4" />
          </button>
        )
      )}
      <button
        type="submit"
        aria-label="Search"
        className="grid size-9 shrink-0 place-items-center rounded-full bg-brand text-white transition hover:bg-brand-dark lg:size-10"
      >
        <Search className="size-4" />
      </button>

      {showPanel && (
        <div className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-line bg-white shadow-[0_16px_40px_-12px_rgba(16,24,40,0.25)]">
          {items.length > 0 ? (
            <ul id={listId} role="listbox" aria-label="Search suggestions" className={`max-h-[60vh] overflow-y-auto py-1.5 ${fresh ? "" : "opacity-60"}`}>
              {items.map((s, i) => (
                <li key={s.id} id={`${listId}-${i}`} role="option" aria-selected={i === active}>
                  <Link
                    href={`/products/${s.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      goToProduct(s);
                    }}
                    onMouseEnter={() => setActive(i)}
                    className={`flex items-center gap-3 px-3 py-2 transition ${i === active ? "bg-brand-light" : ""}`}
                  >
                    <span className="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-lg" style={{ background: s.tint }}>
                      {s.image ? (
                        <Image src={s.image} alt="" fill sizes="48px" className="object-cover" />
                      ) : (
                        <span className="text-2xl" aria-hidden>
                          {s.emoji}
                        </span>
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-1 text-sm text-heading">
                        <Highlight text={s.name} q={term} />
                      </span>
                      <span className="text-xs text-body">
                        {categoryName(s.category)}
                        {s.stock <= 0 && <span className="ml-2 font-semibold text-red-500">Sold out</span>}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block text-sm font-bold text-brand">{formatPrice(s.price)}</span>
                      {s.oldPrice && <span className="block text-xs text-body line-through">{formatPrice(s.oldPrice)}</span>}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : fresh && !loading ? (
            <p className="px-4 py-6 text-center text-sm text-body">
              No products found for “<span className="font-semibold text-heading">{term}</span>”
              {category && <> in {categoryName(category)}</>}.
            </p>
          ) : (
            <p className="flex items-center justify-center gap-2 px-4 py-6 text-sm text-body">
              <Loader2 className="size-4 animate-spin" /> Searching…
            </p>
          )}
          {items.length > 0 && results && (
            <button
              type="button"
              onClick={goToResults}
              className="flex w-full items-center justify-between gap-2 border-t border-line bg-soft/60 px-4 py-2.5 text-sm font-bold text-brand transition hover:bg-brand-light"
            >
              See all {results.total} {results.total === 1 ? "result" : "results"} for “{term}”
              <ArrowRight className="size-4" />
            </button>
          )}
        </div>
      )}
    </form>
  );
}
