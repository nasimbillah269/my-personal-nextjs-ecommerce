import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { getPendingOrderCount } from "@/server/admin/queries";
import { requireAdmin } from "@/server/auth";
import { getSettings } from "@/server/queries";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin" },
  robots: { index: false },
};

export default async function AdminPanelLayout({ children }: LayoutProps<"/admin">) {
  const admin = await requireAdmin();
  const [pendingCount, settings] = await Promise.all([getPendingOrderCount(), getSettings()]);

  return (
    <AdminShell admin={admin} pendingCount={pendingCount} storeName={settings.storeName} faviconUrl={settings.faviconUrl}>
      {children}
    </AdminShell>
  );
}
