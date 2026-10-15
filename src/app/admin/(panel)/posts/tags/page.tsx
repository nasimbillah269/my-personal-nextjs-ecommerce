import { PostTaxonomyManager } from "@/components/admin/PostTaxonomyManager";
import { PageHeader } from "@/components/admin/ui";
import { listTags } from "@/server/admin/queries";
import { requireAdmin } from "@/server/auth";

export const metadata = { title: "Tags" };

export default async function TagsPage() {
  await requireAdmin("posts");
  const tags = await listTags();
  return (
    <>
      <PageHeader title="Tags" description="Keywords that link related posts together." />
      <PostTaxonomyManager type="tag" rows={tags} />
    </>
  );
}
