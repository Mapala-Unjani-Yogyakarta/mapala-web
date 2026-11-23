import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { Badge, EmptyState, PageHeader } from "@/components/ui";
import { daysBetween, todayJakarta, type Loan } from "@/lib/inventory";
import { formatDate } from "@/lib/utils";

type Row = Loan & { inventory_items: { name: string; code: string | null } | null };

export default async function ActiveLoansPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("inventory_loans").select("*, inventory_items(name, code)").is("returned_at", null).order("due_at", { ascending: true }).limit(500);
  const rows = (data ?? []) as unknown as Row[];
  const today = todayJakarta();
  const late = rows.filter((r) => r.due_at < today).length;

  return (
    <>
      <PageHeader title="Pinjaman Aktif" desc={`${rows.length} peminjaman belum kembali${late ? `, ${late} terlambat` : ""}. Urut dari tenggat terdekat. Pengembalian dicatat di halaman masing-masing alat.`} back={{ href: "/admin/inventaris", label: "Inventaris" }} />
      {rows.length === 0 ? (
        <EmptyState>Tidak ada peminjaman aktif.</EmptyState>
      ) : (
        <div className="overflow-hidden rounded-card border border-line bg-surface">
          <ul className="divide-y divide-line">
            {rows.map((r) => {
              const d = daysBetween(today, r.due_at);
              return (
                <li key={r.id}>
                  <Link href={`/admin/inventaris/${r.item_id}`} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 hover:bg-sunken">
                    <div className="min-w-0">
                      <p className="font-medium text-ink">
                        {r.inventory_items?.name ?? "Alat"} <span className="text-muted">× {r.qty}</span>
                      </p>
                      <p className="text-xs text-muted">
                        {r.borrower_name}
                        {r.borrower_kind === "mapala_lain" ? " (mapala lain)" : ""} · dipinjam {formatDate(r.loaned_at)}
                        {r.contact ? ` · ${r.contact}` : ""}
                      </p>
                    </div>
                    {d < 0 ? <Badge tone="danger">Terlambat {Math.abs(d)} hari</Badge> : d === 0 ? <Badge tone="warn">Kembali hari ini</Badge> : <Badge tone={d <= 2 ? "warn" : "neutral"}>{d} hari lagi · {formatDate(r.due_at)}</Badge>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </>
  );
}
