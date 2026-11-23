"use server";

import { createServiceClient } from "@/lib/supabase/admin";
import { done, fail, type FormState } from "@/lib/form-state";
import { firstError, memberFieldsSchema, readFields } from "@/lib/validation";

const MAX_PHOTO_BYTES = 1_500_000;
const MAX_PENDING_PER_HOUR = 60;

/** Menerima data anggota dari formulir publik. Semua masuk antrean verifikasi, tidak langsung tayang. */
export async function submitMemberForm(_prev: FormState, fd: FormData): Promise<FormState> {
  // Jebakan bot: bila kolom tersembunyi terisi, pura-pura sukses.
  if (String(fd.get("website") ?? "") !== "") return done("Terima kasih! Data kamu sudah terkirim.");

  const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
  if (turnstileSecret) {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: new URLSearchParams({ secret: turnstileSecret, response: String(fd.get("cf-turnstile-response") ?? "") }),
    }).catch(() => null);
    const json = res ? ((await res.json().catch(() => null)) as { success?: boolean } | null) : null;
    if (!json?.success) return fail("Verifikasi keamanan gagal. Muat ulang halaman lalu coba lagi.");
  }

  if (fd.get("consent") !== "on") return fail("Centang persetujuan penyimpanan data terlebih dahulu.");

  const parsed = memberFieldsSchema.safeParse(readFields(fd));
  if (!parsed.success) return fail(firstError(parsed.error));

  let db;
  try {
    db = createServiceClient();
  } catch {
    return fail("Server belum dikonfigurasi. Hubungi pengurus.");
  }

  // Penghalang banjir pengajuan (spam)
  const since = new Date(Date.now() - 3600_000).toISOString();
  const { count } = await db
    .from("member_submissions")
    .select("id", { count: "exact", head: true })
    .gte("submitted_at", since);
  if ((count ?? 0) >= MAX_PENDING_PER_HOUR) return fail("Sedang terlalu banyak pengiriman. Coba lagi beberapa saat lagi.");

  // Tautan pribadi → ubah data anggota yang sudah ada
  const token = String(fd.get("token") ?? "");
  let memberId: string | null = null;
  if (token) {
    const { data } = await db.from("member_private").select("member_id").eq("edit_token", token).maybeSingle();
    if (!data) return fail("Tautan tidak valid atau sudah dicabut. Minta tautan baru ke pengurus.");
    memberId = data.member_id as string;
  }

  // Foto (opsional): wajib JPEG hasil kompresi
  let photoUrl: string | null = null;
  const photo = fd.get("photo");
  if (photo instanceof File && photo.size > 0) {
    if (photo.size > MAX_PHOTO_BYTES) return fail("Ukuran foto terlalu besar.");
    const bytes = new Uint8Array(await photo.arrayBuffer());
    const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    if (!isJpeg) return fail("Format foto tidak didukung.");
    const path = `pending/${crypto.randomUUID()}.jpg`;
    const { error } = await db.storage.from("members").upload(path, bytes, { contentType: "image/jpeg" });
    if (error) return fail("Foto gagal diunggah. Coba lagi.");
    photoUrl = db.storage.from("members").getPublicUrl(path).data.publicUrl;
  }

  if (memberId) {
    // Pengajuan lama yang belum diproses digantikan yang terbaru
    await db
      .from("member_submissions")
      .update({ status: "rejected", reject_reason: "Digantikan pengajuan yang lebih baru", reviewed_at: new Date().toISOString() })
      .eq("member_id", memberId)
      .eq("status", "pending");
  }

  const { error } = await db.from("member_submissions").insert({
    kind: memberId ? "ubah" : "baru",
    member_id: memberId,
    payload: parsed.data,
    photo_url: photoUrl,
  });
  if (error) return fail("Data gagal dikirim. Coba lagi sebentar lagi.");

  return done("Terima kasih! Data kamu sudah terkirim dan menunggu verifikasi pengurus.");
}
