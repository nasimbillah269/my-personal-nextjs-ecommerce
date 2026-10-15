import Link from "next/link";
import { ShieldX } from "lucide-react";
import { btnPrimary } from "@/components/admin/ui";
import { ADMIN_PERMISSIONS } from "@/lib/constants";
import { requireAdmin } from "@/server/auth";

export const metadata = { title: "No access" };

export default async function DeniedPage({ searchParams }: PageProps<"/admin/denied">) {
  const admin = await requireAdmin();
  const { need } = await searchParams;
  const section = ADMIN_PERMISSIONS.find((p) => p.key === need)?.label;

  return (
    <div className="mx-auto mt-10 max-w-md rounded-2xl border border-line bg-surface p-8 text-center">
      <span className="mx-auto grid size-16 place-items-center rounded-full bg-amber-100">
        <ShieldX className="size-8 text-amber-700" strokeWidth={1.6} />
      </span>
      <h1 className="mt-4 text-xl font-bold text-heading">No access</h1>
      <p className="mt-2 text-sm text-body">
        Your role{admin.roleName ? ` (${admin.roleName})` : ""} doesn’t include {section ? <b className="text-heading">{section}</b> : "this section"}. Ask a Super
        Admin if you need it.
      </p>
      <Link href="/admin" className={`${btnPrimary} mt-6`}>
        Back to dashboard
      </Link>
    </div>
  );
}
