import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import type { Period } from "@/lib/types";
import { PeriodForm } from "./period-form";

export default async function PeriodsPage() {
  const { supabase } = await requireAdmin();
  const [{ data }, { data: pos }] = await Promise.all([
    supabase.from("periods").select("*").order("year_start", { ascending: false }),
    supabase.from("positions").select("period_id"),
  ]);
  const periods = (data ?? []) as Period[];
  const counts = new Map<string, number>();
  for (const p of (pos ?? []) as { period_id: string }[]) counts.set(p.period_id, (counts.get(p.period_id) ?? 0) + 1);

  return (
    <>
      <PageHeader title="Periode & Pengurus" desc="Kelola periode kepengurusan, lalu tetapkan siapa menjabat apa di tiap periode." />

      {periods.length === 0 ? (
        <EmptyState>Belum ada periode. Buat periode pertama di bawah.</EmptyState>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {periods.map((p) => (
            <li key={p.id}>
              <Link href={`/admin/periode/${p.id}`} className="block card p-4 hover:border-brand-400">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{p.name}</span>
                  {p.is_current && <Badge tone="brand">Saat ini</Badge>}
                </div>
                <p className="text-sm text-muted">
                  {p.year_start} – {p.year_end} · {counts.get(p.id) ?? 0} jabatan
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Card className="mt-8">
        <h2 className="mb-4 font-semibold">Buat periode baru</h2>
        <PeriodForm />
      </Card>
    </>
  );
}
