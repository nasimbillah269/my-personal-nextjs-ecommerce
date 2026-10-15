import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { AccountNav } from "@/components/account/AccountNav";
import { container } from "@/lib/ui";
import { requireCustomer } from "@/server/customer-auth";

export const metadata: Metadata = { title: "My account — Ultimate Organic Life", robots: { index: false } };

export default async function AccountLayout({ children }: LayoutProps<"/account">) {
  const me = await requireCustomer();
  const initials = me.name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <main className={`${container} flex-1 pt-4 pb-12 lg:pt-6`}>
      <nav aria-label="Breadcrumb" className="mb-6 text-xs">
        <Link href="/" className="font-semibold text-brand hover:underline">
          Home
        </Link>
        <ChevronRight className="mx-1.5 inline size-3 text-body" />
        <span className="text-body">My account</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[270px_minmax(0,1fr)] lg:gap-8">
        <aside className="space-y-4 self-start lg:sticky lg:top-6">
          <div className="flex items-center gap-3 rounded-2xl bg-linear-to-br from-brand to-brand-dark p-5 text-white">
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-white/20 text-lg font-bold ring-2 ring-white/30">{initials || "?"}</span>
            <span className="min-w-0">
              <span className="block truncate font-bold">{me.name}</span>
              <span className="block truncate text-sm text-white/80">{me.phone}</span>
            </span>
          </div>
          <AccountNav />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </main>
  );
}
