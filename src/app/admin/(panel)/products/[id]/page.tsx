import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/ProductForm";
import { getProductForEdit } from "@/server/admin/queries";
import { requireAdmin } from "@/server/auth";
import { getCategories } from "@/server/queries";

export const metadata = { title: "Edit product" };

export default async function EditProductPage({ params }: PageProps<"/admin/products/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const [data, categories] = await Promise.all([getProductForEdit(Number(id)), getCategories()]);
  if (!data) notFound();
  const { product: p, variants } = data;

  return (
    <ProductForm
      categories={categories}
      initial={{
        id: p.id,
        name: p.name,
        slug: p.slug,
        categoryId: p.categoryId,
        summary: p.summary,
        description: p.description,
        stock: p.stock,
        image: p.image,
        imageCredit: p.imageCredit ?? "",
        imageCreditUrl: p.imageCreditUrl ?? "",
        emoji: p.emoji,
        tint: p.tint,
        tags: p.tags,
        brand: p.brand,
        origin: p.origin,
        sortOrder: p.sortOrder,
        isActive: p.isActive,
        isPopular: p.isPopular,
        isDailyBest: p.isDailyBest,
        variants: variants.map((v) => ({ label: v.label, price: v.price, oldPrice: v.oldPrice })),
      }}
    />
  );
}
