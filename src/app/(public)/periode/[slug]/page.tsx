import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPeriodBySlug, getPeriods, getPositions } from "@/lib/data";
import { Badge, EmptyState } from "@/components/ui";
import { SceneHero } from "@/components/site/scene-section";
import { PersonCard } from "@/components/site/person-card";
import type { PositionWithMember } from "@/lib/types";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await getPeriodBySlug(slug);
  return { title: p ? `Pengurus ${p.name}` : "Periode" };
}

function groupByDivision(items: PositionWithMember[]) {
  const groups = new Map<string, PositionWithMember[]>();
  for (const it of items) {
    const key = it.division?.trim() || "Pengurus Inti";
    groups.set(key, [...(groups.get(key) ?? []), it]);
  }
  return [...groups.entries()];
}

export default async function PeriodeDetailPage({ params }: Props) {
  const { slug } = await params;
  const period = await getPeriodBySlug(slug);
  if (!period) notFound();
  const [positions, periods] = await Promise.all([getPositions(period.id), getPeriods()]);
  const groups = groupByDivision(positions);

  return (
    <>
      <SceneHero
        scene="camp"
        eyebrow={`${period.year_start} – ${period.year_end}`}
        title={period.name}
        desc={period.theme ? `“${period.theme}”` : undefined}
        back={{ href: "/periode", label: "Semua periode" }}
      >
        {period.is_current && (
          <div className="mt-5">
            <Badge tone="brand">Periode saat ini</Badge>
          </div>
        )}
      </SceneHero>

      <div className="container-page pb-6">
        {period.vision && <p className="max-w-3xl whitespace-pre-line text-lg leading-relaxed text-body">{period.vision}</p>}

        {periods.length > 1 && (
          <nav aria-label="Pilih periode" className="mt-8 flex flex-wrap gap-2">
            {periods.map((p) => (
              <Link
                key={p.id}
                href={`/periode/${p.slug}`}
                aria-current={p.id === period.id ? "page" : undefined}
                className={
                  "rounded-full border px-4 py-1.5 text-sm transition-colors " +
                  (p.id === period.id ? "border-brand-700 bg-brand-700 text-white" : "border-line-strong bg-surface text-body hover:border-brand-400")
                }
              >
                {p.name}
              </Link>
            ))}
          </nav>
        )}

        <div className="mt-12 space-y-12">
          {groups.length === 0 && <EmptyState>Susunan pengurus periode ini belum diisi.</EmptyState>}
          {groups.map(([division, items]) => (
            <section key={division}>
              <h2 className="eyebrow mb-4 border-b border-line pb-3">{division}</h2>
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((p) => (
                  <li key={p.id}>
                    <PersonCard
                      name={p.members.full_name}
                      role={p.title}
                      nickname={p.members.nickname}
                      meta={p.members.angkatan ? `Angkatan ${p.members.angkatan}` : null}
                      photo={p.members.photo_url}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
