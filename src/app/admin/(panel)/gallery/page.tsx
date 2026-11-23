import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import type { Album } from "@/lib/types";
import { AlbumForm } from "./album-form";

export default async function GalleryAdminPage() {
  const { supabase } = await requireAdmin();
  const [{ data }, { data: photos }] = await Promise.all([
    supabase.from("albums").select("*").order("event_date", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false }),
    supabase.from("photos").select("album_id"),
  ]);
  const albums = (data ?? []) as Album[];
  const counts = new Map<string, number>();
  for (const p of (photos ?? []) as { album_id: string }[]) counts.set(p.album_id, (counts.get(p.album_id) ?? 0) + 1);

  return (
    <>
      <PageHeader title="Gallery" desc="Buat album per kegiatan lalu unggah foto-fotonya." />

      {albums.length === 0 ? (
        <EmptyState>Belum ada album. Buat album pertama di bawah.</EmptyState>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {albums.map((a) => (
            <li key={a.id}>
              <Link href={`/admin/gallery/${a.id}`} className="block overflow-hidden card hover:border-brand-400">
                <div className="aspect-[4/3] bg-brand-100">
                  {a.cover_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.cover_url} alt="" loading="lazy" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="p-3">
                  <p className="truncate font-semibold">{a.title}</p>
                  <p className="flex flex-wrap items-center gap-2 text-xs text-muted">
                    {counts.get(a.id) ?? 0} foto {a.event_date && `· ${formatDate(a.event_date)}`}
                    {!a.is_published && <Badge tone="neutral">Disembunyikan</Badge>}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Card className="mt-8">
        <h2 className="mb-4 font-semibold">Buat album baru</h2>
        <AlbumForm />
      </Card>
    </>
  );
}
