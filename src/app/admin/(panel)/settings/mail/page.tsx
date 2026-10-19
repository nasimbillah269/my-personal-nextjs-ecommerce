import Link from "next/link";
import { RefreshButton } from "@/components/admin/controls";
import { MailSettingsForm } from "@/components/admin/MailSettingsForm";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/server/auth";
import { getMailSettings } from "@/server/mail";

export const metadata = { title: "Mail Setting" };

export default async function MailSettingPage() {
  await requireAdmin("settings");
  const settings = await getMailSettings();

  return (
    <>
      <PageHeader
        title="Mail Setting"
        description={
          <span className="flex items-center gap-2">
            <Link href="/admin" className="font-semibold text-brand hover:underline">
              Dashboard
            </Link>
            <span>›</span> Mail Setting
          </span>
        }
        actions={<RefreshButton />}
      />
      <MailSettingsForm settings={settings} />
    </>
  );
}
