import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Klien dengan hak penuh (melewati RLS). HANYA dipakai di server untuk:
 *  - menerima formulir anggota tanpa login
 *  - membuat/menghapus akun pengurus
 * Jangan pernah mengimpor file ini dari komponen client.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_SERVICE_ROLE_KEY belum diatur di .env.local");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
