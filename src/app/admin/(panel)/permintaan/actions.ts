"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { done, fail, type FormState } from "@/lib/form-state";

export async function setIntroStatus(_prev: FormState, fd: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const id = String(fd.get("id") ?? "");
  const status = String(fd.get("status") ?? "");
  if (!["baru", "diteruskan", "selesai"].includes(status)) return fail("Status tidak valid.");
  const note = String(fd.get("note") ?? "").trim().slice(0, 500);
  const { error } = await supabase
    .from("intro_requests")
    .update({ status, note: note || null, handled_at: status === "baru" ? null : new Date().toISOString() })
    .eq("id", id);
  if (error) return fail(error.message);
  revalidatePath("/admin/permintaan");
  return done("Status diperbarui.");
}

export async function deleteIntro(_prev: FormState, fd: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("intro_requests").delete().eq("id", String(fd.get("id") ?? ""));
  if (error) return fail(error.message);
  revalidatePath("/admin/permintaan");
  return done("Permintaan dihapus.");
}
