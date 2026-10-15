import { MenuConfigPage } from "../MenuConfigPage";
import { MENU_LOCATIONS, type MenuLocation } from "@/lib/constants";

export const metadata = { title: "Add menu" };

export default async function NewMenuPage({ searchParams }: PageProps<"/admin/menus/new">) {
  const { location } = await searchParams;
  const initial = MENU_LOCATIONS.includes(location as MenuLocation) ? (location as MenuLocation) : undefined;
  return <MenuConfigPage menu={null} initialLocation={initial} />;
}
