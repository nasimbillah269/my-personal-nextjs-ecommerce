import { AccountCard } from "@/components/account/AccountParts";
import { PasswordForm, ProfileForm } from "@/components/account/ProfileForms";
import { requireCustomer } from "@/server/customer-auth";

export default async function AccountProfilePage() {
  const me = await requireCustomer("/account/profile");
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-heading">Profile & password</h1>
      <AccountCard title="Personal details & address">
        <ProfileForm initial={me} />
      </AccountCard>
      <AccountCard title="Change password">
        <PasswordForm />
      </AccountCard>
    </div>
  );
}
