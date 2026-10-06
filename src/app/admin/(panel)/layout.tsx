import type { Metadata } from "next";
import { cookies } from "next/headers";
import { AdminShell } from "@/components/admin/AdminShell";
import { ADMIN_THEME_COOKIE } from "@/lib/constants";
import { getPendingOrderCount } from "@/server/admin/queries";
import { requireAdmin } from "@/server/auth";
import { getSettings } from "@/server/queries";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin" },
  robots: { index: false },
};

export default async function AdminPanelLayout({
  children,
}: LayoutProps<"/admin">) {
  const admin = await requireAdmin();
  const [pendingCount, settings, cookieStore] = await Promise.all([
    getPendingOrderCount(),
    getSettings(),
    cookies(),
  ]);
  const theme =
    cookieStore.get(ADMIN_THEME_COOKIE)?.value === "dark" ? "dark" : "light";

  return (
    <AdminShell
      admin={admin}
      pendingCount={pendingCount}
      storeName={settings.storeName}
      faviconUrl={settings.faviconUrl}
      initialTheme={theme}
    >
      {children}
    </AdminShell>
  );
}
