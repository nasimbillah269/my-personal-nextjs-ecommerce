import { AdminUsersManager } from "@/components/admin/AdminUsersManager";
import { PageHeader } from "@/components/admin/ui";
import { listAdmins, listRoles } from "@/server/admin/queries";
import { requireAdmin } from "@/server/auth";

export const metadata = { title: "Administrator users" };

export default async function AdminUsersPage() {
  const me = await requireAdmin("admins");
  const [admins, roles] = await Promise.all([listAdmins(), listRoles()]);
  return (
    <>
      <PageHeader
        title="Administrator users"
        description={`${admins.length} admin${admins.length === 1 ? "" : "s"} can log in to this panel. Their role decides what they can open.`}
      />
      <AdminUsersManager admins={admins} roles={roles.map((r) => ({ id: r.id, name: r.name }))} meId={me.id} />
    </>
  );
}
