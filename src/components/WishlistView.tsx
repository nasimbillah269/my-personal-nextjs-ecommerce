"use client";

import Link from "next/link";
import { ArrowRight, Heart, ShoppingCart, Trash2 } from "lucide-react";
import type { Product } from "@/lib/types";
import { useCart } from "./CartProvider";
import { useCartToast } from "./CartToast";
import { ProductCard } from "./ProductCard";
import { Reveal } from "./Reveal";

const grid = "grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6";

/** Wishlisted product slugs live in the browser (cart store); `products` is the active catalog to match them against. */
export function WishlistView({ products, suggestions }: { products: Product[]; suggestions: Product[] }) {
  const { ready, wishlist, clearWishlist, addToCart } = useCart();
  const notifyAdded = useCartToast();

  if (!ready) {
    return (
      <div className={`mt-8 ${grid}`}>
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-soft" />
        ))}
      </div>
    );
  }

  const bySlug = new Map(products.map((p) => [p.id, p]));
  // Newest first; products removed from the catalog simply drop out.
  const items = [...wishlist].reverse().flatMap((id) => bySlug.get(id) ?? []);
  const inStock = items.filter((p) => p.stock > 0);

  const addAllToCart = () => {
    for (const p of inStock) {
      const item = { productId: p.id, variant: p.variant, price: p.price, name: p.name, emoji: p.emoji, tint: p.tint, image: p.image ?? null };
      addToCart(item);
      notifyAdded(item);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-heading sm:text-3xl">My Wishlist</h1>
          <p className="mt-1 text-sm text-body">
            {items.length > 0 ? (
              <>
                <span className="font-bold text-brand">{items.length}</span> {items.length === 1 ? "product" : "products"} saved for later
              </>
            ) : (
              "Products you love, saved for later."
            )}
          </p>
        </div>
        {items.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={clearWishlist}
              className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm font-bold text-heading transition hover:border-red-300 hover:text-red-500"
            >
              <Trash2 className="size-4" /> Clear all
            </button>
            <button
              type="button"
              onClick={addAllToCart}
              disabled={inStock.length === 0}
              className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-dark disabled:opacity-50"
            >
              <ShoppingCart className="size-4" /> Add all to cart
            </button>
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <>
          <Reveal variant="zoom">
            <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed border-line px-6 py-16 text-center">
              <span className="grid size-28 place-items-center rounded-full bg-brand-light">
                <Heart className="size-12 text-brand" strokeWidth={1.4} />
              </span>
              <h2 className="mt-6 text-2xl font-bold text-heading">Your wishlist is empty</h2>
              <p className="mt-2 max-w-sm text-sm text-body">Tap the heart on any product to save it here for later.</p>
              <Link
                href="/products"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand px-7 py-3 text-sm font-bold text-white transition hover:bg-brand-dark"
              >
                Browse Products <ArrowRight className="size-4" />
              </Link>
            </div>
          </Reveal>
          {suggestions.length > 0 && (
            <section className="mt-12">
              <h2 className="mb-6 text-xl font-bold text-heading sm:text-2xl">Popular right now</h2>
              <div className={grid}>
                {suggestions.map((p, i) => (
                  <Reveal key={p.id} delay={i * 80} className="h-full">
                    <ProductCard product={p} />
                  </Reveal>
                ))}
              </div>
            </section>
          )}
        </>
      ) : (
        <div className={`mt-8 ${grid}`}>
          {items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </>
  );
}
