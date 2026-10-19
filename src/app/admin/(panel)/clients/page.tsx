import { LogoManager } from "@/components/admin/LogoManager";
import { PageHeader } from "@/components/admin/ui";
import { listClients } from "@/server/admin/queries";
import { requireAdmin } from "@/server/auth";

export const metadata = { title: "Clients" };

export default async function ClientsPage() {
  await requireAdmin("clients");
  const clients = await listClients();
  return (
    <>
      <PageHeader title="Clients" description="Companies you work with; their logos can be shown in the store." />
      <LogoManager kind="client" rows={clients} />
    </>
  );
}
