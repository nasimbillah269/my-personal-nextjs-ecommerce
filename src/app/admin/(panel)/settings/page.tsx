import { BrandingForm, PasswordForm, ProfileForm, StoreSettingsForm } from "@/components/admin/SettingsForms";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/server/auth";
import { getSettings } from "@/server/queries";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const admin = await requireAdmin();
  const settings = await getSettings();

  return (
    <>
      <PageHeader title="Settings" description="Branding, store details, delivery charges and your admin account." />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-6">
          <BrandingForm logoUrl={settings.logoUrl} faviconUrl={settings.faviconUrl} storeName={settings.storeName} />
          <StoreSettingsForm settings={settings} />
        </div>
        <div className="space-y-6">
          <ProfileForm name={admin.name} email={admin.email} />
          <PasswordForm />
        </div>
      </div>
    </>
  );
}
