"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { done, fail, type FormState } from "@/lib/form-state";
import { revalidatePublic } from "@/lib/revalidate";

export async function approveSubmission(_prev: FormState, fd: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const id = String(fd.get("id") ?? "");
  const { error } = await supabase.rpc("approve_submission", { p_id: id });
  if (error) return fail(error.message);
  revalidatePublic();
  revalidatePath("/admin/verifikasi");
  return done("Disetujui dan sudah diterapkan ke data anggota.");
}

export async function rejectSubmission(_prev: FormState, fd: FormData): Promise<FormState> {
  const { supabase, user } = await requireAdmin();
  const id = String(fd.get("id") ?? "");
  const reason = String(fd.get("reason") ?? "").trim().slice(0, 300);
  const { error } = await supabase
    .from("member_submissions")
    .update({ status: "rejected", reject_reason: reason || null, reviewed_at: new Date().toISOString(), reviewed_by: user.id })
    .eq("id", id)
    .eq("status", "pending");
  if (error) return fail(error.message);
  revalidatePath("/admin/verifikasi");
  return done("Pengajuan ditolak.");
}
