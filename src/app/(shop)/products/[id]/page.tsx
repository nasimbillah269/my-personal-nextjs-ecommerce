import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { ProductGallery, ProductInfo, ProductTabs, ShareButtons } from "@/components/ProductDetail";
import { Reveal } from "@/components/Reveal";
import { container } from "@/lib/ui";
import { getProductPage, getRelatedProducts, getSettings } from "@/server/queries";

export async function generateMetadata({ params }: PageProps<"/products/[id]">): Promise<Metadata> {
  const { id } = await params;
  const [data, settings] = await Promise.all([getProductPage(id), getSettings()]);
  if (!data) return {};
  return {
    title: `${data.product.name} — ${settings.storeName}`,
    description: data.details.summary.slice(0, 155),
  };
}

export default async function ProductPage({ params }: PageProps<"/products/[id]">) {
  const { id } = await params;
  const data = await getProductPage(id);
  if (!data) notFound();

  const { product, details, categoryName } = data;
  const related = await getRelatedProducts(product);

  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Products", href: "/products" },
    { label: categoryName, href: `/products?category=${product.category}` },
  ];

  return (
    <main className={`${container} flex-1 pt-4 lg:pt-6`}>
      <nav aria-label="Breadcrumb" className="mb-6 lg:mb-10">
        <ol className="flex flex-wrap items-center gap-1.5 text-xs">
          {crumbs.map((c) => (
            <li key={c.label} className="flex items-center gap-1.5">
              <Link href={c.href} className="font-semibold text-brand hover:underline">
                {c.label}
              </Link>
              <ChevronRight className="size-3 text-body" />
            </li>
          ))}
          <li aria-current="page" className="text-body">
            {product.name}
          </li>
        </ol>
      </nav>

      <section className="grid gap-8 lg:grid-cols-2 lg:gap-14 xl:gap-20">
        <Reveal variant="left">
          <ProductGallery key={product.id} product={product} credit={details.imageCredit} />
          <ShareButtons title={product.name} />
        </Reveal>
        <Reveal variant="right" delay={100}>
          <ProductInfo key={product.id} product={product} details={details} categoryName={categoryName} />
        </Reveal>
      </section>

      <Reveal>
        <ProductTabs key={product.id} product={product} details={details} categoryName={categoryName} />
      </Reveal>

      <section className="mt-12 lg:mt-16">
        <Reveal variant="left">
          <h2 className="mb-6 border-b border-line pb-3 text-xl font-bold text-heading sm:text-2xl">You may also like</h2>
        </Reveal>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
          {related.map((p, i) => (
            <Reveal key={p.id} delay={(i % 4) * 100} className="h-full">
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      </section>
    </main>
  );
}
