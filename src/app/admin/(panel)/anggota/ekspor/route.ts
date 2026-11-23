import { getAdmin } from "@/lib/auth";
import { CSV_COLUMNS, toCsv } from "@/lib/csv";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await getAdmin();
  if (!admin) return new Response("Tidak diizinkan", { status: 401 });

  const [{ data: members }, { data: priv }] = await Promise.all([
    admin.supabase.from("members").select("*").order("full_name"),
    admin.supabase.from("member_private").select("*"),
  ]);
  type Row = Record<string, string | null>;
  const byId = new Map(((priv ?? []) as Row[]).map((p) => [p.member_id, p]));

  const rows = [
    CSV_COLUMNS.map(([header]) => header),
    ...((members ?? []) as Row[]).map((m) => {
      const merged: Row = { ...(byId.get(m.id) ?? {}), ...m };
      return CSV_COLUMNS.map(([, key]) => merged[key] ?? "");
    }),
  ];

  const date = new Date().toISOString().slice(0, 10);
  return new Response(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="anggota-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
