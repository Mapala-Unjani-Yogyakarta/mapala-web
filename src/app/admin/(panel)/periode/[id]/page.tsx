import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { ActionForm, SubmitButton } from "@/components/form";
import { Card, EmptyState, Field, PageHeader, inputCls } from "@/components/ui";
import type { Period } from "@/lib/types";
import { PeriodForm } from "../period-form";
import { addPosition, deletePeriod, deletePosition } from "../actions";

const TITLES = ["Ketua Umum", "Wakil Ketua", "Sekretaris Umum", "Sekretaris", "Bendahara Umum", "Bendahara", "Koordinator Divisi", "Kepala Divisi", "Anggota Divisi"];

export default async function PeriodDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();

  const [{ data: period }, { data: positions }, { data: members }] = await Promise.all([
    supabase.from("periods").select("*").eq("id", id).maybeSingle(),
    supabase.from("positions").select("id, title, division, sort_order, members(id, full_name)").eq("period_id", id).order("sort_order").order("title"),
    supabase.from("members").select("id, full_name, angkatan").order("full_name"),
  ]);
  if (!period) notFound();

  return (
    <>
      <PageHeader title={(period as Period).name} back={{ href: "/admin/periode", label: "Semua periode" }} />
      <div className="space-y-6">
        <Card>
          <h2 className="mb-4 font-semibold">Informasi periode</h2>
          <PeriodForm period={period as Period} />
        </Card>

        <Card>
          <h2 className="mb-1 font-semibold">Susunan pengurus</h2>
          <p className="mb-4 text-sm text-muted">Urutan tampil mengikuti angka urut (kecil → atas). Jabatan tanpa divisi masuk grup “Pengurus Inti”.</p>

          {(positions ?? []).length === 0 ? (
            <EmptyState>Belum ada pengurus di periode ini.</EmptyState>
          ) : (
            <div className="overflow-x-auto rounded-control border border-line">
              <table className="w-full text-sm">
                <thead className="bg-sunken text-left text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-3 py-2 font-medium">Urut</th>
                    <th className="px-3 py-2 font-medium">Nama</th>
                    <th className="px-3 py-2 font-medium">Jabatan</th>
                    <th className="px-3 py-2 font-medium">Divisi</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {(positions as unknown as { id: string; title: string; division: string | null; sort_order: number; members: { id: string; full_name: string } | null }[]).map((p) => (
                    <tr key={p.id}>
                      <td className="px-3 py-2 text-muted">{p.sort_order}</td>
                      <td className="px-3 py-2">
                        <Link href={`/admin/anggota/${p.members?.id}`} className="font-medium text-brand-800 hover:underline">
                          {p.members?.full_name}
                        </Link>
                      </td>
                      <td className="px-3 py-2">{p.title}</td>
                      <td className="px-3 py-2 text-muted">{p.division ?? "—"}</td>
                      <td className="px-3 py-2 text-right">
                        <ActionForm action={deletePosition}>
                          <input type="hidden" name="id" value={p.id} />
                          <input type="hidden" name="period_id" value={id} />
                          <SubmitButton variant="danger" pendingText="…" confirm="Hapus jabatan ini?" className="!px-3 !py-1">
                            Hapus
                          </SubmitButton>
                        </ActionForm>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-6 border-t border-line pt-5">
            <h3 className="mb-3 text-sm font-semibold">Tambah pengurus</h3>
            {(members ?? []).length === 0 ? (
              <p className="text-sm text-muted">Tambahkan anggota terlebih dahulu di menu Anggota.</p>
            ) : (
              <ActionForm action={addPosition} resetOnSuccess className="grid gap-3 sm:grid-cols-2">
                <input type="hidden" name="period_id" value={id} />
                <Field label="Anggota" required className="sm:col-span-2">
                  <select name="member_id" required defaultValue="" className={inputCls}>
                    <option value="" disabled>
                      Pilih anggota…
                    </option>
                    {(members as { id: string; full_name: string; angkatan: string | null }[]).map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.full_name}
                        {m.angkatan ? ` (${m.angkatan})` : ""}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Jabatan" required>
                  <input name="title" required list="titles" maxLength={80} className={inputCls} placeholder="Contoh: Ketua Umum" />
                  <datalist id="titles">
                    {TITLES.map((t) => (
                      <option key={t} value={t} />
                    ))}
                  </datalist>
                </Field>
                <Field label="Divisi" hint="Kosongkan untuk pengurus inti">
                  <input name="division" maxLength={80} className={inputCls} placeholder="Contoh: Divisi Pendidikan" />
                </Field>
                <Field label="Urutan" hint="Makin kecil makin atas">
                  <input name="sort_order" type="number" min={0} max={9999} defaultValue={100} className={inputCls} />
                </Field>
                <div className="flex items-end">
                  <SubmitButton pendingText="Menambah…">Tambah</SubmitButton>
                </div>
              </ActionForm>
            )}
          </div>
        </Card>

        <Card className="border-danger-200">
          <h2 className="font-semibold text-danger-700">Hapus periode</h2>
          <p className="mb-3 mt-1 text-sm text-muted">Seluruh susunan pengurus di periode ini ikut terhapus. Data anggota tidak terhapus.</p>
          <ActionForm action={deletePeriod}>
            <input type="hidden" name="id" value={id} />
            <SubmitButton variant="danger" confirm="Hapus periode ini beserta susunan pengurusnya?">
              Hapus periode
            </SubmitButton>
          </ActionForm>
        </Card>
      </div>
    </>
  );
}
