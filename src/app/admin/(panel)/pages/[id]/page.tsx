import { notFound } from "next/navigation";
import { PageForm } from "@/components/admin/PageForm";
import { getPageForEdit } from "@/server/admin/queries";
import { requireAdmin } from "@/server/auth";

export const metadata = { title: "Edit page" };

/** Value for <input type="datetime-local">, in Dhaka time (UTC+6, no DST). */
const toDhakaInput = (d: Date | null) => (d ? new Date(d.getTime() + 6 * 3_600_000).toISOString().slice(0, 16) : "");

export default async function EditPagePage({ params }: PageProps<"/admin/pages/[id]">) {
  await requireAdmin("pages");
  const { id } = await params;
  const p = await getPageForEdit(Number(id));
  if (!p) notFound();

  return (
    <PageForm
      initial={{
        id: p.id,
        title: p.title,
        slug: p.slug,
        shortDescription: p.shortDescription,
        content: p.content,
        image: p.image,
        banner: p.banner,
        template: p.template,
        isActive: p.isActive,
        isFeatured: p.isFeatured,
        publishedAt: toDhakaInput(p.publishedAt),
        metaTitle: p.metaTitle,
        metaDescription: p.metaDescription,
        metaKeywords: p.metaKeywords,
        sortOrder: p.sortOrder,
      }}
    />
  );
}
