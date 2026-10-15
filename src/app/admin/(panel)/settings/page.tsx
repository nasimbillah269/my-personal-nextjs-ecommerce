import { BrandingForm, PasswordForm, ProfileForm, StoreSettingsForm } from "@/components/admin/SettingsForms";
import { PageHeader } from "@/components/admin/ui";
import { can, requireAdmin } from "@/server/auth";
import { getSettings } from "@/server/queries";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const admin = await requireAdmin();
  const canEditStore = can(admin, "settings");
  const settings = await getSettings();

  return (
    <>
      <PageHeader
        title="Settings"
        description={canEditStore ? "Branding, store details, delivery charges and your admin account." : "Your admin account."}
      />
      <div className={`grid gap-6 ${canEditStore ? "xl:grid-cols-[minmax(0,1fr)_380px]" : "max-w-xl"}`}>
        {/* Store-wide settings need the "settings" permission; everyone can edit their own account. */}
        {canEditStore && (
          <div className="min-w-0 space-y-6">
            <BrandingForm logoUrl={settings.logoUrl} faviconUrl={settings.faviconUrl} storeName={settings.storeName} />
            <StoreSettingsForm settings={settings} />
          </div>
        )}
        <div className="space-y-6">
          <ProfileForm name={admin.name} email={admin.email} />
          <PasswordForm />
        </div>
      </div>
    </>
  );
}
