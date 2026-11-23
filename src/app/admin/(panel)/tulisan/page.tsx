import Link from "next/link";
import { PenLine } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { Badge, EmptyState, PageHeader, btnPrimary, type BadgeTone } from "@/components/ui";
import { cx, formatDate } from "@/lib/utils";
import type { Post, PostStatus } from "@/lib/types";

const STATUS: Record<PostStatus, { label: string; tone: BadgeTone }> = {
  submitted: { label: "Menunggu tinjauan", tone: "warn" },
  draft: { label: "Draf", tone: "neutral" },
  published: { label: "Terbit", tone: "brand" },
  rejected: { label: "Perlu revisi", tone: "danger" },
};
const ORDER: PostStatus[] = ["submitted", "draft", "rejected", "published"];

export default async function AdminPostsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const sp = await searchParams;
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("posts").select("id, slug, kind, status, title, author_name, updated_at, published_at").order("updated_at", { ascending: false }).limit(300);
  const all = (data ?? []) as Pick<Post, "id" | "slug" | "kind" | "status" | "title" | "author_name" | "updated_at" | "published_at">[];
  const filter = ORDER.includes(sp.status as PostStatus) ? (sp.status as PostStatus) : null;
  const posts = all
    .filter((p) => !filter || p.status === filter)
    .sort((a, b) => ORDER.indexOf(a.status) - ORDER.indexOf(b.status) || +new Date(b.updated_at) - +new Date(a.updated_at));
  const count = (s: PostStatus) => all.filter((p) => p.status === s).length;

  return (
    <>
      <PageHeader
        title="Blog & Berita"
        desc="Tinjau tulisan anggota dan terbitkan berita resmi."
        action={
          <Link href="/admin/tulisan/baru" className={btnPrimary}>
            <PenLine size={16} aria-hidden /> Tulis baru
          </Link>
        }
      />

      <div className="mb-5 flex flex-wrap gap-2">
        <Link href="/admin/tulisan" className={cx("rounded-full border px-4 py-1.5 text-sm", !filter ? "border-brand-700 bg-brand-700 text-white" : "border-line-strong bg-surface text-body hover:border-brand-400")}>
          Semua · {all.length}
        </Link>
        {ORDER.map((s) => (
          <Link key={s} href={`/admin/tulisan?status=${s}`} className={cx("rounded-full border px-4 py-1.5 text-sm", filter === s ? "border-brand-700 bg-brand-700 text-white" : "border-line-strong bg-surface text-body hover:border-brand-400")}>
            {STATUS[s].label} · {count(s)}
          </Link>
        ))}
      </div>

      {posts.length === 0 ? (
        <EmptyState>Belum ada tulisan{filter ? " di kategori ini" : ""}.</EmptyState>
      ) : (
        <div className="overflow-hidden rounded-card border border-line bg-surface">
          <ul className="divide-y divide-line">
            {posts.map((p) => (
              <li key={p.id}>
                <Link href={`/admin/tulisan/${p.id}`} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 hover:bg-sunken">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-ink">{p.title}</p>
                    <p className="text-xs text-muted">
                      {p.author_name} · {p.kind === "berita" ? "Berita" : "Blog"} · diubah {formatDate(p.updated_at)}
                    </p>
                  </div>
                  <Badge tone={STATUS[p.status].tone}>{STATUS[p.status].label}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
