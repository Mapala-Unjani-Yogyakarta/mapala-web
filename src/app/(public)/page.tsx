import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getAlbums, getCurrentPeriod, getPositions, getSettings, getStats } from "@/lib/data";
import { SectionHeading, btnPrimary } from "@/components/ui";
import { Hero } from "@/components/site/hero";
import { Stats } from "@/components/site/stats";
import { AlbumCard } from "@/components/site/album-card";
import { PersonCard } from "@/components/site/person-card";
import { SceneSection, type SceneKey } from "@/components/site/scene-section";

/** Teks ajakan di bagian paling bawah beranda. Ubah di sini. */
const CTA = {
  eyebrow: "Satu keluarga",
  title: "Dari pendakian ke pendakian, kita tetap satu",
  text: "Perbarui datamu supaya kabar dan kegiatan organisasi selalu sampai kepadamu.",
  button: "Perbarui Data Saya",
};

export default async function HomePage() {
  const [s, stats, albums, period] = await Promise.all([getSettings(), getStats(), getAlbums(3), getCurrentPeriod()]);
  const positions = period ? (await getPositions(period.id)).slice(0, 4) : [];
  const about = [
    { t: "Visi", v: s.vision },
    { t: "Misi", v: s.mission },
    { t: "Sejarah", v: s.history },
  ].filter((b) => b.v);

  // Urutan adegan mengikuti waktu. Bagian kosong dilewati, pembatas otomatis menyesuaikan.
  const order: SceneKey[] = ["pines", ...(about.length ? (["golden"] as const) : []), ...(period && positions.length ? (["dusk"] as const) : []), ...(albums.length ? (["night"] as const) : []), "dawn"];
  const next = (k: SceneKey) => order[order.indexOf(k) + 1];

  return (
    <>
      <Hero orgName={s.org_name} tagline={s.tagline} />

      <SceneSection scene="pines" next={next("pines")} label="Tentang kami" className="-mt-px">
        <div className="container-page pb-64 pt-24 text-center sm:pb-80">
          <p className="eyebrow mb-6">Tentang kami</p>
          <p className="font-display mx-auto max-w-3xl text-3xl leading-snug text-ink sm:text-5xl">{s.about}</p>
          <div className="mt-20">
            <Stats
              items={[
                { label: "Anggota terdata", value: stats.members, href: "/anggota" },
                { label: "Periode kepengurusan", value: stats.periods },
                { label: "Album kegiatan", value: stats.albums },
                { label: "Foto dokumentasi", value: stats.photos },
              ]}
            />
          </div>
        </div>
      </SceneSection>

      {about.length > 0 && (
        <SceneSection scene="golden" next={next("golden")} label="Visi, misi, dan sejarah">
          <div className="container-page pb-64 pt-20 sm:pb-80">
            <SectionHeading eyebrow="Arah kami" title="Visi, misi & sejarah" />
            <div className="grid gap-10 md:grid-cols-3">
              {about.map((b) => (
                <div key={b.t}>
                  <p className="eyebrow mb-3 !text-accent-600">{b.t}</p>
                  <p className="whitespace-pre-line leading-relaxed text-ink/85">{b.v}</p>
                </div>
              ))}
            </div>
          </div>
        </SceneSection>
      )}

      {period && positions.length > 0 && (
        <SceneSection scene="dusk" next={next("dusk")} label="Pengurus">
          <div className="container-page pb-72 pt-20 sm:pb-96">
            <SectionHeading tone="light" eyebrow={`Kepengurusan ${period.name}`} title="Pengurus" href={`/periode/${period.slug}`} hrefLabel="Susunan lengkap" />
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {positions.map((p) => (
                <li key={p.id}>
                  <PersonCard name={p.members.full_name} role={p.title} photo={p.members.photo_url} size={44} />
                </li>
              ))}
            </ul>
          </div>
        </SceneSection>
      )}

      {albums.length > 0 && (
        <SceneSection scene="night" next={next("night")} label="Kegiatan terbaru">
          <div className="container-page pb-64 pt-20 sm:pb-80">
            <SectionHeading tone="light" eyebrow="Dokumentasi" title="Kegiatan terbaru" href="/gallery" hrefLabel="Semua album" />
            <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {albums.map((a) => (
                <li key={a.id}>
                  <AlbumCard album={a} tone="light" />
                </li>
              ))}
            </ul>
          </div>
        </SceneSection>
      )}

      <SceneSection scene="dawn" label="Bergabung">
        <div className="container-page pb-56 pt-32 text-center sm:pb-64">
          <p className="eyebrow mb-4">{CTA.eyebrow}</p>
          <h2 className="section-title mx-auto max-w-2xl">{CTA.title}</h2>
          <p className="mx-auto mt-4 max-w-md text-body">{CTA.text}</p>
          <Link href="/isi-data" className={btnPrimary + " mt-8 !px-7 !py-3"}>
            {CTA.button} <ArrowRight size={16} aria-hidden />
          </Link>
        </div>
      </SceneSection>
    </>
  );
}
