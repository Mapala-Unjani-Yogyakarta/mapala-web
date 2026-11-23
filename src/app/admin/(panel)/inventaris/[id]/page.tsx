import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { LENDABLE, isOverdue, serviceState, todayJakarta, type Item, type Loan } from "@/lib/inventory";
import { formatDate } from "@/lib/utils";
import { ConditionBadge, ServiceBadge } from "../status";
import { ArchiveForm, DeleteLoanForm, ExtendForm, ItemForm, LoanForm, ReturnForm, ServiceForm } from "../inventory-forms";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!uuid.test(id)) notFound();
  const { supabase } = await requireAdmin();
  const [{ data: itemRaw }, { data: loansRaw }, { data: membersRaw }] = await Promise.all([
    supabase.from("inventory_items").select("*").eq("id", id).maybeSingle(),
    supabase.from("inventory_loans").select("*").eq("item_id", id).order("loaned_at", { ascending: false }).limit(200),
    supabase.from("members").select("id, full_name, angkatan").in("status", ["aktif", "luar_biasa", "alumni"]).order("full_name", { ascending: true }).limit(3000),
  ]);
  if (!itemRaw) notFound();
  const item = itemRaw as Item;
  const loans = (loansRaw ?? []) as Loan[];
  const members = (membersRaw ?? []) as { id: string; full_name: string; angkatan: string | null }[];
  const today = todayJakarta();

  const openLoans = loans.filter((l) => !l.returned_at);
  const history = loans.filter((l) => l.returned_at);
  const out = openLoans.reduce((n, l) => n + l.qty, 0);
  const available = item.quantity - out;
  const svc = serviceState(item, today);
  const canLend = item.is_active && LENDABLE.includes(item.condition) && available > 0;

  return (
    <>
      <PageHeader title={item.name} desc={[item.code, item.category, item.location].filter(Boolean).join(" · ")} back={{ href: "/admin/inventaris", label: "Inventaris" }} />
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <ConditionBadge c={item.condition} />
        {item.is_active ? <Badge tone={available === 0 ? "warn" : "brand"}>{available} dari {item.quantity} tersedia</Badge> : <Badge>Diarsipkan</Badge>}
        <ServiceBadge s={svc} />
        {!item.lendable_external && <Badge>Khusus anggota</Badge>}
      </div>

      <div className="space-y-6">
        <Card>
          <h2 className="mb-1 font-semibold">Peminjaman aktif</h2>
          {openLoans.length === 0 ? (
            <p className="text-sm text-muted">Tidak ada yang sedang meminjam alat ini.</p>
          ) : (
            <ul className="mt-3 space-y-4">
              {openLoans.map((l) => (
                <li key={l.id} className="rounded-card border border-line p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-ink">{l.borrower_name}</p>
                    <Badge tone={l.borrower_kind === "mapala_lain" ? "accent" : "brand"}>{l.borrower_kind === "mapala_lain" ? "Mapala lain" : "Anggota"}</Badge>
                    <Badge>{l.qty} unit</Badge>
                    {isOverdue(l, today) && <Badge tone="danger">Terlambat</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    Dipinjam {formatDate(l.loaned_at)} · harus kembali {formatDate(l.due_at)}
                    {l.contact ? ` · kontak ${l.contact}` : ""}
                    {l.purpose ? ` · ${l.purpose}` : ""}
                  </p>
                  <ReturnForm loanId={l.id} today={today} qtyMatches={l.qty === item.quantity} />
                  <details className="mt-3 text-sm">
                    <summary className="cursor-pointer text-muted hover:text-ink">Perpanjang atau hapus catatan</summary>
                    <div className="mt-3 flex flex-wrap items-end gap-4">
                      <ExtendForm loanId={l.id} current={l.due_at} today={today} />
                      <DeleteLoanForm loanId={l.id} />
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="mb-3 font-semibold">Catat peminjaman baru</h2>
          {canLend ? (
            <LoanForm item={item} available={available} today={today} members={members} />
          ) : (
            <p className="text-sm text-muted">
              {!item.is_active ? "Alat diarsipkan." : !LENDABLE.includes(item.condition) ? "Alat berkondisi rusak/hilang tidak bisa dipinjam. Ubah kondisinya setelah diperbaiki." : "Semua unit sedang dipinjam."}
            </p>
          )}
        </Card>

        <Card>
          <h2 className="mb-1 font-semibold">Servis</h2>
          <p className="mb-3 text-sm text-muted">
            {item.service_interval_months ? `Tiap ${item.service_interval_months} bulan.` : "Servis berkala belum diatur (isi “Servis tiap … bulan” di data alat)."}{" "}
            {item.last_service_date ? `Terakhir ${formatDate(item.last_service_date)}.` : ""}
          </p>
          <ServiceForm itemId={item.id} today={today} needsAttention={item.condition !== "baik"} />
        </Card>

        <Card>
          <h2 className="mb-4 font-semibold">Data alat</h2>
          <ItemForm item={item} />
        </Card>

        <Card>
          <h2 className="mb-3 font-semibold">Riwayat peminjaman</h2>
          {history.length === 0 ? (
            <EmptyState>Belum ada riwayat.</EmptyState>
          ) : (
            <ul className="divide-y divide-line text-sm">
              {history.map((l) => (
                <li key={l.id} className="py-2.5">
                  <p>
                    <strong className="text-ink">{l.borrower_name}</strong> <span className="text-muted">· {l.qty} unit{l.borrower_kind === "mapala_lain" ? " · mapala lain" : ""}</span>
                  </p>
                  <p className="text-xs text-muted">
                    {formatDate(l.loaned_at)} → kembali {formatDate(l.returned_at)}
                    {l.returned_at && l.returned_at > l.due_at ? " (terlambat)" : ""}
                    {l.return_condition && l.return_condition !== "baik" ? ` · kondisi: ${l.return_condition.replace("_", " ")}` : ""}
                    {l.return_notes ? ` · ${l.return_notes}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="mb-3 font-semibold">Arsipkan atau hapus</h2>
          <ArchiveForm item={item} />
        </Card>
      </div>
    </>
  );
}
