import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { ActionForm, SubmitButton } from "@/components/form";
import { Badge, Card, EmptyState, PageHeader, inputCls, type BadgeTone } from "@/components/ui";
import { cx, formatDate, waNumber } from "@/lib/utils";
import { deleteIntro, setIntroStatus } from "./actions";

type Status = "baru" | "diteruskan" | "selesai";
const STATUS: Record<Status, { label: string; tone: BadgeTone }> = {
  baru: { label: "Baru", tone: "warn" },
  diteruskan: { label: "Sudah diteruskan", tone: "accent" },
  selesai: { label: "Selesai", tone: "brand" },
};
const ORDER: Status[] = ["baru", "diteruskan", "selesai"];

type Row = { id: string; member_id: string; requester_name: string; requester_contact: string; message: string; status: Status; note: string | null; created_at: string };

export default async function IntroRequestsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const sp = await searchParams;
  const { supabase } = await requireAdmin();
  const [{ data }, { data: members }, { data: privs }] = await Promise.all([
    supabase.from("intro_requests").select("*").order("created_at", { ascending: false }).limit(300),
    supabase.from("members").select("id, full_name, angkatan, profession"),
    supabase.from("member_private").select("member_id, email, phone"),
  ]);
  const all = (data ?? []) as Row[];
  const filter = ORDER.includes(sp.status as Status) ? (sp.status as Status) : null;
  const rows = all.filter((r) => !filter || r.status === filter).sort((a, b) => ORDER.indexOf(a.status) - ORDER.indexOf(b.status) || +new Date(b.created_at) - +new Date(a.created_at));
  const memberOf = new Map(((members ?? []) as { id: string; full_name: string; angkatan: string | null; profession: string | null }[]).map((m) => [m.id, m]));
  const privOf = new Map(((privs ?? []) as { member_id: string; email: string | null; phone: string | null }[]).map((p) => [p.member_id, p]));
  const count = (s: Status) => all.filter((r) => r.status === s).length;

  return (
    <>
      <PageHeader title="Permintaan Kenalan" desc="Pengunjung yang ingin dikenalkan dengan alumni. Kontak alumni tidak dibuka ke publik: tanyakan kesediaan alumni lalu sambungkan keduanya." />

      <div className="mb-5 flex flex-wrap gap-2">
        <Link href="/admin/permintaan" className={cx("rounded-full border px-4 py-1.5 text-sm", !filter ? "border-brand-700 bg-brand-700 text-white" : "border-line-strong bg-surface text-body hover:border-brand-400")}>
          Semua · {all.length}
        </Link>
        {ORDER.map((s) => (
          <Link key={s} href={`/admin/permintaan?status=${s}`} className={cx("rounded-full border px-4 py-1.5 text-sm", filter === s ? "border-brand-700 bg-brand-700 text-white" : "border-line-strong bg-surface text-body hover:border-brand-400")}>
            {STATUS[s].label} · {count(s)}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <EmptyState>Belum ada permintaan{filter ? " di kategori ini" : ""}.</EmptyState>
      ) : (
        <div className="space-y-4">
          {rows.map((r) => {
            const m = memberOf.get(r.member_id);
            const pv = privOf.get(r.member_id);
            const waHref = pv?.phone ? `https://wa.me/${waNumber(pv.phone)}?text=${encodeURIComponent(`Halo ${m?.full_name ?? ""}, ada yang ingin berkenalan denganmu lewat website Mapala: ${r.requester_name}. Bersedia dikenalkan?`)}` : null;
            return (
              <Card key={r.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-muted">
                      <strong className="text-ink">{r.requester_name}</strong> ingin dikenalkan dengan{" "}
                      <Link href={`/admin/anggota/${r.member_id}`} className="font-medium text-brand-700 hover:underline">{m?.full_name ?? "alumni"}</Link>
                      {m?.angkatan ? ` (angkatan ${m.angkatan})` : ""}
                    </p>
                    <p className="text-xs text-muted">{formatDate(r.created_at)}</p>
                  </div>
                  <Badge tone={STATUS[r.status].tone}>{STATUS[r.status].label}</Badge>
                </div>
                <p className="mt-3 whitespace-pre-line rounded-control bg-sunken/70 px-4 py-3 text-sm text-body">{r.message}</p>
                <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted">Kontak pengirim</p>
                    <p className="text-ink">{r.requester_contact}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted">Kontak alumni (privat, hanya pengurus)</p>
                    <p className="text-ink">{[pv?.email, pv?.phone].filter(Boolean).join(" · ") || "belum tercatat"}</p>
                    {waHref && <a href={waHref} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-brand-700 hover:underline">Hubungi alumni lewat WhatsApp ↗</a>}
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-start gap-3 border-t border-line pt-4">
                  <ActionForm action={setIntroStatus} className="flex flex-1 flex-wrap items-start gap-2">
                    <input type="hidden" name="id" value={r.id} />
                    <input name="note" defaultValue={r.note ?? ""} placeholder="Catatan internal (opsional)" maxLength={500} className={inputCls + " min-w-48 flex-1"} aria-label="Catatan internal" />
                    {ORDER.filter((s) => s !== r.status).map((s) => (
                      <SubmitButton key={s} name="status" value={s} variant="ghost" pendingText="…">
                        Tandai {STATUS[s].label.toLowerCase()}
                      </SubmitButton>
                    ))}
                  </ActionForm>
                  <ActionForm action={deleteIntro}>
                    <input type="hidden" name="id" value={r.id} />
                    <SubmitButton variant="danger" pendingText="…" confirm="Hapus permintaan ini?">Hapus</SubmitButton>
                  </ActionForm>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
