import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/account/AuthForms";
import { AuthShell } from "@/components/account/AuthShell";
import { getCustomer, safeNext } from "@/server/customer-auth";

export const metadata: Metadata = { title: "Log in — Ultimate Organic Life", robots: { index: false } };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  const target = typeof next === "string" ? safeNext(next) : undefined;
  if (await getCustomer()) redirect(target ?? "/account");

  return (
    <AuthShell title="Welcome back 👋" subtitle="Log in with your mobile number or email." crumb="Log in">
      <LoginForm next={target} />
    </AuthShell>
  );
}
