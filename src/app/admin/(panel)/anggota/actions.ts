"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { done, fail, type FormState } from "@/lib/form-state";
import { revalidatePublic } from "@/lib/revalidate";
import { MEMBER_FIELD_KEYS, firstError, memberFieldsSchema, readFields } from "@/lib/validation";
import { CSV_COLUMNS } from "@/lib/csv";
import type { MemberStatus } from "@/lib/types";

const STATUSES: MemberStatus[] = ["aktif", "alumni", "luar_biasa", "non_aktif"];
const nz = (v: string | undefined) => (v && v.trim() !== "" ? v.trim() : null);

function adminFields(fd: FormData) {
  const status = String(fd.get("status") ?? "aktif") as MemberStatus;
  return {
    status: STATUSES.includes(status) ? status : ("aktif" as MemberStatus),
    member_number: nz(String(fd.get("member_number") ?? "")),
    is_public: fd.get("is_public") === "on",
    photo_url: nz(String(fd.get("photo_url") ?? "")),
  };
}

export async function saveMember(_prev: FormState, fd: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const parsed = memberFieldsSchema.safeParse(readFields(fd));
  if (!parsed.success) return fail(firstError(parsed.error));
  const f = parsed.data;
  const extra = adminFields(fd);
  const id = String(fd.get("id") ?? "");

  const publicCols = {
    full_name: f.full_name,
    nickname: nz(f.nickname),
    angkatan: nz(f.angkatan),
    profession: nz(f.profession),
    workplace: nz(f.workplace),
    city: nz(f.city),
    public_instagram: nz(f.public_instagram),
    public_linkedin: nz(f.public_linkedin),
    public_whatsapp: nz(f.public_whatsapp),
    bidang: nz(f.bidang),
    open_to: f.open_to,
    ...extra,
  };
  const privateCols = {
    nim: nz(f.nim),
    email: nz(f.email),
    phone: nz(f.phone),
    blood_type: nz(f.blood_type),
    address: nz(f.address),
    emergency_name: nz(f.emergency_name),
    emergency_phone: nz(f.emergency_phone),
  };

  if (id) {
    const { error } = await supabase.from("members").update(publicCols).eq("id", id);
    if (error) return fail("Gagal menyimpan: " + error.message);
    const { error: e2 } = await supabase.from("member_private").upsert({ member_id: id, ...privateCols }, { onConflict: "member_id" });
    if (e2) return fail("Gagal menyimpan data privat: " + e2.message);
    revalidatePublic();
    return done("Perubahan tersimpan.");
  }

  const { data, error } = await supabase.from("members").insert(publicCols).select("id").single();
  if (error || !data) return fail("Gagal menambah anggota: " + (error?.message ?? ""));
  const { error: e2 } = await supabase.from("member_private").insert({ member_id: data.id, ...privateCols });
  if (e2) return fail("Gagal menyimpan data privat: " + e2.message);
  revalidatePublic();
  redirect(`/admin/anggota/${data.id}`);
}

export async function deleteMember(_prev: FormState, fd: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const id = String(fd.get("id") ?? "");
  const { error } = await supabase.from("members").delete().eq("id", id);
  if (error) return fail("Gagal menghapus: " + error.message);
  revalidatePublic();
  redirect("/admin/anggota");
}

export async function createEditLink(_prev: FormState, fd: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const id = String(fd.get("id") ?? "");
  const token = randomBytes(24).toString("base64url");
  const { error } = await supabase.from("member_private").upsert({ member_id: id, edit_token: token }, { onConflict: "member_id" });
  if (error) return fail("Gagal membuat tautan: " + error.message);
  revalidatePath(`/admin/anggota/${id}`);
  return done("Tautan pribadi dibuat. Tautan lama (jika ada) tidak berlaku lagi.");
}

export async function revokeEditLink(_prev: FormState, fd: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const id = String(fd.get("id") ?? "");
  const { error } = await supabase.from("member_private").update({ edit_token: null }).eq("member_id", id);
  if (error) return fail("Gagal mencabut tautan: " + error.message);
  revalidatePath(`/admin/anggota/${id}`);
  return done("Tautan dicabut.");
}

const normStatus = (s: string): MemberStatus | null => {
  const k = s.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (!k) return "aktif";
  if (k === "anggota_luar_biasa") return "luar_biasa";
  return STATUSES.includes(k as MemberStatus) ? (k as MemberStatus) : null;
};

export async function importMembers(_prev: FormState, fd: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  let rows: Record<string, string>[];
  try {
    rows = JSON.parse(String(fd.get("rows") ?? "[]"));
  } catch {
    return fail("Isi file tidak terbaca.");
  }
  if (!Array.isArray(rows) || rows.length === 0) return fail("File tidak berisi data.");
  if (rows.length > 500) return fail("Maksimal 500 baris per impor. Pecah file menjadi beberapa bagian.");

  const { data: existing } = await supabase.from("member_private").select("nim").not("nim", "is", null);
  const knownNim = new Set((existing ?? []).map((r: { nim: string }) => r.nim));

  const errors: string[] = [];
  const members: Record<string, unknown>[] = [];
  const privates: Record<string, unknown>[] = [];

  rows.forEach((raw, i) => {
    const line = i + 2; // baris 1 adalah judul kolom
    const get = (col: string) => String(raw[col] ?? "").trim();
    const mapped: Record<string, string | string[]> = {};
    for (const k of MEMBER_FIELD_KEYS) mapped[k] = k === "open_to" ? [] : ""; // kolom yang tak ada di CSV (mis. profil alumni) = kosong
    for (const [csvKey, key] of CSV_COLUMNS) mapped[key] = get(csvKey);

    const parsed = memberFieldsSchema.safeParse(mapped);
    if (!parsed.success) return errors.push(`Baris ${line}: ${firstError(parsed.error)}`);
    const status = normStatus(String(mapped.status));
    if (!status) return errors.push(`Baris ${line}: status "${String(mapped.status)}" tidak dikenal`);
    const f = parsed.data;
    if (f.nim && knownNim.has(f.nim)) return errors.push(`Baris ${line}: NIM ${f.nim} sudah terdaftar`);
    if (f.nim) knownNim.add(f.nim);

    const id = crypto.randomUUID();
    members.push({ id, full_name: f.full_name, nickname: nz(f.nickname), angkatan: nz(f.angkatan), member_number: nz(String(mapped.member_number)), status });
    privates.push({
      member_id: id,
      nim: nz(f.nim),
      email: nz(f.email),
      phone: nz(f.phone),
      blood_type: nz(f.blood_type),
      address: nz(f.address),
      emergency_name: nz(f.emergency_name),
      emergency_phone: nz(f.emergency_phone),
    });
  });

  if (members.length > 0) {
    const { error } = await supabase.from("members").insert(members);
    if (error) return fail("Impor gagal: " + error.message);
    const { error: e2 } = await supabase.from("member_private").insert(privates);
    if (e2) return fail("Impor data privat gagal: " + e2.message);
    revalidatePublic();
  }

  if (members.length === 0) return fail(`Tidak ada baris yang valid. ${errors.slice(0, 5).join(" · ")}`);
  const note = errors.length ? ` ${errors.length} baris dilewati: ${errors.slice(0, 5).join(" · ")}${errors.length > 5 ? " …" : ""}` : "";
  return done(`${members.length} anggota berhasil diimpor.${note}`);
}
