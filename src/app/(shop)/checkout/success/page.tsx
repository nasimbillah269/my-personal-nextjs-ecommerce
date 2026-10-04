import type { Metadata } from "next";
import { cookies } from "next/headers";
import { OrderSuccess } from "@/components/OrderSuccess";
import { container } from "@/lib/ui";
import { LAST_ORDER_COOKIE } from "@/server/constants";
import { getOrderView } from "@/server/queries";

export const metadata: Metadata = {
  title: "Order Complete — Ultimate Organic Life",
  robots: { index: false },
};

export default async function OrderSuccessPage() {
  // Only the browser that placed the order holds this cookie, so order details aren't guessable by URL.
  const orderNo = (await cookies()).get(LAST_ORDER_COOKIE)?.value;
  const order = orderNo ? await getOrderView(orderNo) : null;

  return (
    <main className={`${container} flex-1 pt-4 lg:pt-6`}>
      <OrderSuccess order={order} />
    </main>
  );
}
