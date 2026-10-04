import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { LoginForm } from "@/components/admin/LoginForm";
import { Logo } from "@/components/Logo";
import { getAdmin } from "@/server/auth";
import { getSettings } from "@/server/queries";

export const metadata: Metadata = { title: "Admin Login", robots: { index: false } };

export default async function AdminLoginPage({ searchParams }: PageProps<"/admin/login">) {
  if (await getAdmin()) redirect("/admin");
  const [{ next }, settings] = await Promise.all([searchParams, getSettings()]);

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section
        className="relative hidden flex-col justify-between overflow-hidden p-12 text-white lg:flex"
        style={{ background: "linear-gradient(150deg,#0d838a 0%,#13a2a8 45%,#1f8f3d 100%)" }}
      >
        <span className="w-fit rounded-2xl bg-white px-5 py-3">
          <Logo src={settings.logoUrl} alt={settings.storeName} />
        </span>
        <div>
          <h1 className="text-4xl leading-tight font-bold">
            Manage your store
            <br />
            in one place.
          </h1>
          <p className="mt-4 max-w-md text-white/80">
            Orders, products, stock, coupons and customers — everything for Ultimate Organic Life, updated in real time.
          </p>
        </div>
        <p className="flex items-center gap-2 text-sm text-white/70">
          <ShieldCheck className="size-4" /> Secure admin access
        </p>
        <span className="pointer-events-none absolute -right-24 -bottom-24 size-96 rounded-full bg-white/10" aria-hidden="true" />
        <span className="pointer-events-none absolute top-20 -right-10 size-40 rounded-full bg-white/10" aria-hidden="true" />
      </section>

      <section className="flex items-center justify-center bg-soft px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-line bg-white p-8 shadow-xl sm:p-10">
          <div className="mb-8 lg:hidden">
            <Logo className="items-start" src={settings.logoUrl} alt={settings.storeName} />
          </div>
          <h2 className="text-2xl font-bold text-heading">Welcome back</h2>
          <p className="mt-1 mb-8 text-sm text-body">Sign in to the admin panel to continue.</p>
          <LoginForm next={typeof next === "string" ? next : undefined} />
        </div>
      </section>
    </main>
  );
}
