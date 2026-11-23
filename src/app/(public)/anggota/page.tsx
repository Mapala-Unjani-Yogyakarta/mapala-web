import type { Metadata } from "next";
import Link from "next/link";
import { getAlumni, getAngkatanProfiles, getCurrentRoles, getPublicMembers } from "@/lib/data";
import { angkatanValue } from "@/lib/utils";
import { EmptyState } from "@/components/ui";
import { SceneHero } from "@/components/site/scene-section";
import { MemberDirectory } from "@/components/site/member-directory";

export const metadata: Metadata = {
  title: "Anggota",
  description: "Anggota aktif dari setiap angkatan beserta jabatannya saat ini.",
};

export default async function AnggotaPage() {
  const [members, roles, profiles, alumni] = await Promise.all([getPublicMembers(), getCurrentRoles(), getAngkatanProfiles(), getAlumni()]);
  const angkatanCount = new Set(members.map((m) => m.angkatan?.trim()).filter(Boolean)).size;
  const board = members.filter((m) => roles[m.id]).length;
  // Angkatan yang tidak lagi punya anggota aktif (seluruhnya alumni) tidak punya blok di bawah, jadi ditautkan di sini.
  const activeCodes = new Set(members.map((m) => m.angkatan?.trim()).filter(Boolean));
  const alumniOnly = [...new Set([...alumni.map((a) => a.angkatan?.trim()), ...profiles.map((p) => p.code)].filter((c): c is string => !!c && !activeCodes.has(c)))].sort(
    (a, b) => angkatanValue(b) - angkatanValue(a),
  );
  const profileNames = Object.fromEntries(profiles.map((p) => [p.code, p.name]));

  return (
    <>
      <SceneHero scene="trail" eyebrow="Keluarga yang sedang berjalan" title="Anggota" desc="Mereka yang kini aktif menjaga api organisasi, dari setiap angkatan.">
        {members.length > 0 && (
          <dl className="mt-7 flex flex-wrap gap-x-8 gap-y-3 text-white">
            {[
              { v: members.length, l: "anggota aktif" },
              { v: angkatanCount, l: "angkatan" },
              { v: board, l: "pengurus" },
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
        <p className="mb-8 rounded-card bg-brand-50 px-5 py-3 text-sm text-body">
          Mencari yang sudah lulus? Lihat{" "}
          <Link href="/alumni" className="font-medium text-brand-700 underline underline-offset-4">
            jaringan alumni
          </Link>{" "}
          berdasarkan bidang dan kota.
        </p>
        {alumniOnly.length > 0 && (
          <p className="mb-8 text-sm text-muted">
            Angkatan yang seluruhnya sudah menjadi alumni:{" "}
            {alumniOnly.map((c, i) => (
              <span key={c}>
                {i > 0 && ", "}
                <Link href={`/angkatan/${c}`} className="font-medium text-brand-700 hover:text-brand-900 hover:underline">
                  {c}
                </Link>
              </span>
            ))}{" "}
            →
          </p>
        )}
        {members.length === 0 ? <EmptyState>Belum ada anggota aktif yang ditampilkan.</EmptyState> : <MemberDirectory members={members} roles={roles} profiles={profileNames} />}
      </div>
    </>
  );
}
