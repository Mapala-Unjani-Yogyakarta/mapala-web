import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAlbumBySlug, getPhotos } from "@/lib/data";
import { PhotoGrid } from "@/components/photo-grid";
import { EmptyState } from "@/components/ui";
import { SceneHero } from "@/components/site/scene-section";
import { formatDate } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const a = await getAlbumBySlug(slug);
  return { title: a?.title ?? "Album" };
}

export default async function AlbumPage({ params }: Props) {
  const { slug } = await params;
  const album = await getAlbumBySlug(slug);
  if (!album) notFound();
  const photos = await getPhotos(album.id);

  return (
    <>
      <SceneHero
        scene="lake"
        eyebrow={album.event_date ? formatDate(album.event_date) : "Album"}
        title={album.title}
        desc={album.description ?? undefined}
        back={{ href: "/gallery", label: "Semua album" }}
      />
      <div className="container-page pb-6">
        {photos.length === 0 ? <EmptyState>Album ini belum berisi foto.</EmptyState> : <PhotoGrid photos={photos} />}
      </div>
    </>
  );
}
