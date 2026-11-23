import Link from "next/link";
import type { Album } from "@/lib/types";
import { formatDate } from "@/lib/utils";

/** Kartu album: foto besar, teks di bawah, tanpa bingkai. */
export function AlbumCard({ album, tone = "dark" }: { album: Album; tone?: "dark" | "light" }) {
  const light = tone === "light";
  return (
    <Link href={`/gallery/${album.slug}`} className="group block">
      <div className="aspect-[4/3] overflow-hidden rounded-card bg-brand-100">
        {album.cover_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={album.cover_url} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
        )}
      </div>
      <h3 className={`mt-3 font-medium ${light ? "text-white" : "text-ink group-hover:text-brand-700"}`}>{album.title}</h3>
      {album.event_date && <p className={`text-sm ${light ? "text-white/70" : "text-muted"}`}>{formatDate(album.event_date)}</p>}
      {album.description && <p className={`mt-1 line-clamp-2 text-sm ${light ? "text-white/70" : "text-muted"}`}>{album.description}</p>}
    </Link>
  );
}
