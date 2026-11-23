import type { Metadata } from "next";
import { getAlbums } from "@/lib/data";
import { EmptyState } from "@/components/ui";
import { AlbumCard } from "@/components/site/album-card";
import { Reveal } from "@/components/site/motion";
import { SceneHero } from "@/components/site/scene-section";

export const metadata: Metadata = { title: "Gallery Kegiatan" };

export default async function GalleryPage() {
  const albums = await getAlbums();
  return (
    <>
      <SceneHero scene="lake" eyebrow="Dokumentasi" title="Gallery Kegiatan" desc="Perjalanan, pelatihan, dan kegiatan organisasi." />
      <div className="container-page pb-6">
        {albums.length === 0 ? (
          <EmptyState>Belum ada album yang dipublikasikan.</EmptyState>
        ) : (
          <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {albums.map((a, i) => (
              <Reveal as="li" key={a.id} delay={(i % 3) * 100}>
                <AlbumCard album={a} />
              </Reveal>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
