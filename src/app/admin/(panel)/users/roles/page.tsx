import { RolesManager } from "@/components/admin/RolesManager";
import { PageHeader } from "@/components/admin/ui";
import { listRoles } from "@/server/admin/queries";
import { requireAdmin } from "@/server/auth";

export const metadata = { title: "Roles" };

export default async function RolesPage() {
  await requireAdmin("admins");
  const roles = await listRoles();
  return (
    <>
      <PageHeader title="Roles" description="Group permissions into roles, then give each admin a role." />
      <RolesManager roles={roles} />
    </>
  );
}
