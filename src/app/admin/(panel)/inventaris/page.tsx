import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { Badge, Card, EmptyState, PageHeader, btnGhost, btnPrimary, inputCls } from "@/components/ui";
import { CATEGORIES, CONDITIONS, CONDITION_INFO, borrowedByItem, isOverdue, serviceState, todayJakarta, type Item, type Loan } from "@/lib/inventory";
import { cx } from "@/lib/utils";
import { ConditionBadge, ServiceBadge } from "./status";

type SP = { q?: string; kategori?: string; kondisi?: string; arsip?: string };

export default async function InventoryPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const { supabase } = await requireAdmin();
  const [{ data: itemsRaw }, { data: loansRaw }] = await Promise.all([
    supabase.from("inventory_items").select("*").order("name", { ascending: true }).limit(2000),
    supabase.from("inventory_loans").select("id, item_id, qty, due_at, returned_at").is("returned_at", null).limit(2000),
  ]);
  const items = (itemsRaw ?? []) as Item[];
  const open = (loansRaw ?? []) as Pick<Loan, "id" | "item_id" | "qty" | "due_at" | "returned_at">[];
  const today = todayJakarta();
  const borrowed = borrowedByItem(open);

  const showArchive = sp.arsip === "1";
  const q = (sp.q ?? "").trim().toLowerCase();
  const kategori = (CATEGORIES as readonly string[]).includes(sp.kategori ?? "") ? sp.kategori : "";
  const kondisi = (CONDITIONS as readonly string[]).includes(sp.kondisi ?? "") ? sp.kondisi : "";

  const active = items.filter((i) => i.is_active);
  const rows = items.filter((i) => {
    if (showArchive ? i.is_active : !i.is_active) return false;
    if (kategori && i.category !== kategori) return false;
    if (kondisi && i.condition !== kondisi) return false;
    if (q && ![i.name, i.code, i.location, i.category].filter(Boolean).join(" ").toLowerCase().includes(q)) return false;
    return true;
  });

  const units = active.reduce((n, i) => n + i.quantity, 0);
  const out = open.reduce((n, l) => n + l.qty, 0);
  const overdue = open.filter((l) => isOverdue(l, today)).length;
  const attention = active.filter((i) => i.condition === "rusak" || i.condition === "perlu_perbaikan" || serviceState(i, today)?.state === "terlambat").length;

  const stats = [
    { label: "Jenis alat", value: active.length, href: "/admin/inventaris" },
    { label: "Total unit", value: units, href: "/admin/inventaris" },
    { label: "Sedang dipinjam", value: out, href: "/admin/inventaris/pinjaman" },
    { label: "Terlambat kembali", value: overdue, href: "/admin/inventaris/pinjaman", warn: overdue > 0 },
    { label: "Perlu perhatian", value: attention, href: "/admin/inventaris?kondisi=perlu_perbaikan", warn: attention > 0 },
  ];

  return (
    <>
      <PageHeader
        title="Inventaris"
        desc="Alat organisasi: kondisi, stok, peminjaman, dan jadwal servis. Hanya terlihat oleh pengurus."
        action={
          <div className="flex gap-2">
            <Link href="/admin/inventaris/pinjaman" className={btnGhost}>
              Pinjaman aktif
            </Link>
            <Link href="/admin/inventaris/baru" className={btnPrimary}>
              + Tambah alat
            </Link>
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className={cx("rounded-card border p-4 transition hover:shadow-card", s.warn ? "border-accent-500 bg-accent-50" : "border-line bg-surface hover:border-brand-400")}>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">{s.label}</p>
            <p className="font-display mt-1 text-3xl font-medium text-ink">{s.value}</p>
          </Link>
        ))}
      </div>

      <form method="get" className="mb-5 grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]">
        <input type="search" name="q" defaultValue={sp.q ?? ""} placeholder="Cari nama, kode, atau lokasi" aria-label="Cari alat" className={inputCls} />
        <select name="kategori" defaultValue={kategori} aria-label="Kategori" className={inputCls}>
          <option value="">Semua kategori</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select name="kondisi" defaultValue={kondisi} aria-label="Kondisi" className={inputCls}>
          <option value="">Semua kondisi</option>
          {CONDITIONS.map((c) => (
            <option key={c} value={c}>
              {CONDITION_INFO[c].label}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          {showArchive && <input type="hidden" name="arsip" value="1" />}
          <button type="submit" className={btnPrimary}>
            Terapkan
          </button>
          <Link href={showArchive ? "/admin/inventaris" : "/admin/inventaris?arsip=1"} className={btnGhost}>
            {showArchive ? "Lihat aktif" : "Arsip"}
          </Link>
        </div>
      </form>

      {rows.length === 0 ? (
        <EmptyState>{items.length === 0 ? "Belum ada alat. Klik “Tambah alat” untuk mulai mencatat." : "Tidak ada alat yang cocok dengan pencarian ini."}</EmptyState>
      ) : (
        <div className="overflow-hidden rounded-card border border-line bg-surface">
          <ul className="divide-y divide-line">
            {rows.map((i) => {
              const out = borrowed.get(i.id) ?? 0;
              const left = i.quantity - out;
              const svc = serviceState(i, today);
              return (
                <li key={i.id}>
                  <Link href={`/admin/inventaris/${i.id}`} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 hover:bg-sunken">
                    <div className="min-w-0">
                      <p className="font-medium text-ink">
                        {i.code && <span className="mr-2 rounded bg-sunken px-1.5 py-0.5 font-mono text-xs text-muted">{i.code}</span>}
                        {i.name}
                      </p>
                      <p className="text-xs text-muted">
                        {i.category}
                        {i.location ? ` · ${i.location}` : ""}
                        {!i.lendable_external ? " · khusus anggota" : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <ServiceBadge s={i.is_active ? svc : null} />
                      <ConditionBadge c={i.condition} />
                      {!i.is_active ? <Badge>Diarsipkan</Badge> : <Badge tone={left === 0 ? "warn" : "neutral"}>{left}/{i.quantity} tersedia</Badge>}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      <Card className="mt-6 text-sm text-muted">Alat berkondisi rusak atau hilang tidak bisa dipinjam. Servis dianggap “segera” 30 hari sebelum jatuh tempo.</Card>
    </>
  );
}
