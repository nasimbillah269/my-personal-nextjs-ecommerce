import { PostTaxonomyManager } from "@/components/admin/PostTaxonomyManager";
import { PageHeader } from "@/components/admin/ui";
import { listPostCategories } from "@/server/admin/queries";
import { requireAdmin } from "@/server/auth";

export const metadata = { title: "Post categories" };

export default async function PostCategoriesPage() {
  await requireAdmin("posts");
  const categories = await listPostCategories();
  return (
    <>
      <PageHeader title="Post categories" description="Group blog posts by topic so readers can browse them." />
      <PostTaxonomyManager type="category" rows={categories} />
    </>
  );
}
