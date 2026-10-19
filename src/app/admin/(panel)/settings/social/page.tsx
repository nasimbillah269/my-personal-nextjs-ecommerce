import Link from "next/link";
import { RefreshButton } from "@/components/admin/controls";
import { SocialSettingsForm } from "@/components/admin/SocialSettingsForm";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/server/auth";
import { getSocialAppSettings, getSocialLinks } from "@/server/social-settings";

export const metadata = { title: "Social Setting" };

export default async function SocialSettingPage() {
  await requireAdmin("settings");
  const [links, apps] = await Promise.all([getSocialLinks(), getSocialAppSettings()]);

  return (
    <>
      <PageHeader
        title="Social Setting"
        description={
          <span className="flex items-center gap-2">
            <Link href="/admin" className="font-semibold text-brand hover:underline">
              Dashboard
            </Link>
            <span>›</span> Social Setting
          </span>
        }
        actions={<RefreshButton />}
      />
      <SocialSettingsForm links={links} apps={apps} />
    </>
  );
}
