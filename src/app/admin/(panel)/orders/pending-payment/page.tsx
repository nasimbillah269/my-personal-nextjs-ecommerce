import { OrdersList } from "@/components/admin/OrdersList";
import { ORDER_VIEWS } from "@/server/admin/queries";
import { requireAdmin } from "@/server/auth";

export const metadata = { title: ORDER_VIEWS["pending-payment"].title };

export default async function Page({ searchParams }: PageProps<"/admin/orders/pending-payment">) {
  await requireAdmin("orders");
  return <OrdersList view="pending-payment" searchParams={await searchParams} />;
}
