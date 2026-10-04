import { CouponManager } from "@/components/admin/CouponManager";
import { PageHeader } from "@/components/admin/ui";
import { listCoupons } from "@/server/admin/queries";
import { requireAdmin } from "@/server/auth";

export const metadata = { title: "Coupons" };

export default async function CouponsPage() {
  await requireAdmin();
  const coupons = await listCoupons();
  return (
    <>
      <PageHeader title="Coupons" description="Discount codes customers can apply in the cart or at checkout." />
      <CouponManager
        coupons={coupons.map((c) => ({
          id: c.id,
          code: c.code,
          type: c.type,
          value: c.value,
          minOrder: c.minOrder,
          usageLimit: c.usageLimit,
          usedCount: c.usedCount,
          expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
          isActive: c.isActive,
        }))}
      />
    </>
  );
}
