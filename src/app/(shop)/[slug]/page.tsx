import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { PostContent } from "@/components/PostContent";
import { container } from "@/lib/ui";
import { getPublishedPage } from "@/server/pages";
import { getSettings } from "@/server/queries";

export async function generateMetadata({ params }: PageProps<"/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const [page, settings] = await Promise.all([getPublishedPage(slug), getSettings()]);
  if (!page) return {};
  const description = page.metaDescription || page.shortDescription || undefined;
  return {
    title: `${page.metaTitle || page.title} — ${settings.storeName}`,
    description,
    keywords: page.metaKeywords ? page.metaKeywords.split(",").map((k) => k.trim()).filter(Boolean) : undefined,
    openGraph: {
      title: page.metaTitle || page.title,
      description,
      images: page.banner || page.image ? [(page.banner || page.image)!] : undefined,
    },
  };
}

export default async function StorePage({ params }: PageProps<"/[slug]">) {
  const { slug } = await params;
  const [page, settings] = await Promise.all([getPublishedPage(slug), getSettings()]);
  if (!page) notFound();

  const width = page.template === "default" ? "max-w-4xl" : "";
  const body = (
    <article className="min-w-0 rounded-2xl border border-line bg-white p-5 sm:p-8 lg:p-10">
      {page.image && (
        <div className={`relative mb-8 aspect-[16/9] overflow-hidden rounded-xl bg-soft ${page.template === "full-width" ? "lg:float-right lg:mb-4 lg:ml-8 lg:aspect-[4/3] lg:w-[42%]" : ""}`}>
          <Image src={page.image} alt={page.title} fill sizes="(min-width: 1024px) 600px, 100vw" className="object-cover" />
        </div>
      )}
      <PostContent content={page.content} />
      <div className="clear-both" />
    </article>
  );

  return (
    <main className="flex-1 pb-12">
      {/* Banner: uploaded image, or a soft brand gradient */}
      <section className="relative isolate overflow-hidden">
        {page.banner ? (
          <>
            <Image src={page.banner} alt="" fill priority sizes="100vw" className="-z-10 object-cover" />
            <div className="absolute inset-0 -z-10 bg-linear-to-r from-[#0f2537]/85 via-[#0f2537]/60 to-[#0f2537]/20" />
          </>
        ) : (
          <div className="absolute inset-0 -z-10 bg-linear-to-r from-brand-light via-[#eef9f7] to-white" />
        )}
        <div className={`${container} py-10 sm:py-14 lg:py-20`}>
          <nav aria-label="Breadcrumb" className={`mb-3 text-xs ${page.banner ? "text-white/80" : "text-body"}`}>
            <Link href="/" className={`font-semibold hover:underline ${page.banner ? "text-white" : "text-brand"}`}>
              Home
            </Link>
            <ChevronRight className="mx-1.5 inline size-3" />
            <span aria-current="page">{page.title}</span>
          </nav>
          <h1 className={`text-3xl font-bold sm:text-4xl lg:text-5xl ${page.banner ? "text-white" : "text-heading"}`}>{page.title}</h1>
          {page.shortDescription && (
            <p className={`mt-3 max-w-2xl text-sm sm:text-base ${page.banner ? "text-white/85" : "text-body"}`}>{page.shortDescription}</p>
          )}
        </div>
      </section>

      <div className={`${container} mt-8 lg:mt-10`}>
        {page.template === "with-sidebar" ? (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
            {body}
            <aside className="space-y-6 self-start lg:sticky lg:top-28">
              <div className="rounded-2xl border border-line bg-white p-6">
                <h2 className="mb-4 border-b border-line pb-3 font-bold text-heading">Get in touch</h2>
                <ul className="space-y-3 text-sm text-heading">
                  <li className="flex gap-2.5">
                    <MapPin className="size-4 shrink-0 text-brand" /> {settings.address}
                  </li>
                  <li>
                    <a href={`tel:${settings.phone}`} className="flex gap-2.5 hover:text-brand">
                      <Phone className="size-4 shrink-0 text-brand" /> {settings.phone}
                    </a>
                  </li>
                  <li>
                    <a href={`mailto:${settings.email}`} className="flex gap-2.5 hover:text-brand">
                      <Mail className="size-4 shrink-0 text-brand" /> {settings.email}
                    </a>
                  </li>
                  <li className="flex gap-2.5">
                    <Clock className="size-4 shrink-0 text-brand" /> 10:00 – 18:00, Sat – Thu
                  </li>
                </ul>
              </div>
              <div className="rounded-2xl bg-linear-to-br from-brand to-brand-dark p-6 text-white">
                <MessageCircle className="size-8" />
                <p className="mt-3 text-lg font-bold">Need help ordering?</p>
                <p className="mt-1 text-sm text-white/85">Call us and we’ll take your order over the phone.</p>
                <a
                  href={`tel:${settings.phone}`}
                  className="mt-4 inline-flex h-10 items-center rounded-full bg-white px-5 text-sm font-bold text-brand-dark transition hover:bg-brand-light"
                >
                  Call {settings.phone}
                </a>
              </div>
            </aside>
          </div>
        ) : (
          <div className={`mx-auto ${width}`}>{body}</div>
        )}
      </div>
    </main>
  );
}
