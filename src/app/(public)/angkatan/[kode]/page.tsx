import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAlumni, getAngkatanProfiles, getCurrentRoles, getPublicMembers } from "@/lib/data";
import { Badge, EmptyState } from "@/components/ui";
import { PageHero } from "@/components/site/page-hero";
import { normalizeAngkatan } from "@/lib/utils";

type Props = { params: Promise<{ kode: string }> };

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { kode } = await params;
  const code = normalizeAngkatan(decodeURIComponent(kode));
  return { title: code ? `Angkatan ${code}` : "Angkatan" };
}

export default async function AngkatanPage({ params }: Props) {
  const { kode } = await params;
  const code = normalizeAngkatan(decodeURIComponent(kode));
  if (!code) notFound();
  if (code !== decodeURIComponent(kode)) redirect(`/angkatan/${code}`); // mis. xiii / 13 → XIII

  const [members, alumni, profiles, roles] = await Promise.all([getPublicMembers(), getAlumni(), getAngkatanProfiles(), getCurrentRoles()]);
  const profile = profiles.find((p) => p.code === code);
  const aktif = members.filter((m) => m.angkatan?.trim() === code);
  const lulus = alumni.filter((a) => a.angkatan?.trim() === code);
  if (!profile && aktif.length === 0 && lulus.length === 0) notFound();

  return (
    <>
      <PageHero
        eyebrow={profile?.entry_year ? `Masuk tahun ${profile.entry_year}` : "Profil angkatan"}
        title={`Angkatan ${code}`}
        desc={profile?.name ? `“${profile.name}”` : undefined}
        back={{ href: "/angkatan", label: "Semua angkatan" }}
      >
        {profile?.motto && <p className="mt-4 max-w-xl font-display text-2xl italic text-sky-800/90">{profile.motto}</p>}
      </PageHero>

      <div className="container-page pb-6">
        {(profile?.photo_url || profile?.description) && (
          <div className="mb-14 grid gap-8 md:grid-cols-2 md:items-center">
            {profile?.photo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.photo_url} alt={`Foto bersama angkatan ${code}`} className="aspect-[4/3] w-full rounded-panel object-cover" />
            )}
            {profile?.description && <p className="whitespace-pre-line text-lg leading-relaxed text-body">{profile.description}</p>}
          </div>
        )}

        <section aria-labelledby="aktif" className="mb-14">
          <div className="mb-5 flex items-baseline justify-between border-b border-line pb-3">
            <h2 id="aktif" className="font-display text-4xl tracking-tight text-ink">Anggota aktif</h2>
            <span className="text-sm text-muted">{aktif.length} orang</span>
          </div>
          {aktif.length === 0 ? (
            <EmptyState>Belum ada anggota aktif dari angkatan ini.</EmptyState>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {aktif.map((m) => (
                <li key={m.id} className="card overflow-hidden">
                  <div className="relative aspect-square bg-gradient-to-br from-brand-100 to-sky-100">
                    {m.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.photo_url} alt={m.full_name} loading="lazy" className="h-full w-full object-cover" />
                    ) : (
                      <span aria-hidden className="grid h-full place-items-center font-display text-5xl text-brand-600/70">{initials(m.full_name)}</span>
                    )}
                    {roles[m.id] && (
                      <span className="absolute left-2 top-2">
                        <Badge tone="brand">{roles[m.id].title}</Badge>
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="truncate font-medium text-ink">{m.full_name}</p>
                    {m.nickname && <p className="truncate font-display text-lg italic leading-tight text-brand-700">“{m.nickname}”</p>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="alumni">
          <div className="mb-5 flex items-baseline justify-between border-b border-line pb-3">
            <h2 id="alumni" className="font-display text-4xl tracking-tight text-ink">Alumni</h2>
            <span className="text-sm text-muted">{lulus.length} orang</span>
          </div>
          {lulus.length === 0 ? (
            <EmptyState>Belum ada alumni dari angkatan ini yang ditampilkan.</EmptyState>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {lulus.map((a) => (
                <li key={a.id} className="card p-4">
                  <p className="font-medium text-ink">{a.full_name}</p>
                  <p className="text-sm text-muted">{[a.profession, a.workplace].filter(Boolean).join(" · ") || "—"}</p>
                  {a.city && <p className="text-xs text-muted">{a.city}</p>}
                </li>
              ))}
            </ul>
          )}
          {lulus.length > 0 && (
            <p className="mt-5 text-sm">
              <Link href="/alumni" className="font-medium text-brand-700 hover:text-brand-900">Lihat jaringan alumni & minta dikenalkan →</Link>
            </p>
          )}
        </section>
      </div>
    </>
  );
}
