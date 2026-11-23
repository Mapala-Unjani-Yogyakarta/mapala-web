import type { Metadata } from "next";
import Link from "next/link";
import { getAngkatanProfiles, getCurrentRoles, getPublicMembers } from "@/lib/data";
import { EmptyState } from "@/components/ui";
import { SceneHero } from "@/components/site/scene-section";
import { MemberDirectory } from "@/components/site/member-directory";

export const metadata: Metadata = {
  title: "Anggota",
  description: "Anggota aktif dari setiap angkatan beserta jabatannya saat ini.",
};

export default async function AnggotaPage() {
  const [members, roles, profiles] = await Promise.all([getPublicMembers(), getCurrentRoles(), getAngkatanProfiles()]);
  const angkatanCount = new Set(members.map((m) => m.angkatan?.trim()).filter(Boolean)).size;
  const board = members.filter((m) => roles[m.id]).length;
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
        {members.length === 0 ? <EmptyState>Belum ada anggota aktif yang ditampilkan.</EmptyState> : <MemberDirectory members={members} roles={roles} profiles={profileNames} />}
      </div>
    </>
  );
}
