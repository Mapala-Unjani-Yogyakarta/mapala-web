import Link from "next/link";
import { Download, Plus, Search, Upload } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { Avatar, Badge, EmptyState, PageHeader, btnGhost, btnPrimary, inputCls } from "@/components/ui";
import { STATUS_LABEL, STATUS_OPTIONS } from "@/lib/utils";
import type { Member, MemberStatus } from "@/lib/types";

const PAGE_SIZE = 25;
type SP = { q?: string; status?: string; angkatan?: string; page?: string };

const TONE: Record<MemberStatus, "brand" | "neutral" | "warn" | "accent"> = {
  aktif: "brand",
  alumni: "accent",
  luar_biasa: "warn",
  non_aktif: "neutral",
};

export default async function MembersPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const { supabase } = await requireAdmin();
  const page = Math.max(1, Number(sp.page) || 1);
  const q = (sp.q ?? "").replace(/[,()%*\\]/g, " ").trim();

  let query = supabase.from("members").select("*", { count: "exact" }).order("full_name");
  if (q) query = query.or(`full_name.ilike.%${q}%,nickname.ilike.%${q}%,member_number.ilike.%${q}%`);
  if (sp.status && sp.status in STATUS_LABEL) query = query.eq("status", sp.status);
  if (sp.angkatan) query = query.eq("angkatan", sp.angkatan);
  query = query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  const [{ data, count }, { data: angkatanRows }] = await Promise.all([
    query,
    supabase.from("members").select("angkatan").not("angkatan", "is", null),
  ]);
  const members = (data ?? []) as Member[];
  const angkatanList = [...new Set((angkatanRows ?? []).map((r: { angkatan: string }) => r.angkatan))].sort();
  const total = count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const href = (p: number) => {
    const params = new URLSearchParams();
    if (sp.q) params.set("q", sp.q);
    if (sp.status) params.set("status", sp.status);
    if (sp.angkatan) params.set("angkatan", sp.angkatan);
    if (p > 1) params.set("page", String(p));
    const s = params.toString();
    return `/admin/anggota${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <PageHeader
        title="Anggota"
        desc={`${total} anggota ditemukan.`}
        action={
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/anggota/impor" className={btnGhost}><Upload size={16} aria-hidden /> Impor</Link>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/admin/anggota/ekspor" className={btnGhost}><Download size={16} aria-hidden /> Ekspor</a>
            <Link href="/admin/anggota/baru" className={btnPrimary}><Plus size={16} aria-hidden /> Tambah</Link>
          </div>
        }
      />

      <form className="mb-4 grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]" role="search">
        <input name="q" defaultValue={sp.q ?? ""} placeholder="Cari nama, nama lapangan, atau nomor anggota" className={inputCls} aria-label="Cari anggota" />
        <select name="status" defaultValue={sp.status ?? ""} className={inputCls} aria-label="Filter status">
          <option value="">Semua status</option>
          {STATUS_OPTIONS.map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <select name="angkatan" defaultValue={sp.angkatan ?? ""} className={inputCls} aria-label="Filter angkatan">
          <option value="">Semua angkatan</option>
          {angkatanList.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <button className={btnPrimary}><Search size={16} aria-hidden /> Cari</button>
      </form>

      {members.length === 0 ? (
        <EmptyState>Tidak ada anggota yang cocok. Tambahkan anggota atau tunggu pengajuan lewat formulir publik.</EmptyState>
      ) : (
        <div className="overflow-hidden card">
          <ul className="divide-y divide-line">
            {members.map((m) => (
              <li key={m.id}>
                <Link href={`/admin/anggota/${m.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-brand-50">
                  <Avatar src={m.photo_url} name={m.full_name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {m.full_name}
                      {!m.is_public && <span className="ml-2 text-xs font-normal text-faint">(disembunyikan)</span>}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {[m.nickname && `“${m.nickname}”`, m.angkatan && `Angkatan ${m.angkatan}`, m.member_number && `No. ${m.member_number}`].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <Badge tone={TONE[m.status]}>{STATUS_LABEL[m.status]}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {pages > 1 && (
        <nav className="mt-4 flex items-center justify-between text-sm" aria-label="Halaman">
          {page > 1 ? <Link href={href(page - 1)} className={btnGhost}>← Sebelumnya</Link> : <span />}
          <span className="text-muted">Halaman {page} dari {pages}</span>
          {page < pages ? <Link href={href(page + 1)} className={btnGhost}>Berikutnya →</Link> : <span />}
        </nav>
      )}
    </>
  );
}
