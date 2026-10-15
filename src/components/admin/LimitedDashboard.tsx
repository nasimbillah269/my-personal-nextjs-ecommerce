import Link from "next/link";
import { Sparkles } from "lucide-react";
import { ADMIN_PERMISSIONS } from "@/lib/constants";
import type { AdminUser } from "@/server/auth";
import { Card, PageHeader } from "./ui";

/** Where each permission's section starts, for the quick links. */
export const sectionHref: Record<string, string> = {
  orders: "/admin/orders",
  products: "/admin/products",
  catalog: "/admin/categories",
  posts: "/admin/posts",
  pages: "/admin/pages",
  menus: "/admin/menus",
  sliders: "/admin/sliders",
  customers: "/admin/customers",
  subscribers: "/admin/users/subscribers",
  admins: "/admin/users/admins",
  settings: "/admin/settings",
};

/** Dashboard for admins whose role can't see sales figures. */
export function LimitedDashboard({ admin }: { admin: AdminUser }) {
  const allowed = ADMIN_PERMISSIONS.filter((p) => admin.permissions.includes(p.key));
  return (
    <>
      <PageHeader title={`Welcome, ${admin.name.split(/\s+/)[0]}`} description={admin.roleName ? `Signed in as ${admin.roleName}.` : "Your account has no role yet."} />
      <Card title="Your sections">
        {allowed.length ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {allowed.map((p) => (
              <Link key={p.key} href={sectionHref[p.key]} className="rounded-xl border border-line p-4 transition hover:border-brand hover:bg-brand-light/30">
                <p className="font-bold text-heading">{p.label}</p>
                <p className="mt-0.5 text-xs text-body">{p.hint}</p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="flex items-center gap-2 text-sm text-body">
            <Sparkles className="size-4 text-brand" /> No sections are assigned to your role yet. Ask a Super Admin to give you access.
          </p>
        )}
      </Card>
    </>
  );
}
