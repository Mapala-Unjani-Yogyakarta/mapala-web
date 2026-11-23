import type { Metadata } from "next";
import Link from "next/link";
import { getAlumni, getAngkatanProfiles, getPublicMembers } from "@/lib/data";
import { EmptyState } from "@/components/ui";
import { SceneHero } from "@/components/site/scene-section";
import { angkatanValue } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Angkatan",
  description: "Profil tiap angkatan: julukan, motto, tahun masuk, anggota, dan alumni.",
};

export default async function AngkatanIndexPage() {
  const [members, alumni, profiles] = await Promise.all([getPublicMembers(), getAlumni(), getAngkatanProfiles()]);
  const byCode = new Map(profiles.map((p) => [p.code, p]));
  const stats = new Map<string, { aktif: number; alumni: number }>();
  const bump = (code: string | null | undefined, k: "aktif" | "alumni") => {
    const c = code?.trim();
    if (!c) return;
    const cur = stats.get(c) ?? { aktif: 0, alumni: 0 };
    cur[k]++;
    stats.set(c, cur);
  };
  members.forEach((m) => bump(m.angkatan, "aktif"));
  alumni.forEach((a) => bump(a.angkatan, "alumni"));
  const codes = [...new Set([...stats.keys(), ...profiles.map((p) => p.code)])].sort((a, b) => angkatanValue(b) - angkatanValue(a));

  return (
    <>
      <SceneHero scene="camp" eyebrow="Satu angkatan, satu cerita" title="Angkatan" desc="Setiap angkatan punya julukan, semangat, dan jejaknya sendiri. Kenali mereka satu per satu." />
      <div className="container-page pb-6">
        {codes.length === 0 ? (
          <EmptyState>Belum ada data angkatan.</EmptyState>
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {codes.map((c) => {
              const p = byCode.get(c);
              const s = stats.get(c) ?? { aktif: 0, alumni: 0 };
              return (
                <li key={c}>
                  <Link href={`/angkatan/${c}`} className="card-link group block overflow-hidden">
                    <div className="relative aspect-[16/9] bg-gradient-to-br from-brand-100 to-sky-100">
                      {p?.photo_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.photo_url} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
                      )}
                      <span className="absolute bottom-2 left-4 font-display text-6xl leading-none text-white drop-shadow-[0_2px_16px_rgba(16,24,50,0.55)]">{c}</span>
                    </div>
                    <div className="p-4">
                      <p className="font-display text-xl text-ink">{p?.name ? `“${p.name}”` : `Angkatan ${c}`}</p>
                      <p className="mt-1 text-sm text-muted">
                        {p?.entry_year ? `Masuk ${p.entry_year} · ` : ""}
                        {s.aktif} aktif · {s.alumni} alumni
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
