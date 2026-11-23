import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { ActionForm, SubmitButton } from "@/components/form";
import { PhotoUploader } from "@/components/uploader";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import type { Album, Photo } from "@/lib/types";
import { AlbumForm } from "../album-form";
import { addPhotos, deleteAlbum, deletePhoto, setCover } from "../actions";

export default async function AlbumAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const [{ data: album }, { data: photos }] = await Promise.all([
    supabase.from("albums").select("*").eq("id", id).maybeSingle(),
    supabase.from("photos").select("*").eq("album_id", id).order("created_at", { ascending: true }),
  ]);
  if (!album) notFound();
  const a = album as Album;
  const list = (photos ?? []) as Photo[];

  return (
    <>
      <PageHeader title={a.title} back={{ href: "/admin/gallery", label: "Semua album" }} />
      <div className="space-y-6">
        <Card>
          <h2 className="mb-4 font-semibold">Informasi album</h2>
          <AlbumForm album={a} />
        </Card>

        <Card>
          <h2 className="mb-3 font-semibold">Foto ({list.length})</h2>
          <PhotoUploader albumId={id} addPhotos={addPhotos} />

          {list.length === 0 ? (
            <div className="mt-5">
              <EmptyState>Belum ada foto di album ini.</EmptyState>
            </div>
          ) : (
            <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {list.map((p) => (
                <li key={p.id} className="overflow-hidden rounded-control border border-line">
                  <div className="relative aspect-square bg-sunken">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.url} alt="" loading="lazy" className="h-full w-full object-cover" />
                    {a.cover_url === p.url && (
                      <span className="absolute left-2 top-2">
                        <Badge tone="accent">Sampul</Badge>
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1 p-2">
                    {a.cover_url !== p.url && (
                      <ActionForm action={setCover}>
                        <input type="hidden" name="album_id" value={id} />
                        <input type="hidden" name="url" value={p.url} />
                        <SubmitButton variant="ghost" pendingText="…" className="!px-2 !py-1 !text-xs">
                          Jadikan sampul
                        </SubmitButton>
                      </ActionForm>
                    )}
                    <ActionForm action={deletePhoto}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="album_id" value={id} />
                      <SubmitButton variant="danger" pendingText="…" confirm="Hapus foto ini?" className="!px-2 !py-1 !text-xs">
                        Hapus
                      </SubmitButton>
                    </ActionForm>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="border-danger-200">
          <h2 className="font-semibold text-danger-700">Hapus album</h2>
          <p className="mb-3 mt-1 text-sm text-muted">Album beserta seluruh fotonya dihapus permanen. Untuk menyembunyikan sementara, matikan “Tampilkan di website”.</p>
          <ActionForm action={deleteAlbum}>
            <input type="hidden" name="id" value={id} />
            <SubmitButton variant="danger" confirm="Hapus album ini beserta semua fotonya secara permanen?">
              Hapus album
            </SubmitButton>
          </ActionForm>
        </Card>
      </div>
    </>
  );
}
