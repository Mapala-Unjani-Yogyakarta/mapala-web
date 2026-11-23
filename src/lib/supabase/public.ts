import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(url && key);

/** Klien tanpa cookie untuk halaman publik (hanya bisa membaca data publik lewat RLS). */
export function createPublicClient() {
  return createClient(url ?? "http://localhost:54321", key ?? "missing", {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
