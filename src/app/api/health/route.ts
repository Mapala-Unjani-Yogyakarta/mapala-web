import { NextResponse } from "next/server";
import { createPublicClient, supabaseConfigured } from "@/lib/supabase/public";

// Selalu dijalankan ulang (tidak di-cache) agar benar-benar menyentuh database.
export const dynamic = "force-dynamic";

/**
 * Pemeriksaan kesehatan: membaca satu baris dari Supabase.
 *  - Dipanggil terjadwal oleh GitHub Actions supaya proyek Supabase gratis tidak "tertidur".
 *  - Melaporkan lama kueri database (db_ms) dan region fungsi Vercel, berguna untuk
 *    mendiagnosis kelambatan (idealnya region fungsi sama dengan region Supabase).
 */
export async function GET() {
  if (!supabaseConfigured) {
    return NextResponse.json({ ok: false, error: "Supabase belum dikonfigurasi" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
  const start = performance.now();
  const { error } = await createPublicClient().from("site_settings").select("id").eq("id", 1).maybeSingle();
  const dbMs = Math.round(performance.now() - start);
  return NextResponse.json(
    { ok: !error, db_ms: dbMs, region: process.env.VERCEL_REGION ?? null },
    { status: error ? 503 : 200, headers: { "Cache-Control": "no-store" } },
  );
}
