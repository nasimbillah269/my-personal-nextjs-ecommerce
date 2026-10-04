import { ProductForm } from "@/components/admin/ProductForm";
import { requireAdmin } from "@/server/auth";
import { getCategories, getSettings } from "@/server/queries";

export const metadata = { title: "Add product" };

export default async function NewProductPage() {
  await requireAdmin();
  const [categories, settings] = await Promise.all([getCategories(), getSettings()]);

  return (
    <ProductForm
      categories={categories}
      initial={{
        name: "",
        slug: "",
        categoryId: "",
        summary: "",
        description: "## প্রোডাক্ট পরিচিতি\n\n## মূল উপকারিতা (Key Benefits)\n- \n\n## ব্যবহার পদ্ধতি\n- ",
        stock: 0,
        image: null,
        imageCredit: "",
        imageCreditUrl: "",
        emoji: "🌿",
        tint: "#e6f4ea",
        tags: "",
        brand: settings.storeName,
        origin: "Bangladesh",
        sortOrder: 0,
        isActive: true,
        isPopular: false,
        isDailyBest: false,
        variants: [],
      }}
    />
  );
}
