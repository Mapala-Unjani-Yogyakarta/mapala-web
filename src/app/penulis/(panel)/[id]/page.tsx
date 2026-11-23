import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuthor } from "@/lib/author-auth";
import { ActionForm, SubmitButton } from "@/components/form";
import { Card, PageHeader } from "@/components/ui";
import { PostEditor } from "@/components/post-editor";
import { deletePost } from "@/lib/post-actions";
import type { Post } from "@/lib/types";

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await requireAuthor();
  const { data } = await supabase.from("posts").select("*").eq("id", id).eq("author_user_id", user.id).maybeSingle();
  if (!data) notFound();
  const post = data as Post;

  return (
    <>
      <PageHeader title={post.title} back={{ href: "/penulis", label: "Tulisan saya" }} />
      {post.status === "published" ? (
        <Card>
          <p className="text-sm text-body">
            Tulisan ini sudah terbit dan hanya bisa diubah pengurus.{" "}
            <Link href={`/blog/${post.slug}`} className="font-medium text-brand-700 hover:underline">
              Lihat di website ↗
            </Link>
          </p>
        </Card>
      ) : (
        <>
          {post.status === "submitted" && (
            <p className="mb-4 rounded-card bg-warn-50 px-4 py-3 text-sm text-warn-800">Tulisan ini sedang menunggu tinjauan pengurus. Kamu masih bisa mengubahnya; ia tetap berstatus menunggu.</p>
          )}
          <Card>
            <PostEditor post={post} scope="author" uploadFolder={user.id} />
          </Card>
          <Card className="mt-6 border-danger-200">
            <h2 className="font-semibold text-danger-700">Hapus tulisan</h2>
            <p className="mb-3 mt-1 text-sm text-muted">Draf atau tulisan yang perlu revisi bisa dihapus permanen.</p>
            <ActionForm action={deletePost}>
              <input type="hidden" name="id" value={post.id} />
              <input type="hidden" name="scope" value="author" />
              <SubmitButton variant="danger" confirm="Hapus tulisan ini secara permanen?">
                Hapus tulisan
              </SubmitButton>
            </ActionForm>
          </Card>
        </>
      )}
    </>
  );
}
