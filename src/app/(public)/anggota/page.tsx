import type { Metadata } from "next";
import { getPublicMembers } from "@/lib/data";
import { EmptyState } from "@/components/ui";
import { SceneHero } from "@/components/site/scene-section";
import { MemberDirectory } from "@/components/site/member-directory";

export const metadata: Metadata = {
  title: "Anggota",
  description: "Daftar anggota dari setiap angkatan.",
};

export default async function AnggotaPage() {
  const members = await getPublicMembers();
  const angkatanCount = new Set(members.map((m) => m.angkatan?.trim()).filter(Boolean)).size;
  const alumni = members.filter((m) => m.status === "alumni").length;

  return (
    <>
      <SceneHero scene="trail" eyebrow="Keluarga besar" title="Anggota" desc="Seluruh anggota dari setiap angkatan, dari yang baru bergabung sampai para alumni.">
        {members.length > 0 && (
          <dl className="mt-7 flex flex-wrap gap-x-8 gap-y-3 text-white">
            {[
              { v: members.length, l: "anggota" },
              { v: angkatanCount, l: "angkatan" },
              { v: alumni, l: "alumni" },
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
        {members.length === 0 ? (
          <EmptyState>Belum ada anggota yang ditampilkan.</EmptyState>
        ) : (
          <MemberDirectory members={members} />
        )}
      </div>
    </>
  );
}
