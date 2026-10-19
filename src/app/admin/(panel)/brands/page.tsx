import { LogoManager } from "@/components/admin/LogoManager";
import { PageHeader } from "@/components/admin/ui";
import { listBrands } from "@/server/admin/queries";
import { requireAdmin } from "@/server/auth";

export const metadata = { title: "Brands" };

export default async function BrandsPage() {
  await requireAdmin("brands");
  const brands = await listBrands();
  return (
    <>
      <PageHeader title="Brands" description="Product brands. Saved brands are suggested in the product form’s Brand field." />
      <LogoManager kind="brand" rows={brands} />
    </>
  );
}
