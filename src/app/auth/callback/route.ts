import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Tujuan tautan masuk email: menukar kode menjadi sesi lalu masuk ke Ruang Penulis. */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/penulis";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/penulis";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${safeNext}`);
  }
  return NextResponse.redirect(`${origin}/penulis/masuk?galat=1`);
}
