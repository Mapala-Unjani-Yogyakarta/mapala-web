"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { done, fail, type FormState } from "@/lib/form-state";
import { revalidatePublic } from "@/lib/revalidate";
import { firstError } from "@/lib/validation";
import { normalizeAngkatan } from "@/lib/utils";

const storagePrefix = () => `${(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "")}/storage/v1/object/public/members/`;

const schema = z.object({
  name: z.string().trim().max(80, "Julukan maksimal 80 karakter"),
  motto: z.string().trim().max(200, "Motto maksimal 200 karakter"),
  entry_year: z.union([z.literal(""), z.coerce.number().int().min(1950, "Tahun masuk tidak valid").max(2100, "Tahun masuk tidak valid")]),
  description: z.string().trim().max(1500, "Deskripsi maksimal 1500 karakter"),
  photo_url: z
    .string()
    .trim()
    .max(500)
    .refine((v) => v === "" || v.startsWith(storagePrefix()), "Foto harus diunggah lewat tombol unggah"),
});

const nz = (v: string) => (v ? v : null);

export async function saveAngkatan(_prev: FormState, fd: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const code = normalizeAngkatan(String(fd.get("code") ?? ""));
  if (!code) return fail("Kode angkatan tidak valid.");
  const parsed = schema.safeParse(Object.fromEntries(["name", "motto", "entry_year", "description", "photo_url"].map((k) => [k, String(fd.get(k) ?? "")])));
  if (!parsed.success) return fail(firstError(parsed.error));
  const v = parsed.data;
  const { error } = await supabase.from("angkatan").upsert(
    { code, name: nz(v.name), motto: nz(v.motto), entry_year: v.entry_year === "" ? null : v.entry_year, description: nz(v.description), photo_url: nz(v.photo_url) },
    { onConflict: "code" },
  );
  if (error) return fail("Gagal menyimpan: " + error.message);
  revalidatePublic();
  return done("Profil angkatan tersimpan.");
}

export async function deleteAngkatan(_prev: FormState, fd: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const code = normalizeAngkatan(String(fd.get("code") ?? ""));
  if (!code) return fail("Kode angkatan tidak valid.");
  const { error } = await supabase.from("angkatan").delete().eq("code", code);
  if (error) return fail(error.message);
  revalidatePublic();
  redirect("/admin/angkatan");
}
