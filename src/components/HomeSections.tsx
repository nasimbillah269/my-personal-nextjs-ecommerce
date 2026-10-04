import Link from "next/link";
import { ArrowRight, BadgePercent, Boxes, RotateCcw, Tag, Truck } from "lucide-react";
import { CategoryIcon } from "@/lib/category-icons";
import type { Category, Product } from "@/lib/types";
import { Carousel } from "./Carousel";
import { LogoMark } from "./Logo";
import { ProductCard } from "./ProductCard";
import { Reveal } from "./Reveal";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Reveal variant="left">
      <h2 className="mb-4 text-xl font-bold text-heading sm:mb-6 sm:text-2xl lg:text-[28px]">{children}</h2>
    </Reveal>
  );
}

export function ShopByCategories({ categories }: { categories: Category[] }) {
  return (
    <section className="mt-8 lg:mt-12">
      <SectionTitle>Shop By Categories</SectionTitle>
      <Carousel className="gap-3 sm:gap-4 lg:gap-6">
        {categories.map(({ slug, name, icon }, i) => (
          <Reveal
            key={slug}
            variant="zoom"
            delay={Math.min(i, 5) * 80}
            className="shrink-0 basis-[calc((100%-1.5rem)/2.6)] snap-start sm:basis-[calc((100%-3rem)/4)] lg:basis-[calc((100%-7.5rem)/6)]"
          >
            <Link
              href={`/products?category=${slug}`}
              className="group flex h-full flex-col items-center justify-center rounded-xl border border-transparent bg-soft px-2 py-5 text-center transition hover:border-brand/40 hover:bg-white hover:shadow-md sm:py-7"
            >
              <CategoryIcon name={icon} className="size-8 text-brand-dark transition group-hover:scale-110 sm:size-9" strokeWidth={1.3} />
              <span className="mt-3 text-sm font-bold text-heading group-hover:text-brand">{name}</span>
              <span className="mt-1 text-xs text-body">Many items</span>
            </Link>
          </Reveal>
        ))}
      </Carousel>
    </section>
  );
}

export function PopularProducts({ products }: { products: Product[] }) {
  return (
    <section id="popular-products" className="mt-10 scroll-mt-28 lg:mt-14">
      <div className="flex items-start justify-between gap-4">
        <SectionTitle>Popular Products</SectionTitle>
        <Link
          href="/products"
          className="mt-1 flex shrink-0 items-center gap-1 text-sm font-bold text-brand transition hover:gap-2"
        >
          View all <ArrowRight className="size-4" />
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
        {products.map((p, i) => (
          <Reveal key={p.id} delay={(i % 4) * 100} className="h-full">
            <ProductCard product={p} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export function DailyBestSells({ products }: { products: Product[] }) {
  return (
    <section className="mt-10 lg:mt-14">
      <SectionTitle>Daily Best Sells</SectionTitle>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,3.4fr)] lg:gap-6">
        <Reveal variant="left" className="flex">
          <div
            className="relative flex w-full min-h-[220px] flex-col overflow-hidden rounded-2xl p-6 sm:min-h-[280px] lg:p-8"
            style={{ background: "linear-gradient(165deg,#f3f9d9 0%,#e1efb0 45%,#b9db7c 100%)" }}
          >
            <div className="flex flex-col items-start lg:items-center">
              <LogoMark className="h-8 w-11" />
              <span className="font-serif text-[10px] font-bold text-leaf">Ultimate Organic Life</span>
            </div>
            <p className="mt-4 font-serif text-3xl leading-tight text-brand-dark italic lg:mt-8 lg:text-center lg:text-4xl">
              The Gifts of
              <span className="block text-4xl lg:text-5xl">Nature</span>
            </p>
            <Link
              href="/products"
              className="mt-5 inline-flex w-fit items-center gap-1 rounded-md bg-brand px-4 py-2 text-xs font-bold text-white transition hover:bg-brand-dark lg:mx-auto"
            >
              Shop now <ArrowRight className="size-3.5" />
            </Link>
            <p className="pointer-events-none absolute right-4 bottom-3 text-4xl tracking-tight sm:text-5xl lg:inset-x-0 lg:right-0 lg:text-center lg:text-4xl xl:text-5xl">
              🥕🥦🍅🌽🥬
            </p>
          </div>
        </Reveal>

        <Reveal variant="right" delay={150} className="min-w-0">
          <Carousel className="gap-3 py-1 sm:gap-4 lg:gap-6">
            {products.map((p) => (
              <div
                key={p.id}
                className="shrink-0 basis-[72%] snap-start sm:basis-[calc((100%-1rem)/2)] lg:basis-[calc((100%-3rem)/3)]"
              >
                <ProductCard product={p} variant="full" />
              </div>
            ))}
          </Carousel>
        </Reveal>
      </div>
    </section>
  );
}

export function NewsletterBanner() {
  return (
    <Reveal variant="zoom">
      <section
        className="relative mt-10 overflow-hidden rounded-2xl px-6 py-10 sm:px-12 lg:mt-14 lg:px-16 lg:py-16"
        style={{ background: "linear-gradient(100deg,#c9e6a6 0%,#a8d47a 45%,#6fb84d 100%)" }}
      >
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-2xl leading-snug font-bold text-brand-dark sm:text-4xl lg:text-5xl">
            Stay home &amp; get your daily needs from our shop
          </h2>
          <p className="mt-3 text-sm text-heading/80 sm:text-lg">
            Start your daily shopping with <span className="font-bold text-brand-dark">Ultimate Organic Life</span>
          </p>
          <form className="mt-6 flex max-w-md overflow-hidden rounded-full bg-white shadow-sm">
            <input
              type="email"
              required
              placeholder="Your email address"
              className="min-w-0 flex-1 px-5 py-3 text-sm outline-none"
            />
            <button
              type="submit"
              className="bg-brand px-5 text-sm font-bold text-white transition hover:bg-brand-dark sm:px-8"
            >
              Subscribe
            </button>
          </form>
        </div>
        <p className="pointer-events-none absolute right-6 bottom-0 hidden text-[140px] leading-none opacity-90 md:block lg:right-16 lg:text-[200px]">
          🧺
        </p>
      </section>
    </Reveal>
  );
}

const features = [
  { icon: BadgePercent, title: "Best prices & offers", text: "Orders ৳3000 or more" },
  { icon: Truck, title: "Fast delivery", text: "All over Bangladesh" },
  { icon: Tag, title: "Great daily deal", text: "When you sign up" },
  { icon: Boxes, title: "Wide assortment", text: "Mega discounts" },
  { icon: RotateCcw, title: "Easy returns", text: "Within 7 days" },
];

export function FeatureStrip() {
  return (
    <section className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:mt-14 lg:grid-cols-5 lg:gap-6">
      {features.map(({ icon: Icon, title, text }, i) => (
        <Reveal key={title} delay={i * 90} className="h-full">
          <div className="flex h-full items-center gap-3 rounded-xl bg-soft p-4 lg:p-5">
            <Icon className="size-8 shrink-0 text-brand lg:size-10" strokeWidth={1.4} />
            <div>
              <p className="text-sm font-bold text-heading lg:text-base">{title}</p>
              <p className="text-xs text-body">{text}</p>
            </div>
          </div>
        </Reveal>
      ))}
    </section>
  );
}
