"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Check, Heart, ShoppingCart } from "lucide-react";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/ui";
import { useCart } from "./CartProvider";
import { LogoMark } from "./Logo";

function ProductImage({ product }: { product: Product }) {
  return (
    <div className="relative aspect-square overflow-hidden rounded-xl">
      {product.image ? (
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(min-width: 1024px) 22vw, 45vw"
          className="rounded-xl object-cover transition duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="grid h-full place-items-center">
          <div
            className="grid size-[68%] place-items-center rounded-full transition duration-300 group-hover:scale-105"
            style={{ background: product.tint }}
          >
            <span className="text-5xl sm:text-6xl" role="img" aria-label={product.name}>
              {product.emoji}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export function ProductCard({
  product,
  variant = "compact",
}: {
  product: Product;
  variant?: "compact" | "full";
}) {
  const { addToCart, wishlist, toggleWishlist } = useCart();
  const [added, setAdded] = useState(false);
  const inWishlist = wishlist.includes(product.id);
  const discount = product.oldPrice ? Math.round((1 - product.price / product.oldPrice) * 100) : 0;

  const soldOut = product.stock <= 0;

  const handleAdd = () => {
    addToCart({
      productId: product.id,
      variant: product.variant,
      price: product.price,
      name: product.name,
      emoji: product.emoji,
      tint: product.tint,
      image: product.image ?? null,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  const price = (
    <p className="flex items-baseline gap-1.5">
      <span className="text-base font-bold text-brand sm:text-lg">{formatPrice(product.price)}</span>
      {product.oldPrice && (
        <span className="text-xs font-semibold text-body line-through">{formatPrice(product.oldPrice)}</span>
      )}
    </p>
  );

  return (
    <article className="group relative flex h-full flex-col rounded-2xl border border-line bg-white p-3 transition duration-300 hover:border-brand/40 hover:shadow-[0_10px_30px_-10px_rgba(19,162,168,0.35)] sm:p-4">
      {discount > 0 && (
        <span className="absolute top-0 left-0 z-10 rounded-tl-2xl rounded-br-2xl bg-brand px-3 py-1 text-[11px] font-semibold text-white">
          {discount}% Off
        </span>
      )}
      <LogoMark className="absolute top-3 right-3 z-10 h-6 w-8 sm:h-7 sm:w-10" />
      <button
        type="button"
        onClick={() => toggleWishlist(product.id)}
        aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
        aria-pressed={inWishlist}
        className={`absolute top-12 right-3 z-10 grid size-8 place-items-center rounded-full border border-line bg-white transition lg:opacity-0 lg:group-hover:opacity-100 ${
          inWishlist ? "text-red-500 lg:opacity-100" : "text-heading hover:text-brand"
        }`}
      >
        <Heart className="size-4" fill={inWishlist ? "currentColor" : "none"} />
      </button>

      <Link href={`/products/${product.id}`} className="block">
        <ProductImage product={product} />
        <h3 className="mt-3 line-clamp-2 min-h-10 text-[13px] leading-5 font-bold text-heading transition group-hover:text-brand sm:text-sm">
          {product.name}
        </h3>
      </Link>

      {variant === "compact" ? (
        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          {price}
          <button
            type="button"
            onClick={handleAdd}
            disabled={soldOut}
            className="flex shrink-0 items-center gap-1 rounded-md bg-brand-light px-2.5 py-1.5 text-xs font-bold text-brand transition hover:bg-brand hover:text-white disabled:pointer-events-none disabled:bg-soft disabled:text-body"
          >
            {added ? <Check className="size-3.5" /> : <ShoppingCart className="size-3.5" />}
            {soldOut ? "Sold out" : added ? "Added" : "Add"}
          </button>
        </div>
      ) : (
        <div className="mt-auto pt-3">
          {price}
          <button
            type="button"
            onClick={handleAdd}
            disabled={soldOut}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-brand-dark py-2.5 text-sm font-bold text-white transition hover:bg-brand disabled:pointer-events-none disabled:bg-body/40"
          >
            {added ? <Check className="size-4" /> : <ShoppingCart className="size-4" />}
            {soldOut ? "Sold Out" : added ? "Added to Cart" : "Add To Cart"}
          </button>
        </div>
      )}
    </article>
  );
}
