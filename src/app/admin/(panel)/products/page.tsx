import Link from "next/link";
import { Package, Plus } from "lucide-react";
import { ListToolbar } from "@/components/admin/controls";
import { ActiveSwitch, ProductRowActions } from "@/components/admin/ProductRowActions";
import { btnPrimary, Card, EmptyState, formatTaka, PageHeader, Pagination, Thumb } from "@/components/admin/ui";
import { listProducts, PAGE_SIZE } from "@/server/admin/queries";
import { requireAdmin } from "@/server/auth";
import { getCategories } from "@/server/queries";

export const metadata = { title: "Products" };

export default async function ProductsAdminPage({ searchParams }: PageProps<"/admin/products">) {
  await requireAdmin();
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === "string" && sp[k] ? (sp[k] as string) : undefined);
  const filters = { q: str("q"), category: str("category"), status: str("status"), page: Math.max(1, Number(sp.page) || 1) };
  const [{ rows, total }, categories] = await Promise.all([listProducts(filters), getCategories()]);

  const addButton = (
    <Link href="/admin/products/new" className={btnPrimary}>
      <Plus className="size-4" /> Add product
    </Link>
  );

  return (
    <>
      <PageHeader title="Products" description={`${total} product${total === 1 ? "" : "s"} in your catalog.`} actions={addButton} />

      <Card bodyClassName="">
        <ListToolbar
          placeholder="Search products…"
          filters={[
            { name: "category", label: "All categories", options: categories.map((c) => ({ value: c.slug, label: c.name })) },
            {
              name: "status",
              label: "Any status",
              options: [
                { value: "active", label: "Active" },
                { value: "hidden", label: "Hidden" },
                { value: "low", label: "Low stock (≤ 10)" },
              ],
            },
          ]}
        />

        {rows.length === 0 ? (
          <EmptyState icon={Package} title="No products found" text="Try another search, or add your first product." action={addButton} />
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[880px] text-sm">
              <thead className="bg-soft text-left text-xs font-bold tracking-wide text-body uppercase">
                <tr>
                  <th className="px-5 py-3">Product</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3 text-right">Price</th>
                  <th className="px-5 py-3 text-right">Stock</th>
                  <th className="px-5 py-3">Featured</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id} className="border-t border-line transition hover:bg-soft/60">
                    <td className="px-5 py-3">
                      <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3">
                        <Thumb emoji={p.emoji} tint={p.tint} image={p.image} name={p.name} />
                        <span className="min-w-0">
                          <span className="line-clamp-1 font-bold text-heading hover:text-brand">{p.name}</span>
                          <span className="text-xs text-body">
                            {p.variantCount} option{p.variantCount === 1 ? "" : "s"} · /{p.slug}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-heading">{p.categoryName}</td>
                    <td className="px-5 py-3 text-right tabular-nums">
                      <span className="font-bold text-heading">{formatTaka(p.price)}</span>
                      {p.oldPrice && <span className="block text-xs text-body line-through">{formatTaka(p.oldPrice)}</span>}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold tabular-nums ${
                          p.stock === 0 ? "bg-rose-100 text-rose-700" : p.stock <= 10 ? "bg-amber-100 text-amber-700" : "bg-soft text-heading"
                        }`}
                      >
                        {p.stock === 0 ? "Out of stock" : p.stock.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1">
                        {p.isPopular && <span className="rounded-md bg-brand-light px-2 py-0.5 text-[11px] font-bold text-brand-dark">Popular</span>}
                        {p.isDailyBest && <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700">Daily best</span>}
                        {!p.isPopular && !p.isDailyBest && <span className="text-xs text-body">—</span>}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <ActiveSwitch id={p.id} isActive={p.isActive} />
                    </td>
                    <td className="px-5 py-3">
                      <ProductRowActions id={p.id} slug={p.slug} name={p.name} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination
          page={filters.page}
          total={total}
          pageSize={PAGE_SIZE}
          basePath="/admin/products"
          params={{ q: filters.q, category: filters.category, status: filters.status }}
        />
      </Card>
    </>
  );
}
