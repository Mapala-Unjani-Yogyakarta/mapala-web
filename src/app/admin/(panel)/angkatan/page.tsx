import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { angkatanValue, buildAngkatanOptions, normalizeAngkatan } from "@/lib/utils";
import type { AngkatanProfile } from "@/lib/types";
import { CodePicker } from "./code-picker";

export default async function AngkatanAdminPage() {
  const { supabase } = await requireAdmin();
  const [{ data: prof }, { data: mem }] = await Promise.all([supabase.from("angkatan").select("*"), supabase.from("members").select("angkatan, status")]);
  const profiles = new Map(((prof ?? []) as AngkatanProfile[]).map((p) => [p.code, p]));
  const count = new Map<string, { total: number }>();
  const raw: (string | null)[] = [];
  for (const m of (mem ?? []) as { angkatan: string | null }[]) {
    raw.push(m.angkatan);
    const c = normalizeAngkatan(m.angkatan);
    if (c) count.set(c, { total: (count.get(c)?.total ?? 0) + 1 });
  }
  const codes = [...new Set([...count.keys(), ...profiles.keys()])].sort((a, b) => angkatanValue(b) - angkatanValue(a));
  const addable = buildAngkatanOptions(raw).filter((c) => !profiles.has(c));

  return (
    <>
      <PageHeader title="Profil Angkatan" desc="Julukan, motto, tahun masuk, dan foto bersama tiap angkatan. Tampil di halaman Angkatan, Anggota, dan Alumni." action={<CodePicker options={addable} />} />
      {codes.length === 0 ? (
        <EmptyState>Belum ada angkatan. Tambahkan anggota dengan angkatan terlebih dahulu.</EmptyState>
      ) : (
        <div className="overflow-hidden rounded-card border border-line bg-surface">
          <ul className="divide-y divide-line">
            {codes.map((c) => {
              const p = profiles.get(c);
              return (
                <li key={c}>
                  <Link href={`/admin/angkatan/${c}`} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 hover:bg-sunken">
                    <div className="min-w-0">
                      <p className="font-medium text-ink">
                        <span className="font-display text-xl">{c}</span> {p?.name ? <span className="text-muted">· “{p.name}”</span> : null}
                      </p>
                      <p className="text-xs text-muted">{count.get(c)?.total ?? 0} anggota tercatat{p?.entry_year ? ` · masuk ${p.entry_year}` : ""}</p>
                    </div>
                    <Badge tone={p ? "brand" : "neutral"}>{p ? "Profil terisi" : "Belum ada profil"}</Badge>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      <Card className="mt-6 text-sm text-muted">Angkatan muncul di sini otomatis dari data anggota. Profil bersifat opsional: tanpa profil, halaman angkatan tetap tampil dengan daftar anggotanya.</Card>
    </>
  );
}
