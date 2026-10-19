import Link from "next/link";
import { RefreshButton } from "@/components/admin/controls";
import { SmsSettingsForm } from "@/components/admin/SmsSettingsForm";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/server/auth";
import { getSmsSettings } from "@/server/sms";

export const metadata = { title: "SMS Setting" };

export default async function SmsSettingPage() {
  await requireAdmin("settings");
  const settings = await getSmsSettings();

  return (
    <>
      <PageHeader
        title="SMS Setting"
        description={
          <span className="flex items-center gap-2">
            <Link href="/admin" className="font-semibold text-brand hover:underline">
              Dashboard
            </Link>
            <span>›</span> SMS Setting
          </span>
        }
        actions={<RefreshButton />}
      />
      <SmsSettingsForm settings={settings} />
    </>
  );
}
