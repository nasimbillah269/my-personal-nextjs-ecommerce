import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { MenuBuilder, type MenuRow } from "@/components/admin/MenuBuilder";
import { btnPrimary, btnSecondary, PageHeader } from "@/components/admin/ui";
import type { MenuLocation } from "@/lib/constants";
import { getMenuItemOptions, listMenus } from "@/server/admin/queries";
import { requireAdmin } from "@/server/auth";

/** Shared by /admin/menus/new and /admin/menus/[id]. */
export async function MenuConfigPage({ menu, initialLocation }: { menu: MenuRow | null; initialLocation?: MenuLocation }) {
  await requireAdmin("menus");
  const [options, all] = await Promise.all([getMenuItemOptions(), listMenus()]);
  const locationOwners: Partial<Record<MenuLocation, { id: number; name: string }>> = {};
  for (const m of all) if (m.location && m.isActive) locationOwners[m.location] = { id: m.id, name: m.name };

  return (
    <>
      <PageHeader
        title={menu ? `Menu config · ${menu.name}` : "Add menu"}
        description="Add items on the left, arrange them on the right, then save."
        actions={
          <>
            <Link href="/admin/menus" className={btnSecondary}>
              <ArrowLeft className="size-4" /> Back
            </Link>
            {menu && (
              <Link href="/admin/menus/new" className={btnPrimary}>
                <Plus className="size-4" /> Add menu
              </Link>
            )}
          </>
        }
      />
      {/* key: a fresh editor per menu, so navigating between menus never carries a draft over */}
      <MenuBuilder key={menu?.id ?? `new-${initialLocation ?? ""}`} menu={menu} options={options} locationOwners={locationOwners} initialLocation={initialLocation} />
    </>
  );
}
