"use server";

import { createServiceClient } from "@/lib/supabase/admin";
import { done, fail, type FormState } from "@/lib/form-state";
import { firstError, memberFieldsSchema, readFields } from "@/lib/validation";
import { verifyTurnstile } from "@/lib/turnstile";

const MAX_PHOTO_BYTES = 1_500_000;
const MAX_PENDING_PER_HOUR = 30;

// Hanya identitas dasar + profil publik; data pribadi (NIM, HP, alamat, dll.) tidak diminta di sini.
const joinSchema = memberFieldsSchema
  .pick({
    full_name: true,
    nickname: true,
    angkatan: true,
    email: true,
    profession: true,
    workplace: true,
    city: true,
    public_instagram: true,
    public_linkedin: true,
    public_whatsapp: true,
    bidang: true,
    open_to: true,
    bio: true,
    skills: true,
    grad_year: true,
    website: true,
  })
  .refine((v) => v.email !== "", { message: "Email wajib diisi agar pengurus bisa menghubungimu", path: ["email"] });

/** Pendaftaran ke jaringan alumni. Masuk antrean verifikasi pengurus; saat disetujui, statusnya otomatis Alumni. */
export async function submitAlumniJoin(_prev: FormState, fd: FormData): Promise<FormState> {
  if (String(fd.get("hp_url") ?? "") !== "") return done("Terima kasih! Pendaftaranmu sudah terkirim.");

  if (!(await verifyTurnstile(fd))) {
    return fail("Verifikasi keamanan gagal. Muat ulang halaman lalu coba lagi.");
  }
  if (fd.get("consent") !== "on") return fail("Centang persetujuan terlebih dahulu.");

  const parsed = joinSchema.safeParse(readFields(fd));
  if (!parsed.success) return fail(firstError(parsed.error));

  let db;
  try {
    db = createServiceClient();
  } catch {
    return fail("Server belum dikonfigurasi. Hubungi pengurus.");
  }

  const since = new Date(Date.now() - 3600_000).toISOString();
  const { count } = await db.from("member_submissions").select("id", { count: "exact", head: true }).gte("submitted_at", since);
  if ((count ?? 0) >= MAX_PENDING_PER_HOUR) return fail("Sedang terlalu banyak pengiriman. Coba lagi beberapa saat lagi.");

  let photoUrl: string | null = null;
  const photo = fd.get("photo");
  if (photo instanceof File && photo.size > 0) {
    if (photo.size > MAX_PHOTO_BYTES) return fail("Ukuran foto terlalu besar.");
    const bytes = new Uint8Array(await photo.arrayBuffer());
    if (!(bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)) return fail("Format foto tidak didukung.");
    const path = `pending/${crypto.randomUUID()}.jpg`;
    const { error } = await db.storage.from("members").upload(path, bytes, { contentType: "image/jpeg" });
    if (error) return fail("Foto gagal diunggah. Coba lagi.");
    photoUrl = db.storage.from("members").getPublicUrl(path).data.publicUrl;
  }

  const { error } = await db.from("member_submissions").insert({
    kind: "baru",
    member_id: null,
    payload: { ...parsed.data, status_hint: "alumni" },
    photo_url: photoUrl,
  });
  if (error) return fail("Data gagal dikirim. Coba lagi sebentar lagi.");

  return done("Terima kasih! Pendaftaranmu sudah terkirim. Setelah diverifikasi pengurus, profilmu tampil di halaman Alumni.");
}
