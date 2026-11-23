import type { Metadata } from "next";
import { getAlumni } from "@/lib/data";
import { EmptyState } from "@/components/ui";
import { SceneHero } from "@/components/site/scene-section";
import { AlumniDirectory } from "@/components/site/alumni-directory";

export const metadata: Metadata = {
  title: "Alumni",
  description: "Jaringan alumni: profesi, kota, dan kontak yang diizinkan tampil.",
};

export default async function AlumniPage() {
  const alumni = await getAlumni();
  const kota = new Set(alumni.map((a) => a.city?.trim().toLowerCase()).filter(Boolean)).size;
  const profesi = alumni.filter((a) => a.profession).length;

  return (
    <>
      <SceneHero scene="summit" eyebrow="Jaringan alumni" title="Alumni" desc="Mereka yang pernah berjalan bersama kita, kini berkarya di mana-mana. Terhubunglah kembali.">
        {alumni.length > 0 && (
          <dl className="mt-7 flex flex-wrap gap-x-8 gap-y-3 text-white">
            {[
              { v: alumni.length, l: "alumni" },
              { v: profesi, l: "dengan profesi tercatat" },
              { v: kota, l: "kota" },
            ].map((s) => (
              <div key={s.l} className="flex items-baseline gap-2">
                <dd className="font-display text-4xl leading-none">{s.v}</dd>
                <dt className="text-sm text-white/80">{s.l}</dt>
              </div>
            ))}
          </dl>
        )}
      </SceneHero>
      <div className="container-page pb-6">
        {alumni.length === 0 ? (
          <EmptyState>Belum ada alumni yang ditampilkan. Pengurus mengubah status anggota menjadi “Alumni” di panel admin.</EmptyState>
        ) : (
          <AlumniDirectory alumni={alumni} />
        )}
      </div>
    </>
  );
}
