import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { ActionForm, SubmitButton } from "@/components/form";
import { Avatar, Badge, Card, EmptyState, PageHeader, inputCls } from "@/components/ui";
import { FIELD_LABELS } from "@/lib/validation";
import { formatDate } from "@/lib/utils";
import type { Submission } from "@/lib/types";
import { approveSubmission, rejectSubmission } from "./actions";

const FIELDS = Object.keys(FIELD_LABELS);

/** Nilai tampil: daftar (mis. "terbuka untuk") digabung dengan koma, kosong = "". */
const str = (v: unknown): string => (Array.isArray(v) ? v.join(", ") : v == null ? "" : String(v));

export default async function VerificationPage() {
  const { supabase } = await requireAdmin();

  const [{ data: pendingRaw }, { data: historyRaw }] = await Promise.all([
    supabase.from("member_submissions").select("*").eq("status", "pending").order("submitted_at", { ascending: true }),
    supabase.from("member_submissions").select("*").neq("status", "pending").order("reviewed_at", { ascending: false }).limit(10),
  ]);
  const pending = (pendingRaw ?? []) as Submission[];
  const history = (historyRaw ?? []) as Submission[];

  // Data saat ini untuk pengajuan "ubah", supaya perbedaannya terlihat
  const editIds = pending.filter((p) => p.member_id).map((p) => p.member_id as string);
  const [{ data: members }, { data: privs }] = editIds.length
    ? await Promise.all([
        supabase.from("members").select("*").in("id", editIds),
        supabase.from("member_private").select("*").in("member_id", editIds),
      ])
    : [{ data: [] }, { data: [] }];
  const current = new Map<string, Record<string, unknown>>();
  for (const id of editIds) {
    const m = (members ?? []).find((x: { id: string }) => x.id === id);
    const p = (privs ?? []).find((x: { member_id: string }) => x.member_id === id);
    current.set(id, { ...(p ?? {}), ...(m ?? {}) });
  }

  return (
    <>
      <PageHeader title="Verifikasi" desc="Periksa data yang dikirim anggota sebelum tampil di website." />

      {pending.length === 0 ? (
        <EmptyState>Tidak ada pengajuan yang menunggu. 🎉</EmptyState>
      ) : (
        <div className="space-y-5">
          {pending.map((s) => {
            const now = s.member_id ? current.get(s.member_id) : null;
            return (
              <Card key={s.id}>
                <div className="flex flex-wrap items-center gap-3">
                  <Avatar src={s.photo_url ?? (now?.photo_url as string | null | undefined)} name={str(s.payload.full_name) || "?"} size={48} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{str(s.payload.full_name)}</p>
                    <p className="text-xs text-muted">Dikirim {formatDate(s.submitted_at)}</p>
                  </div>
                  <Badge tone={s.kind === "baru" ? "brand" : "warn"}>{s.kind === "baru" ? "Anggota baru" : "Perubahan data"}</Badge>
                  {s.member_id && (
                    <Link href={`/admin/anggota/${s.member_id}`} className="text-sm text-brand-700 hover:underline">
                      Buka profil
                    </Link>
                  )}
                </div>

                <table className="mt-4 w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-muted">
                      <th className="w-1/4 py-1 pr-3 font-medium">Data</th>
                      {now && <th className="py-1 pr-3 font-medium">Sekarang</th>}
                      <th className="py-1 font-medium">{now ? "Diajukan" : "Isi"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {FIELDS.map((k) => {
                      const next = str(s.payload[k]);
                      const prev = str(now?.[k]);
                      if (!next && !prev) return null;
                      const changed = !!now && next !== prev;
                      return (
                        <tr key={k} className={changed ? "bg-warn-50" : undefined}>
                          <td className="py-1.5 pr-3 text-muted">{FIELD_LABELS[k]}</td>
                          {now && <td className="py-1.5 pr-3 text-muted">{prev || "—"}</td>}
                          <td className={"py-1.5 break-words " + (changed ? "font-semibold" : "")}>{next || "—"}</td>
                        </tr>
                      );
                    })}
                    {s.photo_url && now && (
                      <tr className="bg-warn-50">
                        <td className="py-1.5 pr-3 text-muted">Foto</td>
                        <td className="py-1.5 pr-3 text-muted">{now.photo_url ? "Ada" : "—"}</td>
                        <td className="py-1.5 font-semibold">Foto baru</td>
                      </tr>
                    )}
                  </tbody>
                </table>

                <div className="mt-5 flex flex-wrap items-start gap-4 border-t border-line pt-4">
                  <ActionForm action={approveSubmission}>
                    <input type="hidden" name="id" value={s.id} />
                    <SubmitButton pendingText="Menyetujui…">Setujui</SubmitButton>
                  </ActionForm>
                  <ActionForm action={rejectSubmission} className="flex flex-1 flex-wrap items-start gap-2">
                    <input type="hidden" name="id" value={s.id} />
                    <input name="reason" placeholder="Alasan penolakan (opsional)" maxLength={300} className={inputCls + " min-w-48 flex-1"} aria-label="Alasan penolakan" />
                    <SubmitButton variant="danger" confirm="Tolak pengajuan ini?">
                      Tolak
                    </SubmitButton>
                  </ActionForm>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {history.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 font-semibold">Riwayat terakhir</h2>
          <ul className="divide-y divide-line card text-sm">
            {history.map((h) => (
              <li key={h.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
                <span className="min-w-0 truncate">{str(h.payload.full_name)}</span>
                <span className="flex items-center gap-2">
                  {h.reject_reason && <span className="text-xs text-muted">{h.reject_reason}</span>}
                  <Badge tone={h.status === "approved" ? "brand" : "danger"}>{h.status === "approved" ? "Disetujui" : "Ditolak"}</Badge>
                  <span className="text-xs text-muted">{formatDate(h.reviewed_at)}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
