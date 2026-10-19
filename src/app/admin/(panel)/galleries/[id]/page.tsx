import { notFound } from "next/navigation";
import { GalleryForm } from "@/components/admin/GalleryForm";
import { getGalleryForEdit } from "@/server/admin/queries";
import { requireAdmin } from "@/server/auth";

export const metadata = { title: "Gallery edit" };

export default async function EditGalleryPage({ params }: PageProps<"/admin/galleries/[id]">) {
  await requireAdmin("galleries");
  const { id } = await params;
  const g = await getGalleryForEdit(Number(id));
  if (!g) notFound();

  return (
    <GalleryForm
      // Remount when switching galleries so uncontrolled fields pick up the new values.
      key={g.id}
      initial={{
        id: g.id,
        name: g.name,
        location: g.location,
        description: g.description ?? "",
        featuredImage: g.featuredImage,
        isActive: g.isActive,
        images: g.images,
      }}
    />
  );
}
