"use server";

import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/admin";
import { done, fail, type FormState } from "@/lib/form-state";
import { verifyTurnstile } from "@/lib/turnstile";

const schema = z.object({
  member_id: z.string().uuid("Alumni tidak valid"),
  name: z.string().trim().min(2, "Isi namamu").max(100, "Nama terlalu panjang"),
  contact: z
    .string()
    .trim()
    .min(5, "Isi email atau nomor WhatsApp-mu")
    .max(120)
    .refine((v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || v.replace(/\D/g, "").length >= 9, "Isi email atau nomor WhatsApp yang valid"),
  message: z.string().trim().min(20, "Tulis pesan minimal 20 karakter agar jelas tujuannya").max(600, "Pesan maksimal 600 karakter"),
});

/**
 * Permintaan dikenalkan dengan alumni. Kontak alumni TIDAK dibuka: permintaan masuk ke pengurus
 * (tabel intro_requests, hanya terbaca pengurus) yang menjadi penghubung.
 */
export async function requestIntro(_prev: FormState, fd: FormData): Promise<FormState> {
  if (String(fd.get("website") ?? "") !== "") return done("Terima kasih! Permintaanmu sudah diteruskan ke pengurus."); // jebakan bot
  if (!(await verifyTurnstile(fd))) return fail("Verifikasi keamanan gagal. Muat ulang halaman lalu coba lagi.");

  const parsed = schema.safeParse({
    member_id: String(fd.get("member_id") ?? ""),
    name: String(fd.get("name") ?? ""),
    contact: String(fd.get("contact") ?? ""),
    message: String(fd.get("message") ?? ""),
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Data tidak valid");
  const v = parsed.data;

  let db;
  try {
    db = createServiceClient();
  } catch {
    return fail("Server belum dikonfigurasi. Hubungi pengurus.");
  }

  // Hanya alumni yang tampil publik yang bisa dikenalkan
  const { data: alumnus } = await db.from("members").select("id, status, is_public").eq("id", v.member_id).maybeSingle();
  if (!alumnus || alumnus.status !== "alumni" || !alumnus.is_public) return fail("Alumni tidak ditemukan.");

  // Batasan penyalahgunaan: banjir global dan pengirim yang sama berulang kali
  const hourAgo = new Date(Date.now() - 3600_000).toISOString();
  const dayAgo = new Date(Date.now() - 86400_000).toISOString();
  const [{ count: hourly }, { count: sameSender }] = await Promise.all([
    db.from("intro_requests").select("id", { count: "exact", head: true }).gte("created_at", hourAgo),
    db.from("intro_requests").select("id", { count: "exact", head: true }).eq("requester_contact", v.contact).gte("created_at", dayAgo),
  ]);
  if ((hourly ?? 0) >= 40) return fail("Sedang terlalu banyak permintaan. Coba lagi beberapa saat lagi.");
  if ((sameSender ?? 0) >= 3) return fail("Kamu sudah mengirim beberapa permintaan hari ini. Pengurus akan segera menanggapi.");

  const { error } = await db.from("intro_requests").insert({
    member_id: v.member_id,
    requester_name: v.name,
    requester_contact: v.contact,
    message: v.message,
  });
  if (error) return fail("Permintaan gagal dikirim. Coba lagi sebentar lagi.");
  return done("Terima kasih! Permintaanmu sudah diteruskan ke pengurus. Mereka akan menghubungi alumni dan menyambungkan kalian.");
}
