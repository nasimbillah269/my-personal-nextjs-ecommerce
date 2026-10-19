import { OrdersList } from "@/components/admin/OrdersList";
import { requireAdmin } from "@/server/auth";

export const metadata = { title: "Order List" };

export default async function OrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  await requireAdmin("orders");
  return <OrdersList searchParams={await searchParams} />;
}
