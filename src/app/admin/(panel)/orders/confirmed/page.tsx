import { OrdersList } from "@/components/admin/OrdersList";
import { ORDER_VIEWS } from "@/server/admin/queries";
import { requireAdmin } from "@/server/auth";

export const metadata = { title: ORDER_VIEWS["confirmed"].title };

export default async function Page({ searchParams }: PageProps<"/admin/orders/confirmed">) {
  await requireAdmin("orders");
  return <OrdersList view="confirmed" searchParams={await searchParams} />;
}
