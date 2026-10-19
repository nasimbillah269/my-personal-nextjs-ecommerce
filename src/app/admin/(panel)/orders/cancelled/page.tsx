import { OrdersList } from "@/components/admin/OrdersList";
import { ORDER_VIEWS } from "@/server/admin/queries";
import { requireAdmin } from "@/server/auth";

export const metadata = { title: ORDER_VIEWS["cancelled"].title };

export default async function Page({ searchParams }: PageProps<"/admin/orders/cancelled">) {
  await requireAdmin("orders");
  return <OrdersList view="cancelled" searchParams={await searchParams} />;
}
