"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { done, fail, type FormState } from "@/lib/form-state";
import { siteUrl } from "@/lib/utils";

const emailSchema = z.string().trim().toLowerCase().email("Format email tidak valid");

/**
 * Kirim tautan masuk ke email penulis. Jawabannya SELALU sama (agar tidak membocorkan
 * email mana yang terdaftar); Supabase hanya mengirim bila email itu memang akun penulis.
 */
export async function requestLoginLink(_prev: FormState, fd: FormData): Promise<FormState> {
  const parsed = emailSchema.safeParse(String(fd.get("email") ?? ""));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Email tidak valid");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data,
    options: { shouldCreateUser: false, emailRedirectTo: `${siteUrl()}/auth/callback?next=/penulis` },
  });
  if (error && (error.status === 429 || /rate limit|too many|seconds/i.test(error.message))) {
    return fail("Terlalu sering meminta tautan. Tunggu beberapa menit lalu coba lagi.");
  }
  return done("Jika email itu terdaftar sebagai penulis, tautan masuk sudah dikirim. Cek kotak masuk (dan folder spam), lalu buka tautannya di browser ini.");
}

export async function signOutAuthor() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/penulis/masuk");
}
