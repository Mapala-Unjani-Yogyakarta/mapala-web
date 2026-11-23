import Link from "next/link";
import { Badge } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import type { PostSummary } from "@/lib/types";

/** Kartu tulisan: sampul, jenis, judul, ringkasan, penulis dan tanggal. */
export function PostCard({ post }: { post: PostSummary }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group flex h-full flex-col">
      <div className="aspect-[16/10] overflow-hidden rounded-card bg-gradient-to-br from-brand-100 to-sky-100">
        {post.cover_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.cover_url} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
        )}
      </div>
      <div className="mt-4 flex items-center gap-2">
        <Badge tone={post.kind === "berita" ? "accent" : "brand"}>{post.kind === "berita" ? "Berita" : "Blog"}</Badge>
        {post.published_at && <span className="text-xs text-muted">{formatDate(post.published_at)}</span>}
      </div>
      <h3 className="mt-2 font-display text-2xl leading-snug text-ink group-hover:text-brand-700">{post.title}</h3>
      {post.excerpt && <p className="mt-2 line-clamp-3 text-sm text-muted">{post.excerpt}</p>}
      <p className="mt-auto pt-3 text-xs text-muted">Oleh {post.author_name}</p>
    </Link>
  );
}
