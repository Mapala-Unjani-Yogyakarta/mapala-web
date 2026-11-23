"use server";

import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { done, fail, type FormState } from "@/lib/form-state";
import { revalidatePublic } from "@/lib/revalidate";
import { firstError } from "@/lib/validation";

const s = (max: number) => z.string().trim().max(max, `Maksimal ${max} karakter`);

const schema = z.object({
  org_name: z.string().trim().min(2, "Nama organisasi wajib diisi").max(80),
  tagline: s(120),
  about: s(1500),
  vision: s(1500),
  mission: s(3000),
  history: s(3000),
  founded_year: z.union([z.literal(""), z.coerce.number().int().min(1900).max(2100)]),
  contact_email: z.union([z.literal(""), z.string().trim().email("Format email tidak valid")]),
  contact_phone: s(30),
  whatsapp: s(30),
  instagram: s(60),
  address: s(300),
});

export async function saveSettings(_prev: FormState, fd: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const raw = Object.fromEntries(Object.keys(schema.shape).map((k) => [k, String(fd.get(k) ?? "")]));
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return fail(firstError(parsed.error));
  const v = parsed.data;
  const hero = String(fd.get("hero_image_url") ?? "").trim();

  const { error } = await supabase
    .from("site_settings")
    .update({ ...v, founded_year: v.founded_year === "" ? null : v.founded_year, hero_image_url: hero || null })
    .eq("id", 1);
  if (error) return fail("Gagal menyimpan: " + error.message);
  revalidatePublic();
  return done("Konten website tersimpan.");
}
