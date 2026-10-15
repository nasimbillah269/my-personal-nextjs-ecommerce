import { SliderManager } from "@/components/admin/SliderManager";
import { PageHeader } from "@/components/admin/ui";
import { listSliders } from "@/server/admin/queries";
import { requireAdmin } from "@/server/auth";

export const metadata = { title: "Sliders" };

export default async function SlidersPage() {
  await requireAdmin("sliders");
  const sliders = await listSliders();
  return (
    <>
      <PageHeader title="Sliders" description="Banner images shown in the home page hero slider." />
      <SliderManager sliders={sliders} />
    </>
  );
}
