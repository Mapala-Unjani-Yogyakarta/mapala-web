import { Reveal } from "@/components/site/motion";
import type { Metadata } from "next";
import Link from "next/link";
import { getPeriods } from "@/lib/data";
import { Badge, EmptyState } from "@/components/ui";
import { SceneHero } from "@/components/site/scene-section";

export const metadata: Metadata = { title: "Periode Kepengurusan" };

export default async function PeriodePage() {
  const periods = await getPeriods();
  return (
    <>
      <SceneHero scene="hills" eyebrow="Arsip" title="Periode Kepengurusan" desc="Susunan pengurus dari masa ke masa." />
      <div className="mx-auto max-w-3xl px-4 pb-6 sm:px-6">
      {periods.length === 0 ? (
        <div className="mt-8">
          <EmptyState>Belum ada periode yang dipublikasikan.</EmptyState>
        </div>
      ) : (
        <ol className="mt-8 space-y-3 border-l-2 border-brand-200 pl-6">
          {periods.map((p, i) => (
            <Reveal as="li" key={p.id} variant="left" delay={Math.min(i, 6) * 70} className="relative">
              <span aria-hidden className="absolute -left-[31px] top-5 h-3 w-3 rounded-full border-2 border-white bg-brand-500 ring-2 ring-brand-200" />
              <Link href={`/periode/${p.slug}`} className="block card lift p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-xl font-medium text-ink">{p.name}</h2>
                  {p.is_current && <Badge tone="brand">Periode saat ini</Badge>}
                </div>
                <p className="text-sm text-muted">
                  {p.year_start} – {p.year_end}
                </p>
                {p.theme && <p className="mt-2 text-sm text-body">“{p.theme}”</p>}
              </Link>
            </Reveal>
          ))}
        </ol>
      )}
      </div>
    </>
  );
}
