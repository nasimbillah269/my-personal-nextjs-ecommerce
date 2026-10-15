import { PostForm } from "@/components/admin/PostForm";
import { listPostCategories, listTags } from "@/server/admin/queries";
import { requireAdmin } from "@/server/auth";

export const metadata = { title: "New post" };

export default async function NewPostPage() {
  await requireAdmin("posts");
  const [categories, tags] = await Promise.all([listPostCategories(), listTags()]);

  return (
    <PostForm
      categories={categories}
      allTags={tags.toSorted((a, b) => b.postCount - a.postCount).map((t) => t.name)}
      initial={{
        title: "",
        slug: "",
        excerpt: "",
        content: "",
        coverImage: null,
        categoryId: "",
        tags: [],
        status: "draft",
        publishedAt: "",
        allowComments: true,
      }}
    />
  );
}
