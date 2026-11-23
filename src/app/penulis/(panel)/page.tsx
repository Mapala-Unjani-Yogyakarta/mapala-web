import Link from "next/link";
import { PenLine } from "lucide-react";
import { requireAuthor } from "@/lib/author-auth";
import { Badge, Card, EmptyState, PageHeader, btnPrimary, type BadgeTone } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import type { Post, PostStatus } from "@/lib/types";

const STATUS: Record<PostStatus, { label: string; tone: BadgeTone }> = {
  draft: { label: "Draf", tone: "neutral" },
  submitted: { label: "Menunggu tinjauan", tone: "warn" },
  published: { label: "Terbit", tone: "brand" },
  rejected: { label: "Perlu revisi", tone: "danger" },
};

export default async function AuthorHome() {
  const { supabase, user, name } = await requireAuthor();
  const { data } = await supabase.from("posts").select("*").eq("author_user_id", user.id).order("updated_at", { ascending: false });
  const posts = (data ?? []) as Post[];

  return (
    <>
      <PageHeader
        title={`Halo, ${name.split(" ")[0]}`}
        desc="Tulis ceritamu, simpan sebagai draf, lalu ajukan. Tulisan tampil di website setelah disetujui pengurus."
        action={
          <Link href="/penulis/baru" className={btnPrimary}>
            <PenLine size={16} aria-hidden /> Tulis baru
          </Link>
        }
      />

      {posts.length === 0 ? (
        <EmptyState>Belum ada tulisan. Klik “Tulis baru” untuk memulai.</EmptyState>
      ) : (
        <ul className="space-y-3">
          {posts.map((p) => {
            const st = STATUS[p.status];
            const editable = p.status !== "published";
            return (
              <li key={p.id}>
                <Card className="flex flex-wrap items-start justify-between gap-3 !p-4">
                  <div className="min-w-0 flex-1">
                    <Link href={editable ? `/penulis/${p.id}` : `/blog/${p.slug}`} className="font-medium text-ink hover:text-brand-700">
                      {p.title}
                    </Link>
                    <p className="mt-0.5 text-xs text-muted">Diubah {formatDate(p.updated_at)}</p>
                    {p.status === "rejected" && p.review_note && <p className="mt-2 rounded-control bg-warn-50 px-3 py-2 text-sm text-warn-800">Catatan pengurus: {p.review_note}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge tone={st.tone}>{st.label}</Badge>
                    {editable ? (
                      <Link href={`/penulis/${p.id}`} className="text-sm font-medium text-brand-700 hover:underline">
                        {p.status === "rejected" ? "Revisi" : "Ubah"}
                      </Link>
                    ) : (
                      <Link href={`/blog/${p.slug}`} className="text-sm font-medium text-brand-700 hover:underline">
                        Lihat ↗
                      </Link>
                    )}
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
