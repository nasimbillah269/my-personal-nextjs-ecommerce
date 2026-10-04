import { CategoryManager } from "@/components/admin/CategoryManager";
import { PageHeader } from "@/components/admin/ui";
import { listCategoriesWithCounts } from "@/server/admin/queries";
import { requireAdmin } from "@/server/auth";

export const metadata = { title: "Categories" };

export default async function CategoriesPage() {
  await requireAdmin();
  const categories = await listCategoriesWithCounts();
  return (
    <>
      <PageHeader title="Categories" description="Group products so customers can browse and filter the store." />
      <CategoryManager categories={categories} />
    </>
  );
}
