import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { Badge, Card, PageHeader } from "@/components/ui";
import { PostEditor } from "@/components/post-editor";
import { formatDate } from "@/lib/utils";
import type { Post } from "@/lib/types";
import { ReviewPanel } from "../review-panel";

const LABEL = { draft: "Draf", submitted: "Menunggu tinjauan", published: "Terbit", rejected: "Perlu revisi" } as const;

export default async function AdminPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await requireAdmin();
  const { data } = await supabase.from("posts").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const post = data as Post;

  return (
    <>
      <PageHeader title={post.title} back={{ href: "/admin/tulisan", label: "Blog & Berita" }} />
      <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-muted">
        <Badge tone={post.status === "published" ? "brand" : post.status === "submitted" ? "warn" : post.status === "rejected" ? "danger" : "neutral"}>{LABEL[post.status]}</Badge>
        <span>Penulis: {post.author_name}</span>
        <span>Dibuat {formatDate(post.created_at)}</span>
        {post.status === "published" && (
          <Link href={`/blog/${post.slug}`} className="font-medium text-brand-700 hover:underline">
            Lihat di website ↗
          </Link>
        )}
      </div>

      {post.status === "submitted" && (
        <Card className="mb-6">
          <h2 className="mb-4 font-semibold">Tinjau tulisan</h2>
          <ReviewPanel id={post.id} status={post.status} />
        </Card>
      )}

      <Card>
        <h2 className="mb-4 font-semibold">{post.status === "submitted" ? "Sunting sebelum terbit" : "Isi tulisan"}</h2>
        <PostEditor post={post} scope="admin" uploadFolder={user.id} />
      </Card>

      {post.status !== "submitted" && (
        <Card className="mt-6">
          <h2 className="mb-4 font-semibold">Tindakan</h2>
          <ReviewPanel id={post.id} status={post.status} />
        </Card>
      )}
    </>
  );
}
