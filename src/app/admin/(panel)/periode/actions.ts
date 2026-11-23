"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { done, fail, type FormState } from "@/lib/form-state";
import { revalidatePublic } from "@/lib/revalidate";
import { firstError } from "@/lib/validation";

const periodSchema = z
  .object({
    name: z.string().trim().min(3, "Nama periode minimal 3 karakter").max(80),
    year_start: z.coerce.number().int().min(1950, "Tahun mulai tidak valid").max(2100, "Tahun mulai tidak valid"),
    year_end: z.coerce.number().int().min(1950, "Tahun selesai tidak valid").max(2100, "Tahun selesai tidak valid"),
    theme: z.string().trim().max(200),
    vision: z.string().trim().max(2000),
  })
  .refine((v) => v.year_end >= v.year_start, { message: "Tahun selesai tidak boleh lebih kecil dari tahun mulai" });

const nz = (v: string) => (v ? v : null);

export async function savePeriod(_prev: FormState, fd: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const parsed = periodSchema.safeParse(Object.fromEntries(["name", "year_start", "year_end", "theme", "vision"].map((k) => [k, String(fd.get(k) ?? "")])));
  if (!parsed.success) return fail(firstError(parsed.error));
  const p = parsed.data;
  const id = String(fd.get("id") ?? "");
  const isCurrent = fd.get("is_current") === "on";
  const row = {
    name: p.name,
    year_start: p.year_start,
    year_end: p.year_end,
    slug: `${p.year_start}-${p.year_end}`,
    theme: nz(p.theme),
    vision: nz(p.vision),
    is_current: isCurrent,
  };

  // Hanya satu periode yang boleh "saat ini"
  if (isCurrent) {
    const q = supabase.from("periods").update({ is_current: false }).eq("is_current", true);
    await (id ? q.neq("id", id) : q);
  }

  if (id) {
    const { error } = await supabase.from("periods").update(row).eq("id", id);
    if (error) return fail(error.code === "23505" ? "Sudah ada periode dengan tahun yang sama." : error.message);
    revalidatePublic();
    return done("Periode disimpan.");
  }
  const { data, error } = await supabase.from("periods").insert(row).select("id").single();
  if (error || !data) return fail(error?.code === "23505" ? "Sudah ada periode dengan tahun yang sama." : (error?.message ?? "Gagal menyimpan"));
  revalidatePublic();
  redirect(`/admin/periode/${data.id}`);
}

export async function deletePeriod(_prev: FormState, fd: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("periods").delete().eq("id", String(fd.get("id") ?? ""));
  if (error) return fail(error.message);
  revalidatePublic();
  redirect("/admin/periode");
}

const positionSchema = z.object({
  period_id: z.string().uuid(),
  member_id: z.string().uuid("Pilih anggota terlebih dahulu"),
  title: z.string().trim().min(2, "Isi nama jabatan").max(80),
  division: z.string().trim().max(80),
  sort_order: z.coerce.number().int().min(0).max(9999),
});

export async function addPosition(_prev: FormState, fd: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const parsed = positionSchema.safeParse(Object.fromEntries(["period_id", "member_id", "title", "division", "sort_order"].map((k) => [k, String(fd.get(k) ?? "")])));
  if (!parsed.success) return fail(firstError(parsed.error));
  const p = parsed.data;
  const { error } = await supabase.from("positions").insert({ ...p, division: nz(p.division) });
  if (error) return fail(error.message);
  revalidatePublic();
  revalidatePath(`/admin/periode/${p.period_id}`);
  return done("Jabatan ditambahkan.");
}

export async function deletePosition(_prev: FormState, fd: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("positions").delete().eq("id", String(fd.get("id") ?? ""));
  if (error) return fail(error.message);
  revalidatePublic();
  revalidatePath(`/admin/periode/${String(fd.get("period_id") ?? "")}`);
  return done("Jabatan dihapus.");
}
