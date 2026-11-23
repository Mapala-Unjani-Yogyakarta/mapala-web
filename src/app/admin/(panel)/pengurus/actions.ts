"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin, requireSuperAdmin } from "@/lib/auth";
import { done, fail, type FormState } from "@/lib/form-state";
import { createServiceClient } from "@/lib/supabase/admin";
import { firstError } from "@/lib/validation";

const password = z.string().min(8, "Kata sandi minimal 8 karakter").max(72, "Kata sandi maksimal 72 karakter");

const createSchema = z.object({
  full_name: z.string().trim().min(2, "Nama wajib diisi").max(100),
  email: z.string().trim().toLowerCase().email("Format email tidak valid"),
  password,
  role: z.enum(["pengurus", "super_admin"]),
});

export async function createAdminAccount(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireSuperAdmin();
  const parsed = createSchema.safeParse(Object.fromEntries(["full_name", "email", "password", "role"].map((k) => [k, String(fd.get(k) ?? "")])));
  if (!parsed.success) return fail(firstError(parsed.error));
  const v = parsed.data;

  const svc = createServiceClient();
  const { data, error } = await svc.auth.admin.createUser({ email: v.email, password: v.password, email_confirm: true });
  if (error || !data.user) {
    return fail(/already|registered|exists/i.test(error?.message ?? "") ? "Email ini sudah terdaftar." : (error?.message ?? "Gagal membuat akun"));
  }
  const { error: e2 } = await svc.from("admins").insert({ user_id: data.user.id, full_name: v.full_name, email: v.email, role: v.role });
  if (e2) {
    await svc.auth.admin.deleteUser(data.user.id);
    return fail("Gagal menyimpan akun pengurus: " + e2.message);
  }
  revalidatePath("/admin/pengurus");
  return done(`Akun ${v.email} dibuat. Berikan email dan kata sandi ini kepada yang bersangkutan.`);
}

export async function resetAdminPassword(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireSuperAdmin();
  const parsed = password.safeParse(String(fd.get("password") ?? ""));
  if (!parsed.success) return fail(firstError(parsed.error));
  const { error } = await createServiceClient().auth.admin.updateUserById(String(fd.get("user_id") ?? ""), { password: parsed.data });
  if (error) return fail(error.message);
  return done("Kata sandi diganti.");
}

export async function removeAdminAccount(_prev: FormState, fd: FormData): Promise<FormState> {
  const me = await requireSuperAdmin();
  const userId = String(fd.get("user_id") ?? "");
  if (userId === me.user.id) return fail("Kamu tidak bisa menghapus akunmu sendiri.");
  const { error } = await createServiceClient().auth.admin.deleteUser(userId);
  if (error) return fail(error.message);
  revalidatePath("/admin/pengurus");
  return done("Akun dihapus.");
}

export async function changeOwnPassword(_prev: FormState, fd: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const parsed = password.safeParse(String(fd.get("password") ?? ""));
  if (!parsed.success) return fail(firstError(parsed.error));
  if (parsed.data !== String(fd.get("confirm") ?? "")) return fail("Konfirmasi kata sandi tidak sama.");
  const { error } = await supabase.auth.updateUser({ password: parsed.data });
  if (error) return fail(error.message);
  return done("Kata sandi berhasil diganti.");
}
