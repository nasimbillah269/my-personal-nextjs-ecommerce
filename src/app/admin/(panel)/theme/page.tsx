import Link from "next/link";
import { ArrowLeft, Palette } from "lucide-react";
import { btnSecondary, Card, EmptyState, PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/server/auth";

export const metadata = { title: "Theme Setting" };

export default async function ThemeSettingPage() {
  await requireAdmin();

  return (
    <>
      <PageHeader
        title="Theme Setting"
        description={
          <span className="flex items-center gap-2">
            <Link href="/admin" className="font-semibold text-brand hover:underline">
              Dashboard
            </Link>
            <span>›</span> Theme Setting
          </span>
        }
      />
      <Card>
        <EmptyState
          icon={Palette}
          title="Coming soon"
          text="Theme customization is on its way. You'll be able to change the store's colors and layout from here."
          action={
            <Link href="/admin" className={btnSecondary}>
              <ArrowLeft className="size-4" /> Back to dashboard
            </Link>
          }
        />
      </Card>
    </>
  );
}
