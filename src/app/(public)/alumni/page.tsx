import type { Metadata } from "next";
import { getAlumni, getPostsByMembers } from "@/lib/data";
import { EmptyState } from "@/components/ui";
import { SceneHero } from "@/components/site/scene-section";
import { AlumniDirectory } from "@/components/site/alumni-directory";
import type { AlumnusPost } from "@/lib/types";

export const metadata: Metadata = {
  title: "Alumni",
  description: "Jaringan alumni berdasarkan bidang dan kota: terhubung, jadi mentor, atau berkolaborasi.",
};

export default async function AlumniPage() {
  const alumni = await getAlumni();
  const posts = await getPostsByMembers(alumni.map((a) => a.id));
  const postsBy: Record<string, AlumnusPost[]> = {};
  for (const p of posts) (postsBy[p.author_member_id] ??= []).push(p);

  const kota = new Set(alumni.map((a) => a.city?.trim().toLowerCase()).filter(Boolean)).size;
  const bidang = new Set(alumni.map((a) => a.bidang).filter(Boolean)).size;
  const mentor = alumni.filter((a) => (a.open_to ?? []).includes("mentor")).length;

  return (
    <>
      <SceneHero scene="summit" eyebrow="Jaringan alumni" title="Alumni" desc="Mereka yang pernah berjalan bersama kita, kini berkarya di mana-mana. Cari berdasarkan bidang dan kota, lalu terhubunglah kembali.">
        {alumni.length > 0 && (
          <dl className="mt-7 flex flex-wrap gap-x-8 gap-y-3 text-white">
            {[
              { v: alumni.length, l: "alumni" },
              { v: bidang, l: "bidang" },
              { v: kota, l: "kota" },
              { v: mentor, l: "bersedia jadi mentor" },
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
          <AlumniDirectory alumni={alumni} posts={postsBy} />
        )}
      </div>
    </>
  );
}
