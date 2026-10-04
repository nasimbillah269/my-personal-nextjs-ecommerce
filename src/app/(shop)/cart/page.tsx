import type { Metadata } from "next";
import { CartView } from "@/components/CartView";
import { container } from "@/lib/ui";
import { getPopularProducts } from "@/server/queries";

export const metadata: Metadata = {
  title: "Shopping Cart — Ultimate Organic Life",
  robots: { index: false },
};

export default async function CartPage() {
  const suggestions = await getPopularProducts();
  return (
    <main className={`${container} flex-1 pt-4 lg:pt-6`}>
      <CartView suggestions={suggestions.slice(0, 4)} />
    </main>
  );
}
