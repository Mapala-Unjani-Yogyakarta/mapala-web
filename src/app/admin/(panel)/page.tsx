import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { Badge, Card, PageHeader, btnPrimary } from "@/components/ui";
import { formatDate } from "@/lib/utils";

export default async function DashboardPage() {
  const { supabase, name } = await requireAdmin();

  const count = async (table: string, filter?: [column: string, value: string]) => {
    const q = supabase.from(table).select("id", { count: "exact", head: true });
    const { count } = await (filter ? q.eq(filter[0], filter[1]) : q);
    return count ?? 0;
  };
  const [members, aktif, pending, albums, photos, periods, { data: recent }] = await Promise.all([
    count("members"),
    count("members", ["status", "aktif"]),
    count("member_submissions", ["status", "pending"]),
    count("albums"),
    count("photos"),
    count("periods"),
    supabase
      .from("member_submissions")
      .select("id, kind, payload, submitted_at")
      .eq("status", "pending")
      .order("submitted_at", { ascending: false })
      .limit(5),
  ]);

  const stats = [
    { label: "Total anggota", value: members, href: "/admin/anggota" },
    { label: "Anggota aktif", value: aktif, href: "/admin/anggota?status=aktif" },
    { label: "Menunggu verifikasi", value: pending, href: "/admin/verifikasi", highlight: pending > 0 },
    { label: "Periode", value: periods, href: "/admin/periode" },
    { label: "Album", value: albums, href: "/admin/gallery" },
    { label: "Foto", value: photos, href: "/admin/gallery" },
  ];

  return (
    <>
      <PageHeader title={`Halo, ${name}`} desc="Ringkasan website organisasi." />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className={
              "rounded-card border p-5 transition hover:shadow-card " +
              (s.highlight ? "border-accent-500 bg-accent-50" : "border-line bg-surface hover:border-brand-400")
            }
          >
            <p className="text-xs font-medium uppercase tracking-wide text-muted">{s.label}</p>
            <p className="font-display mt-1 text-3xl font-medium text-ink">{s.value}</p>
          </Link>
        ))}
      </div>

      <Card className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Pengajuan terbaru</h2>
          <Link href="/admin/verifikasi" className="text-sm font-semibold text-brand-700 hover:underline">
            Lihat semua →
          </Link>
        </div>
        {recent && recent.length > 0 ? (
          <ul className="divide-y divide-line">
            {(recent as { id: string; kind: string; payload: Record<string, string>; submitted_at: string }[]).map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="min-w-0 truncate">
                  <strong>{r.payload?.full_name}</strong>{" "}
                  <Badge tone={r.kind === "baru" ? "brand" : "warn"}>{r.kind === "baru" ? "Anggota baru" : "Perubahan data"}</Badge>
                </span>
                <span className="shrink-0 text-xs text-muted">{formatDate(r.submitted_at)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">Tidak ada pengajuan yang menunggu. 🎉</p>
        )}
      </Card>

      <Card className="mt-6">
        <h2 className="font-semibold">Mulai cepat</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/admin/anggota/baru" className={btnPrimary}>Tambah anggota</Link>
          <Link href="/admin/periode" className={btnPrimary}>Kelola periode</Link>
          <Link href="/admin/gallery" className={btnPrimary}>Tambah album</Link>
          <Link href="/admin/konten" className={btnPrimary}>Ubah konten website</Link>
        </div>
      </Card>
    </>
  );
}
