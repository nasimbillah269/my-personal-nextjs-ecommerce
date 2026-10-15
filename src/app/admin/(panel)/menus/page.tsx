import Link from "next/link";
import { CheckCircle2, CircleDashed, MenuSquare, Plus, UserRound } from "lucide-react";
import { MenuRowActions } from "@/components/admin/MenuRowActions";
import { btnPrimary, Card, EmptyState, PageHeader } from "@/components/admin/ui";
import { MENU_LOCATION_HINTS, MENU_LOCATION_LABELS, MENU_LOCATIONS } from "@/lib/constants";
import { listMenus } from "@/server/admin/queries";
import { requireAdmin } from "@/server/auth";

export const metadata = { title: "Menus" };

export default async function MenusPage() {
  await requireAdmin("menus");
  const menus = await listMenus();

  const addButton = (
    <Link href="/admin/menus/new" className={btnPrimary}>
      <Plus className="size-4" /> Add menu
    </Link>
  );

  return (
    <>
      <PageHeader title="Menus" description="Header, top-bar and footer menus of the store." actions={addButton} />

      {/* Where each location stands; an empty one links straight to a new menu for it. */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {MENU_LOCATIONS.map((loc) => {
          const owner = menus.find((m) => m.location === loc && m.isActive);
          return owner ? (
            <Link
              key={loc}
              href={`/admin/menus/${owner.id}`}
              className="group rounded-2xl border border-line bg-surface p-4 transition hover:border-brand"
            >
              <p className="flex items-center gap-1.5 text-xs font-bold tracking-wide text-body uppercase">
                <CheckCircle2 className="size-3.5 text-leaf" /> {MENU_LOCATION_LABELS[loc]}
              </p>
              <p className="mt-1.5 truncate font-bold text-heading group-hover:text-brand">{owner.name}</p>
              <p className="text-xs text-body">
                {owner.items} item{owner.items === 1 ? "" : "s"}
              </p>
            </Link>
          ) : (
            <Link
              key={loc}
              href={`/admin/menus/new?location=${loc}`}
              title={MENU_LOCATION_HINTS[loc]}
              className="group rounded-2xl border-2 border-dashed border-line p-4 transition hover:border-brand hover:bg-brand-light/30"
            >
              <p className="flex items-center gap-1.5 text-xs font-bold tracking-wide text-body uppercase">
                <CircleDashed className="size-3.5" /> {MENU_LOCATION_LABELS[loc]}
              </p>
              <p className="mt-1.5 flex items-center gap-1 font-bold text-brand">
                <Plus className="size-4" /> Add menu here
              </p>
              <p className="text-xs text-body">Showing default links</p>
            </Link>
          );
        })}
      </div>

      <Card title="Menus list" bodyClassName="">
        {menus.length === 0 ? (
          <EmptyState icon={MenuSquare} title="No menus yet" text="Create a menu and choose where it appears in the store." action={addButton} />
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-soft text-left text-xs font-bold tracking-wide text-body uppercase">
                <tr>
                  <th className="w-16 px-5 py-3">S:L</th>
                  <th className="px-5 py-3">Menu name</th>
                  <th className="px-5 py-3 text-center">Location</th>
                  <th className="px-5 py-3 text-center">Items</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {menus.map((m, i) => (
                  <tr key={m.id} className="border-t border-line transition hover:bg-soft/60">
                    <td className="px-5 py-3.5 font-semibold text-body">{i + 1}</td>
                    <td className="px-5 py-3.5">
                      <Link href={`/admin/menus/${m.id}`} className="font-bold text-heading hover:text-brand">
                        {m.name}
                      </Link>
                      <p className="mt-0.5 flex items-center gap-2 text-xs text-body">
                        {m.isActive ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-leaf">
                            <CheckCircle2 className="size-3.5" /> Active
                          </span>
                        ) : (
                          <span className="font-semibold">Inactive</span>
                        )}
                        {m.creatorName && (
                          <span className="inline-flex items-center gap-1">
                            <UserRound className="size-3.5" /> {m.creatorName}
                          </span>
                        )}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {m.location ? (
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                            m.isActive ? "bg-brand-light text-brand-dark" : "bg-soft text-body"
                          }`}
                        >
                          {MENU_LOCATION_LABELS[m.location]}
                        </span>
                      ) : (
                        <span className="text-xs text-body">Not assigned</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center font-semibold text-heading">{m.items}</td>
                    <td className="px-5 py-3.5">
                      <MenuRowActions id={m.id} name={m.name} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
