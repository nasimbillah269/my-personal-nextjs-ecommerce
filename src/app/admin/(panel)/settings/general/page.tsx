import Link from "next/link";
import { ShippingSettingsForm } from "@/components/admin/SettingsForms";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/server/auth";
import { getSettings } from "@/server/queries";

export const metadata = { title: "General Setting" };

export default async function GeneralSettingPage() {
  await requireAdmin("settings");
  const settings = await getSettings();

  return (
    <>
      <PageHeader
        title="General Setting"
        description={
          <span className="flex items-center gap-2">
            <Link href="/admin" className="font-semibold text-brand hover:underline">
              Dashboard
            </Link>
            <span>›</span> General Setting
          </span>
        }
      />
      <div className="max-w-3xl">
        <ShippingSettingsForm settings={settings} />
      </div>
    </>
  );
}
