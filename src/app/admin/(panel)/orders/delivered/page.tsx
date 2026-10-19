import { OrdersList } from "@/components/admin/OrdersList";
import { ORDER_VIEWS } from "@/server/admin/queries";
import { requireAdmin } from "@/server/auth";

export const metadata = { title: ORDER_VIEWS["delivered"].title };

export default async function Page({ searchParams }: PageProps<"/admin/orders/delivered">) {
  await requireAdmin("orders");
  return <OrdersList view="delivered" searchParams={await searchParams} />;
}
