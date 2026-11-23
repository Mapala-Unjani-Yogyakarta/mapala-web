import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** Klien dengan sesi login pengurus (mengikuti aturan RLS). */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://localhost:54321",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "missing",
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll(list) {
          try {
            list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Dipanggil dari Server Component: cookie diperbarui oleh proxy.
          }
        },
      },
    },
  );
}
