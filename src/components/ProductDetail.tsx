"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Heart, Mail, Minus, Plus, Share2, ShoppingCart, Zap } from "lucide-react";
import type { Product, ProductDetails } from "@/lib/types";
import { formatPrice } from "@/lib/ui";
import { useCart } from "./CartProvider";
import { Logo, LogoMark } from "./Logo";
import { useStore } from "./StoreProvider";

/* ---------- Gallery ---------- */

// Placeholder "angles" used until real photos are added to product.image.
const angles = [0, -90, 14, -42];

function GalleryImage({ product, angle, large }: { product: Product; angle: number; large?: boolean }) {
  if (product.image) {
    return (
      <Image
        src={product.image}
        alt={product.name}
        fill
        sizes={large ? "(min-width: 1024px) 45vw, 90vw" : "96px"}
        className="object-cover"
        priority={large}
      />
    );
  }
  return (
    <div className="grid h-full place-items-center">
      <div className="grid size-[70%] place-items-center rounded-full" style={{ background: product.tint }}>
        <span
          className={large ? "text-[110px] sm:text-[150px] lg:text-[180px]" : "text-3xl"}
          style={{ display: "inline-block", transform: `rotate(${angle}deg)` }}
          role="img"
          aria-label={product.name}
        >
          {product.emoji}
        </span>
      </div>
    </div>
  );
}

