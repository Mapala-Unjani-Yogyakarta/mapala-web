import type { Metadata } from "next";
import { getAlumni, getPostsByMembers } from "@/lib/data";
import Link from "next/link";
import { Avatar, EmptyState } from "@/components/ui";
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

  const sorotan = alumni
    .filter((a) => a.spotlight_at)
    .sort((a, b) => String(a.spotlight_at).localeCompare(String(b.spotlight_at)))
    .slice(0, 3);
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
        <Link href="/alumni/gabung" className="mt-7 inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-medium text-brand-800 transition-colors hover:bg-brand-50">
          Gabung jaringan alumni
        </Link>
      </SceneHero>
      {sorotan.length > 0 && (
        <section className="container-page pt-10" aria-labelledby="sorotan">
          <p className="eyebrow">Sorotan</p>
          <h2 id="sorotan" className="section-title">Sorotan alumni</h2>
          <ul className="mt-6 grid gap-5 md:grid-cols-3">
            {sorotan.map((a) => (
              <li key={a.id} className="card flex flex-col items-center gap-3 p-6 text-center">
                <Avatar src={a.photo_url} name={a.full_name} size={96} />
                <div>
                  <p className="font-display text-2xl text-ink">{a.full_name}</p>
                  <p className="text-sm text-muted">
                    {[a.angkatan ? `Angkatan ${a.angkatan}` : null, [a.profession, a.workplace].filter(Boolean).join(", ") || null].filter(Boolean).join(" · ")}
                  </p>
                </div>
                {a.spotlight_quote && <blockquote className="text-sm leading-relaxed text-body">“{a.spotlight_quote}”</blockquote>}
              </li>
            ))}
          </ul>
        </section>
      )}
      <div className="container-page pb-6 pt-8">
        {alumni.length === 0 ? (
          <EmptyState>
            Belum ada alumni yang ditampilkan. <Link href="/alumni/gabung" className="text-brand-700 underline">Gabung jaringan alumni</Link> atau minta pengurus mengubah statusmu menjadi “Alumni”.
          </EmptyState>
        ) : (
          <AlumniDirectory alumni={alumni} posts={postsBy} />
        )}
        <p className="mt-10 rounded-control bg-brand-50 px-4 py-3 text-center text-sm text-body">
          Alumni Mapala Unjani Yogyakarta tapi belum tampil di sini? <Link href="/alumni/gabung" className="font-medium text-brand-700 underline">Gabung jaringan alumni</Link>
        </p>
      </div>
    </>
  );
}
