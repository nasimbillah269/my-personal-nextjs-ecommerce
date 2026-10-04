import type { Metadata } from "next";
import { CheckoutView } from "@/components/CheckoutView";
import { container } from "@/lib/ui";

export const metadata: Metadata = {
  title: "Checkout — Ultimate Organic Life",
  robots: { index: false },
};

export default function CheckoutPage() {
  return (
    <main className={`${container} flex-1 pt-4 lg:pt-6`}>
      <CheckoutView />
    </main>
  );
}
