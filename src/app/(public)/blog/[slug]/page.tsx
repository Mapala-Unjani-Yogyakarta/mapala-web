import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPostBySlug, getPublishedPosts } from "@/lib/data";
import { Badge } from "@/components/ui";
import { Markdown } from "@/components/markdown";
import { ScrollProgress } from "@/components/site/motion";
import { PageHero } from "@/components/site/page-hero";
import { PostCard } from "@/components/site/post-card";
import { formatDate, readingMinutes } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await getPostBySlug(slug);
  if (!p) return { title: "Tulisan tidak ditemukan" };
  const description = p.excerpt || p.body.replace(/[#>*_`\[\]()!-]/g, "").replace(/\s+/g, " ").trim().slice(0, 160);
  return {
    title: p.title,
    description,
    openGraph: { title: p.title, description, type: "article", publishedTime: p.published_at ?? undefined, authors: [p.author_name], images: p.cover_url ? [p.cover_url] : undefined },
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();
  const others = (await getPublishedPosts(7)).filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    <article>
      <ScrollProgress />
      <PageHero eyebrow={post.kind === "berita" ? "Berita" : "Blog"} title={post.title} back={{ href: "/blog", label: "Semua tulisan" }}>
        <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-sky-800/85">
          <Badge tone={post.kind === "berita" ? "accent" : "brand"}>{post.kind === "berita" ? "Berita" : "Blog"}</Badge>
          <span>Oleh {post.author_name}</span>
          {post.published_at && <span>{formatDate(post.published_at)}</span>}
          <span>{readingMinutes(post.body)} menit baca</span>
        </div>
      </PageHero>

      <div className="mx-auto max-w-3xl px-4 pb-6 sm:px-6">
        {post.cover_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.cover_url} alt="" className="mb-10 aspect-[16/9] w-full rounded-panel object-cover" />
        )}
        {post.excerpt && <p className="mb-8 font-display text-2xl leading-snug text-ink">{post.excerpt}</p>}
        <Markdown>{post.body}</Markdown>
      </div>

      {others.length > 0 && (
        <section className="container-page mt-20">
          <h2 className="section-title mb-8">Tulisan lainnya</h2>
          <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((p) => (
              <li key={p.id}>
                <PostCard post={p} />
              </li>
            ))}
          </ul>
          <p className="mt-8">
            <Link href="/blog" className="text-sm font-medium text-brand-700 hover:text-brand-900">
              Lihat semua tulisan →
            </Link>
          </p>
        </section>
      )}
    </article>
  );
}
