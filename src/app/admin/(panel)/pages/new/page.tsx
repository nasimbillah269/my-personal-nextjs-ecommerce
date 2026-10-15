import { PageForm } from "@/components/admin/PageForm";
import { requireAdmin } from "@/server/auth";

export const metadata = { title: "New page" };

export default async function NewPagePage() {
  await requireAdmin("pages");
  return (
    <PageForm
      initial={{
        title: "",
        slug: "",
        shortDescription: "",
        content: "",
        image: null,
        banner: null,
        template: "default",
        isActive: true,
        isFeatured: false,
        publishedAt: "",
        metaTitle: "",
        metaDescription: "",
        metaKeywords: "",
        sortOrder: 0,
      }}
    />
  );
}
