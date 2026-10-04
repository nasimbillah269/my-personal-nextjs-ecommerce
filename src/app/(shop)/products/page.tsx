import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductListing } from "@/components/ProductListing";
import { ListingSkeleton } from "@/components/ShopSkeletons";
import { container } from "@/lib/ui";
import { getActiveProducts, getCategories } from "@/server/queries";

export const metadata: Metadata = {
  title: "All Products — Ultimate Organic Life",
  description: "Browse organic oils, seeds, honey, salt, coffee and natural care products. Filter by category, price and offers.",
};

export default async function ProductsPage() {
  const [products, categories] = await Promise.all([getActiveProducts(), getCategories()]);
  return (
    <main className={`${container} flex-1 pt-4 lg:pt-6`}>
      <Suspense fallback={<ListingSkeleton standalone={false} />}>
        <ProductListing products={products} categories={categories} />
      </Suspense>
    </main>
  );
}
