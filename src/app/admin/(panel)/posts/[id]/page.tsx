import { notFound } from "next/navigation";
import { PostForm } from "@/components/admin/PostForm";
import { getPostForEdit, listPostCategories, listTags } from "@/server/admin/queries";
import { requireAdmin } from "@/server/auth";

export const metadata = { title: "Edit post" };

/** Value for <input type="datetime-local">, in Dhaka time (UTC+6, no DST). */
const toDhakaInput = (d: Date | null) => (d ? new Date(d.getTime() + 6 * 3_600_000).toISOString().slice(0, 16) : "");

export default async function EditPostPage({ params }: PageProps<"/admin/posts/[id]">) {
  await requireAdmin("posts");
  const { id } = await params;
  const [data, categories, tags] = await Promise.all([getPostForEdit(Number(id)), listPostCategories(), listTags()]);
  if (!data) notFound();
  const { post: p } = data;

  return (
    <PostForm
      categories={categories}
      allTags={tags.toSorted((a, b) => b.postCount - a.postCount).map((t) => t.name)}
      initial={{
        id: p.id,
        title: p.title,
        slug: p.slug,
        excerpt: p.excerpt,
        content: p.content,
        coverImage: p.coverImage,
        categoryId: p.categoryId ?? "",
        tags: data.tags,
        status: p.status,
        publishedAt: toDhakaInput(p.publishedAt),
        allowComments: p.allowComments,
      }}
    />
  );
}