export function ProductGallery({
  product,
  credit,
}: {
  product: Product;
  credit?: { text: string; url: string | null } | null;
}) {
  const { settings } = useStore();
  const [active, setActive] = useState(0);
  // Emoji placeholders get playful "angles"; a real photo is shown as-is.
  const views = product.image ? [0] : angles;
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);

  return (
    <div>
      <div
        className="relative aspect-square cursor-zoom-in overflow-hidden rounded-2xl bg-white"
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
        }}
        onMouseLeave={() => setZoom(null)}
      >
        <div
          className="absolute inset-0 transition-transform duration-200 ease-out"
          style={{
            transform: zoom ? "scale(1.6)" : "scale(1)",
            transformOrigin: zoom ? `${zoom.x}% ${zoom.y}%` : "center",
          }}
        >
          <GalleryImage product={product} angle={views[active] ?? 0} large />
        </div>
        <Logo
          src={settings.logoUrl}
          alt={settings.storeName}
          imgClassName="h-9 lg:h-11"
          className={`pointer-events-none absolute top-4 right-4 hidden sm:flex ${
            product.image ? "rounded-xl bg-white/90 px-3 py-2 shadow-sm" : ""
          }`}
        />
      </div>

      {credit && (
        <p className="mt-2 text-[11px] text-body">
          Photo:{" "}
          {credit.url ? (
            <a
              href={credit.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="underline-offset-2 hover:text-brand hover:underline"
            >
              {credit.text}
            </a>
          ) : (
            credit.text
          )}
        </p>
      )}

      {views.length > 1 && (
        <div className="mt-4 flex gap-3">
          {views.map((angle, i) => (
            <button
              key={angle}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show image ${i + 1}`}
              aria-current={i === active}
              className={`relative size-16 shrink-0 overflow-hidden rounded-xl border-2 bg-white transition sm:size-20 ${
                i === active ? "border-brand" : "border-line hover:border-brand/50"
              }`}
            >
              <GalleryImage product={product} angle={angle} />
              <LogoMark className="absolute top-1 right-1 h-2.5 w-3.5" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Share ---------- */

const shareTargets = [
  {
    name: "Facebook",
    color: "#1877f2",
    url: (u: string) => `https://www.facebook.com/sharer/sharer.php?u=${u}`,
    path: "M14 8.5V7c0-.7.4-1 1-1h2V2.5h-3c-2.8 0-4 1.8-4 4.3v1.7H7.5V12H10v9.5h4V12h2.7l.5-3.5H14Z",
  },
  {
    name: "X (Twitter)",
    color: "#1da1f2",
    url: (u: string, t: string) => `https://twitter.com/intent/tweet?url=${u}&text=${t}`,
    path: "M4 4l6.6 8.8L4.3 20h1.5l5.5-6.2 4.6 6.2H20l-6.9-9.3L19 4h-1.5l-5.1 5.8L8.1 4H4Z",
  },
  {
    name: "LinkedIn",
    color: "#0a66c2",
    url: (u: string) => `https://www.linkedin.com/sharing/share-offsite/?url=${u}`,
    path: "M6.5 9h-3v11h3V9ZM5 3.5a1.75 1.75 0 1 0 0 3.5 1.75 1.75 0 0 0 0-3.5ZM10 9H7.2v11H10v-5.8c0-1.6.8-2.6 2.1-2.6 1.2 0 1.8.9 1.8 2.6V20H17v-6.6c0-3.1-1.6-4.6-3.9-4.6-1.4 0-2.5.7-3.1 1.5V9Z",
  },
];

export function ShareButtons({ title }: { title: string }) {
  const share = (build: (u: string, t: string) => string) => {
    const href = build(encodeURIComponent(window.location.href), encodeURIComponent(title));
    window.open(href, "_blank", "noopener,noreferrer,width=600,height=500");
  };

  return (
    <div className="mt-8 space-y-3 text-xs text-body">
      <p className="flex items-center gap-1.5">
        <Share2 className="size-3.5" /> Share this
      </p>
      <div className="flex gap-2">
        {shareTargets.map((s) => (
          <button
            key={s.name}
            type="button"
            onClick={() => share(s.url)}
            aria-label={`Share on ${s.name}`}
            className="grid size-8 place-items-center rounded text-white transition hover:-translate-y-0.5 hover:opacity-90"
            style={{ background: s.color }}
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
              <path d={s.path} />
            </svg>
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => {
          window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(window.location.href)}`;
        }}
        className="flex items-center gap-1.5 hover:text-brand"
      >
        <Mail className="size-3.5" /> Email to a Friend
      </button>
    </div>
  );
}

/* ---------- Info / buy box ---------- */

export function ProductInfo({
  product,
  details,
  categoryName,
}: {
  product: Product;
  details: ProductDetails;
  categoryName?: string;
}) {
  const router = useRouter();
  const { addToCart, wishlist, toggleWishlist } = useCart();
  const [variantIndex, setVariantIndex] = useState(0);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState<"cart" | "buy" | null>(null);

  const variant = details.variants[variantIndex];
  const inWishlist = wishlist.includes(product.id);
  const soldOut = details.stock <= 0;
  const discount = variant.oldPrice ? Math.round((1 - variant.price / variant.oldPrice) * 100) : 0;

  const add = (kind: "cart" | "buy") => {
    addToCart(
      {
        productId: product.id,
        variant: variant.label,
        price: variant.price,
        name: product.name,
        emoji: product.emoji,
        tint: product.tint,
        image: product.image ?? null,
      },
      qty,
    );
    if (kind === "buy") {
      router.push("/checkout");
      return;
    }
    setAdded(kind);
    setTimeout(() => setAdded(null), 1500);
  };

  return (
    <div className="lg:pt-4">
      <h1 className="text-2xl leading-snug font-bold text-heading lg:text-3xl">{product.name}</h1>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <span className="text-3xl font-bold text-brand lg:text-4xl">{formatPrice(variant.price)}.00</span>
        {variant.oldPrice && (
          <span className="text-lg font-semibold text-body line-through">{formatPrice(variant.oldPrice)}</span>
        )}
        {discount > 0 && (
          <span className="rounded-full bg-brand-light px-3 py-1 text-xs font-bold text-brand-dark">
            {discount}% Off
          </span>
        )}
      </div>

      <p className="mt-5 font-bangla text-sm leading-7 text-body">{details.summary}</p>

      {details.variants.length > 1 && (
        <div className="mt-6">
          <p className="mb-2 text-xs font-semibold text-body">Variation</p>
          <div className="flex flex-wrap gap-2">
            {details.variants.map((v, i) => (
              <button
                key={v.label}
                type="button"
                onClick={() => setVariantIndex(i)}
                aria-pressed={i === variantIndex}
                className={`rounded-md border-2 px-3 py-1.5 text-xs font-bold transition ${
                  i === variantIndex
                    ? "border-brand bg-brand-light text-brand-dark"
                    : "border-line text-heading hover:border-brand/50"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="mt-6 text-xs text-body">
        Availability:{" "}
        {soldOut ? (
          <span className="font-semibold text-red-500">Out of stock</span>
        ) : (
          <span className="font-semibold text-brand">{details.stock} products available</span>
        )}
      </p>

      <div className="mt-4 flex w-fit items-center rounded-md border border-line">
        <button
          type="button"
          aria-label="Decrease quantity"
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          className="grid size-9 place-items-center text-body transition hover:text-brand disabled:opacity-40"
          disabled={qty <= 1}
        >
          <Minus className="size-3.5" />
        </button>
        <input
          type="number"
          aria-label="Quantity"
          value={qty}
          min={1}
          max={details.stock}
          onChange={(e) => setQty(Math.min(details.stock, Math.max(1, Number(e.target.value) || 1)))}
          className="h-9 w-10 [appearance:textfield] text-center text-sm font-bold text-heading outline-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button
          type="button"
          aria-label="Increase quantity"
          onClick={() => setQty((q) => Math.min(details.stock, q + 1))}
          className="grid size-9 place-items-center rounded-r-md bg-soft text-heading transition hover:text-brand"
        >
          <Plus className="size-3.5" />
        </button>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => add("cart")}
          disabled={soldOut}
          className="flex h-11 flex-1 items-center justify-center gap-2 rounded-md bg-brand-dark px-4 whitespace-nowrap sm:px-6 text-sm font-bold text-white transition hover:bg-brand disabled:pointer-events-none disabled:opacity-50 sm:flex-none"
        >
          {added === "cart" ? <Check className="size-4" /> : <ShoppingCart className="size-4" />}
          {added === "cart" ? "Added" : "Add to cart"}
        </button>
        <button
          type="button"
          onClick={() => add("buy")}
          disabled={soldOut}
          className="flex h-11 flex-1 items-center justify-center gap-2 rounded-md bg-sky-400 px-4 whitespace-nowrap sm:px-6 text-sm font-bold text-white transition hover:bg-sky-500 disabled:pointer-events-none disabled:opacity-50 sm:flex-none"
        >
          <Zap className="size-4" />
          Buy Now
        </button>
        <button
          type="button"
          onClick={() => toggleWishlist(product.id)}
          aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={inWishlist}
          className={`grid size-11 place-items-center rounded-full border border-line transition hover:border-brand ${
            inWishlist ? "text-red-500" : "text-body hover:text-brand"
          }`}
        >
          <Heart className="size-5" fill={inWishlist ? "currentColor" : "none"} />
        </button>
      </div>

      <p className="mt-8 text-xs font-semibold text-leaf">
        Download UOL App for{" "}
        <Link href="#" className="text-brand hover:underline">
          iOS
        </Link>{" "}
        and{" "}
        <Link href="#" className="text-brand hover:underline">
          Android
        </Link>
      </p>

      <dl className="mt-4 space-y-2 text-xs text-body">
        <div className="flex gap-1">
          <dt>Categories:</dt>
          <dd>
            <Link href={`/products?category=${product.category}`} className="text-brand hover:underline">
              {categoryName}
            </Link>
          </dd>
        </div>
        <div className="flex gap-1">
          <dt className="shrink-0">Tags:</dt>
          <dd className="text-brand">{details.tags.join(", ")}</dd>
        </div>
        <div className="flex gap-1">
          <dt>Brands:</dt>
          <dd className="text-brand">{details.brand}</dd>
        </div>
      </dl>
    </div>
  );
}

/* ---------- Tabs ---------- */

export function ProductTabs({
  product,
  details,
  categoryName,
}: {
  product: Product;
  details: ProductDetails;
  categoryName?: string;
}) {
  const [tab, setTab] = useState<"description" | "info">("description");

  const tabClass = (active: boolean) =>
    `rounded-full border px-5 py-2 text-sm font-bold transition ${
      active
        ? "border-line text-brand shadow-[0_4px_14px_rgba(0,0,0,0.06)]"
        : "border-transparent text-body hover:text-brand"
    }`;

  return (
    <section className="mt-10 rounded-2xl border border-line p-5 sm:p-8 lg:mt-14 lg:p-12">
      <div role="tablist" className="flex flex-wrap gap-2">
        <button
          role="tab"
          aria-selected={tab === "description"}
          onClick={() => setTab("description")}
          className={tabClass(tab === "description")}
        >
          Description
        </button>
        <button
          role="tab"
          aria-selected={tab === "info"}
          onClick={() => setTab("info")}
          className={tabClass(tab === "info")}
        >
          Additional Info
        </button>
      </div>

      {tab === "description" ? (
        <div role="tabpanel" className="mt-8 space-y-7 font-bangla text-sm leading-7 text-heading/85 sm:text-[15px]">
          {details.description.map((block) => (
            <div key={block.heading}>
              <h3 className="mb-1.5 text-lg font-bold text-heading">{block.heading}</h3>
              {block.lines?.map((line) => (
                <p key={line}>{line}</p>
              ))}
              {block.points && (
                <div className="space-y-2">
                  {block.points.map((pt) => (
                    <div key={pt.title}>
                      <p className="font-bold text-brand-dark">{pt.title}</p>
                      <p>{pt.text}</p>
                    </div>
                  ))}
                </div>
              )}
              {block.bullets && (
                <ul className="list-disc space-y-1 pl-5 marker:text-brand">
                  {block.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div role="tabpanel" className="mt-8 overflow-hidden rounded-xl border border-line">
          <table className="w-full text-sm">
            <tbody>
              {[
                ["Product", product.name],
                ["Category", categoryName ?? "-"],
                ["Size / Weight", details.variants.map((v) => v.label).join(", ")],
                ["Brand", details.brand],
                ["Origin", details.origin],
                ["Stock", `${details.stock} available`],
              ].map(([k, v]) => (
                <tr key={k} className="border-b border-line last:border-0">
                  <th className="w-40 bg-soft px-4 py-3 text-left font-bold text-heading">{k}</th>
                  <td className="px-4 py-3 text-body">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
