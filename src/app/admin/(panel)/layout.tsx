import type { Metadata } from "next";
import { cookies } from "next/headers";
import { AdminShell } from "@/components/admin/AdminShell";
import { ADMIN_THEME_COOKIE } from "@/lib/constants";
import { getPendingCommentCount, getPendingOrderCount } from "@/server/admin/queries";
import { can, requireAdmin } from "@/server/auth";
import { getSettings } from "@/server/queries";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin" },
  robots: { index: false },
};

export default async function AdminPanelLayout({
  children,
}: LayoutProps<"/admin">) {
  const admin = await requireAdmin();
  // Badge counts only for sections this admin can open.
  const [pendingCount, pendingComments, settings, cookieStore] = await Promise.all([
    can(admin, "orders") ? getPendingOrderCount() : 0,
    can(admin, "posts") ? getPendingCommentCount() : 0,
    getSettings(),
    cookies(),
  ]);
  const theme =
    cookieStore.get(ADMIN_THEME_COOKIE)?.value === "dark" ? "dark" : "light";

  return (
    <AdminShell
      admin={admin}
      pendingCount={pendingCount}
      pendingComments={pendingComments}
      permissions={admin.permissions}
      storeName={settings.storeName}
      faviconUrl={settings.faviconUrl}
      initialTheme={theme}
    >
      {children}
    </AdminShell>
  );
}
