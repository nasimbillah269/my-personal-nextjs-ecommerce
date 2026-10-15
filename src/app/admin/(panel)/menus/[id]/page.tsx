import { notFound } from "next/navigation";
import { getMenuForEdit } from "@/server/admin/queries";
import { requireAdmin } from "@/server/auth";
import { MenuConfigPage } from "../MenuConfigPage";

export const metadata = { title: "Menu config" };

export default async function EditMenuPage({ params }: PageProps<"/admin/menus/[id]">) {
  await requireAdmin("menus");
  const { id } = await params;
  const menu = await getMenuForEdit(Number(id));
  if (!menu) notFound();
  return <MenuConfigPage menu={menu} />;
}
