import Image from "next/image";
import Link from "next/link";
import { Check, Images, Plus, User } from "lucide-react";
import { ListToolbar, RefreshButton } from "@/components/admin/controls";
import { GalleryActiveSwitch, GalleryRowActions } from "@/components/admin/GalleryRowActions";
import { btnPrimary, Card, EmptyState, PageHeader, Pagination } from "@/components/admin/ui";
import { GALLERY_LOCATION_LABELS } from "@/lib/constants";
import { listGalleries, PAGE_SIZE } from "@/server/admin/queries";
import { requireAdmin } from "@/server/auth";

export const metadata = { title: "Galleries" };

export default async function GalleriesAdminPage({ searchParams }: PageProps<"/admin/galleries">) {
  await requireAdmin("galleries");
  const sp = await searchParams;
  const q = typeof sp.q === "string" && sp.q ? sp.q : undefined;
  const page = Math.max(1, Number(sp.page) || 1);
  const { rows, total } = await listGalleries({ q, page });

  const addButton = (
    <Link href="/admin/galleries/new" className={btnPrimary}>
      <Plus className="size-4" /> Add Gallery
    </Link>
  );

  return (
    <>
      <PageHeader
        title="Galleries List"
        description="Photo galleries such as client logos and certifications."
        actions={
          <>
            {addButton}
            <RefreshButton />
          </>
        }
      />

      <Card title="Galleries List" bodyClassName="">
        <ListToolbar placeholder="Search galleries…" />

        {rows.length === 0 ? (
          <EmptyState icon={Images} title="No galleries found" text="Try another search, or add your first gallery." action={addButton} />
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-soft text-left text-xs font-bold tracking-wide text-body uppercase">
                <tr>
                  <th className="w-16 px-5 py-3">S:L</th>
                  <th className="px-5 py-3">Gallery name</th>
                  <th className="px-5 py-3">Location</th>
                  <th className="px-5 py-3 text-center">Items</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((g, i) => (
                  <tr key={g.id} className="border-t border-line transition hover:bg-soft/60">
                    <td className="px-5 py-3 text-body">{(page - 1) * PAGE_SIZE + i + 1}</td>
                    <td className="px-5 py-3">
                      <Link href={`/admin/galleries/${g.id}`} className="flex items-center gap-3">
                        <span className="relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-lg border border-line bg-soft">
                          {g.featuredImage ? (
                            <Image src={g.featuredImage} alt="" fill sizes="44px" unoptimized className="object-cover" />
                          ) : (
                            <Images className="size-5 text-body/60" />
                          )}
                        </span>
                        <span className="min-w-0">
                          <span className="line-clamp-1 font-bold text-heading hover:text-brand">{g.name}</span>
                          <span className="flex items-center gap-1 text-xs text-body">
                            <Check className={`size-3.5 ${g.isActive ? "text-leaf" : "text-body/40"}`} />
                            <User className="size-3" />
                            {g.creatorName ?? "—"}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-body">{g.location ? GALLERY_LOCATION_LABELS[g.location] : "—"}</td>
                    <td className="px-5 py-3 text-center text-body">({g.imageCount}) Images</td>
                    <td className="px-5 py-3">
                      <GalleryActiveSwitch id={g.id} isActive={g.isActive} />
                    </td>
                    <td className="px-5 py-3">
                      <GalleryRowActions id={g.id} name={g.name} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} total={total} pageSize={PAGE_SIZE} basePath="/admin/galleries" params={{ q }} />
      </Card>
    </>
  );
}
