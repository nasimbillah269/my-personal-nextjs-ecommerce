import { OrdersList } from "@/components/admin/OrdersList";
import { ORDER_VIEWS } from "@/server/admin/queries";
import { requireAdmin } from "@/server/auth";

export const metadata = { title: ORDER_VIEWS["pre-order"].title };

export default async function Page({ searchParams }: PageProps<"/admin/orders/pre-order">) {
  await requireAdmin("orders");
  return <OrdersList view="pre-order" searchParams={await searchParams} />;
}
