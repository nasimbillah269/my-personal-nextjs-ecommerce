import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, ChevronRight, Clock, MessageCircle, UserRound } from "lucide-react";
import { BlogComments } from "@/components/BlogComments";
import { BlogSidebar, formatPostDate, PostCard } from "@/components/BlogParts";
import { PostContent } from "@/components/PostContent";
import { ShareButtons } from "@/components/ProductDetail";
import { readingMinutes } from "@/lib/post-content";
import { container } from "@/lib/ui";
import { getBlogSidebar, getPublishedPost } from "@/server/blog";
import { getSettings } from "@/server/queries";

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const [data, settings] = await Promise.all([getPublishedPost(slug), getSettings()]);
  if (!data) return {};
  return {
    title: `${data.post.title} — ${settings.storeName}`,
    description: data.summary,
    openGraph: {
      type: "article",
      title: data.post.title,
      description: data.summary,
      publishedTime: data.post.publishedAt?.toISOString(),
      images: data.post.coverImage ? [data.post.coverImage] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const [data, sidebar] = await Promise.all([getPublishedPost(slug), getBlogSidebar()]);
  if (!data) notFound();
  const { post, tags, comments, commentCount, related } = data;

  return (
    <main className={`${container} flex-1 pt-4 pb-12 lg:pt-6`}>
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex flex-wrap items-center gap-1.5 text-xs">
          <li className="flex items-center gap-1.5">
            <Link href="/" className="font-semibold text-brand hover:underline">
              Home
            </Link>
            <ChevronRight className="size-3 text-body" />
          </li>
          <li className="flex items-center gap-1.5">
            <Link href="/blog" className="font-semibold text-brand hover:underline">
              Blog
            </Link>
            <ChevronRight className="size-3 text-body" />
          </li>
          {post.categoryName && post.categorySlug && (
            <li className="flex items-center gap-1.5">
              <Link href={`/blog?category=${post.categorySlug}`} className="font-semibold text-brand hover:underline">
                {post.categoryName}
              </Link>
              <ChevronRight className="size-3 text-body" />
            </li>
          )}
          <li aria-current="page" className="line-clamp-1 text-body">
            {post.title}
          </li>
        </ol>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <article className="min-w-0 rounded-2xl border border-line bg-white p-5 sm:p-8">
          {post.categoryName && post.categorySlug && (
            <Link
              href={`/blog?category=${post.categorySlug}`}
              className="inline-block rounded-full bg-brand-light px-3 py-1 text-xs font-bold text-brand-dark"
            >
              {post.categoryName}
            </Link>
          )}
          <h1 className="mt-3 text-2xl leading-tight font-bold text-heading sm:text-3xl lg:text-4xl">{post.title}</h1>
          <p className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-body">
            {post.authorName && (
              <span className="inline-flex items-center gap-1.5">
                <UserRound className="size-4" /> {post.authorName}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-4" /> {formatPostDate(post.publishedAt)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-4" /> {readingMinutes(post.content)} min read
            </span>
            <a href="#comments" className="inline-flex items-center gap-1.5 hover:text-brand">
              <MessageCircle className="size-4" /> {commentCount}
            </a>
          </p>

          {post.coverImage && (
            <div className="relative mt-6 aspect-[16/9] overflow-hidden rounded-xl bg-soft">
              <Image src={post.coverImage} alt={post.title} fill priority sizes="(min-width: 1024px) 900px, 100vw" className="object-cover" />
            </div>
          )}

          <PostContent content={post.content} className="mt-8" />

          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
            {tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {tags.map((t) => (
                  <Link
                    key={t.slug}
                    href={`/blog?tag=${t.slug}`}
                    className="rounded-full border border-line px-3 py-1 text-xs font-semibold text-heading transition hover:border-brand hover:text-brand"
                  >
                    #{t.name}
                  </Link>
                ))}
              </div>
            ) : (
              <span />
            )}
            <ShareButtons title={post.title} />
          </div>

          <BlogComments postId={post.id} comments={comments} count={commentCount} allowComments={post.allowComments} />
        </article>

        <BlogSidebar data={sidebar} activeCategory={post.categorySlug ?? undefined} />
      </div>

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-6 border-b border-line pb-3 text-xl font-bold text-heading sm:text-2xl">Related articles</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
