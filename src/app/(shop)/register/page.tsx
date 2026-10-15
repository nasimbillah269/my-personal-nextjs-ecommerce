import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/account/AuthForms";
import { AuthShell } from "@/components/account/AuthShell";
import { getCustomer, safeNext } from "@/server/customer-auth";

export const metadata: Metadata = { title: "Create account — Ultimate Organic Life", robots: { index: false } };

export default async function RegisterPage({ searchParams }: PageProps<"/register">) {
  const { next } = await searchParams;
  const target = typeof next === "string" ? safeNext(next) : undefined;
  if (await getCustomer()) redirect(target ?? "/account");

  return (
    <AuthShell title="Create your account" subtitle="It takes less than a minute." crumb="Sign up">
      <RegisterForm next={target} />
    </AuthShell>
  );
}
