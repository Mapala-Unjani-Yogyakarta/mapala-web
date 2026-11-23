import type { Metadata } from "next";
import Link from "next/link";
import { getAllPublicMembers, getAngkatanProfiles, getCurrentRoles } from "@/lib/data";
import { EmptyState } from "@/components/ui";
import { SceneHero } from "@/components/site/scene-section";
import { MemberDirectory } from "@/components/site/member-directory";

export const metadata: Metadata = {
  title: "Anggota",
  description: "Seluruh anggota dari setiap angkatan: aktif, alumni, dan anggota luar biasa.",
};

export default async function AnggotaPage() {
  const [members, roles, profiles] = await Promise.all([getAllPublicMembers(), getCurrentRoles(), getAngkatanProfiles()]);
  const angkatanCount = new Set(members.map((m) => m.angkatan?.trim()).filter(Boolean)).size;
  const board = members.filter((m) => roles[m.id]).length;
  const alumni = members.filter((m) => m.status === "alumni").length;
  const profileNames = Object.fromEntries(profiles.map((p) => [p.code, p.name]));

  return (
    <>
      <SceneHero scene="trail" eyebrow="Keluarga besar" title="Anggota" desc="Seluruh anggota dari setiap angkatan, dari yang kini aktif sampai para alumni.">
        {members.length > 0 && (
          <dl className="mt-7 flex flex-wrap gap-x-8 gap-y-3 text-white">
            {[
              { v: members.length, l: "anggota" },
              { v: angkatanCount, l: "angkatan" },
              { v: alumni, l: "alumni" },
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
        <p className="mb-6 text-sm text-muted">
          Ingin menelusuri alumni berdasarkan bidang dan kota?{" "}
          <Link href="/alumni" className="font-medium text-brand-700 hover:text-brand-900 hover:underline">
            Lihat jaringan alumni →
          </Link>
        </p>
        {members.length === 0 ? <EmptyState>Belum ada anggota yang ditampilkan.</EmptyState> : <MemberDirectory members={members} roles={roles} profiles={profileNames} />}
      </div>
    </>
  );
}
