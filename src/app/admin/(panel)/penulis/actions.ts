"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { done, fail, type FormState } from "@/lib/form-state";
import { createServiceClient } from "@/lib/supabase/admin";

const emailSchema = z.string().trim().toLowerCase().email("Format email tidak valid");

/** Beri akses menulis kepada anggota (atau email tertentu). Membuat akun masuk-tanpa-sandi bila belum ada. */
export async function addAuthor(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const memberId = String(fd.get("member_id") ?? "");
  let email = String(fd.get("email") ?? "").trim().toLowerCase();
  let name = String(fd.get("full_name") ?? "").trim();
  const svc = createServiceClient();

  if (memberId) {
    const [{ data: m }, { data: pv }] = await Promise.all([
      svc.from("members").select("full_name").eq("id", memberId).maybeSingle(),
      svc.from("member_private").select("email").eq("member_id", memberId).maybeSingle(),
    ]);
    if (!name && m?.full_name) name = m.full_name;
    if (!email && pv?.email) email = String(pv.email).toLowerCase();
  }
  const parsedEmail = emailSchema.safeParse(email);
  if (!parsedEmail.success) return fail(email ? "Format email tidak valid." : "Email belum ada. Isi emailnya (anggota ini belum punya email tercatat).");
  if (name.length < 2) return fail("Isi nama penulis.");
  email = parsedEmail.data;

  // Cari atau buat akun
  let userId: string | null = null;
  const created = await svc.auth.admin.createUser({ email, email_confirm: true });
  if (created.data.user) userId = created.data.user.id;
  else if (/already|registered|exists/i.test(created.error?.message ?? "")) {
    for (let page = 1; page <= 10 && !userId; page++) {
      const { data } = await svc.auth.admin.listUsers({ page, perPage: 200 });
      userId = data?.users.find((u) => u.email?.toLowerCase() === email)?.id ?? null;
      if (!data || data.users.length < 200) break;
    }
  }
  if (!userId) return fail("Gagal menyiapkan akun: " + (created.error?.message ?? "akun tidak ditemukan"));

  const { error } = await svc.from("authors").upsert({ user_id: userId, member_id: memberId || null, full_name: name, email }, { onConflict: "user_id" });
  if (error) return fail("Gagal menyimpan penulis: " + error.message);
  revalidatePath("/admin/penulis");
  return done(`${name} kini bisa menulis. Minta ia membuka halaman “Ruang Penulis” dan meminta tautan masuk ke ${email}.`);
}

export async function removeAuthor(_prev: FormState, fd: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("authors").delete().eq("user_id", String(fd.get("user_id") ?? ""));
  if (error) return fail(error.message);
  revalidatePath("/admin/penulis");
  return done("Akses menulis dicabut. Tulisan yang sudah ada tetap tersimpan.");
}
