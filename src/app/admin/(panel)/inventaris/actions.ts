"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { done, fail, type FormState } from "@/lib/form-state";
import { firstError } from "@/lib/validation";
import { CONDITIONS, dbMessage, itemSchema, loanSchema, returnSchema, todayJakarta, type Condition } from "@/lib/inventory";

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "");
const pick = (fd: FormData, keys: string[]) => Object.fromEntries(keys.map((k) => [k, str(fd, k)]));
const refresh = (id?: string) => {
  revalidatePath("/admin/inventaris");
  revalidatePath("/admin/inventaris/pinjaman");
  if (id) revalidatePath(`/admin/inventaris/${id}`);
};

const ITEM_KEYS = ["name", "code", "category", "quantity", "condition", "location", "purchase_date", "service_interval_months", "last_service_date", "notes"];

export async function saveItem(_prev: FormState, fd: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const parsed = itemSchema.safeParse(pick(fd, ITEM_KEYS));
  if (!parsed.success) return fail(firstError(parsed.error));
  const row = { ...parsed.data, lendable_external: fd.get("lendable_external") === "on" };
  const id = str(fd, "id");

  if (id) {
    const { error } = await supabase.from("inventory_items").update(row).eq("id", id);
    if (error) return fail("Gagal menyimpan: " + dbMessage(error.message));
    refresh(id);
    return done("Perubahan tersimpan.");
  }
  const { data, error } = await supabase.from("inventory_items").insert(row).select("id").single();
  if (error || !data) return fail("Gagal menambah alat: " + dbMessage(error?.message ?? ""));
  refresh();
  redirect(`/admin/inventaris/${data.id}`);
}

export async function setItemActive(_prev: FormState, fd: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const id = str(fd, "id");
  const active = str(fd, "active") === "1";
  const { error } = await supabase.from("inventory_items").update({ is_active: active }).eq("id", id);
  if (error) return fail(dbMessage(error.message));
  refresh(id);
  return done(active ? "Alat dikembalikan ke daftar aktif." : "Alat diarsipkan.");
}

export async function deleteItem(_prev: FormState, fd: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const id = str(fd, "id");
  const { count } = await supabase.from("inventory_loans").select("id", { count: "exact", head: true }).eq("item_id", id).is("returned_at", null);
  if ((count ?? 0) > 0) return fail("Alat masih dipinjam. Catat pengembaliannya dulu.");
  const { error } = await supabase.from("inventory_items").delete().eq("id", id);
  if (error) return fail("Gagal menghapus: " + dbMessage(error.message));
  refresh();
  redirect("/admin/inventaris");
}

/** Catat servis: tanggal servis terakhir diperbarui; opsional mengembalikan kondisi menjadi baik. */
export async function recordService(_prev: FormState, fd: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const id = str(fd, "id");
  const date = str(fd, "service_date") || todayJakarta();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) return fail("Tanggal servis tidak valid.");
  if (date > todayJakarta()) return fail("Tanggal servis tidak boleh di masa depan.");
  const patch: { last_service_date: string; condition?: Condition } = { last_service_date: date };
  if (fd.get("set_good") === "on") patch.condition = "baik";
  const { error } = await supabase.from("inventory_items").update(patch).eq("id", id);
  if (error) return fail("Gagal mencatat servis: " + dbMessage(error.message));
  refresh(id);
  return done("Servis tercatat.");
}

const LOAN_KEYS = ["item_id", "qty", "borrower_kind", "member_id", "borrower_name", "contact", "purpose", "loaned_at", "due_at"];

export async function createLoan(_prev: FormState, fd: FormData): Promise<FormState> {
  const { supabase, user } = await requireAdmin();
  const raw = pick(fd, LOAN_KEYS);
  raw.loaned_at ||= todayJakarta();
  const parsed = loanSchema.safeParse(raw);
  if (!parsed.success) return fail(firstError(parsed.error));
  const v = parsed.data;

  let name = v.borrower_name;
  if (v.borrower_kind === "anggota") {
    const { data: m } = await supabase.from("members").select("full_name").eq("id", v.member_id).maybeSingle();
    if (!m) return fail("Anggota tidak ditemukan.");
    name = (m as { full_name: string }).full_name;
  }
  const { error } = await supabase.from("inventory_loans").insert({
    item_id: v.item_id,
    qty: v.qty,
    borrower_kind: v.borrower_kind,
    member_id: v.borrower_kind === "anggota" ? v.member_id : null,
    borrower_name: name,
    contact: v.contact || null,
    purpose: v.purpose || null,
    loaned_at: v.loaned_at,
    due_at: v.due_at,
    created_by: user.id,
  });
  if (error) return fail("Gagal mencatat peminjaman: " + dbMessage(error.message));
  refresh(v.item_id);
  return done("Peminjaman tercatat.");
}

export async function returnLoan(_prev: FormState, fd: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const parsed = returnSchema.safeParse({ ...pick(fd, ["id", "returned_at", "return_condition", "return_notes"]), returned_at: str(fd, "returned_at") || todayJakarta() });
  if (!parsed.success) return fail(firstError(parsed.error));
  const v = parsed.data;
  if (v.returned_at > todayJakarta()) return fail("Tanggal kembali tidak boleh di masa depan.");

  const { data: loan, error } = await supabase
    .from("inventory_loans")
    .update({ returned_at: v.returned_at, return_condition: v.return_condition, return_notes: v.return_notes })
    .eq("id", v.id)
    .is("returned_at", null)
    .select("item_id, qty")
    .maybeSingle();
  if (error) return fail("Gagal mencatat pengembalian: " + dbMessage(error.message));
  if (!loan) return fail("Peminjaman sudah dikembalikan atau tidak ditemukan.");

  const l = loan as { item_id: string; qty: number };
  let msg = "Pengembalian tercatat.";
  if (fd.get("apply_condition") === "on" && CONDITIONS.includes(v.return_condition)) {
    const { error: e2 } = await supabase.from("inventory_items").update({ condition: v.return_condition }).eq("id", l.item_id);
    msg += e2 ? " Kondisi alat belum diperbarui: ubah manual di halaman alat." : " Kondisi alat ikut diperbarui.";
  }
  refresh(l.item_id);
  return done(msg);
}

export async function extendLoan(_prev: FormState, fd: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const id = str(fd, "id");
  const due = str(fd, "due_at");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(due) || Number.isNaN(Date.parse(due))) return fail("Tanggal tidak valid.");
  const { data, error } = await supabase.from("inventory_loans").update({ due_at: due }).eq("id", id).is("returned_at", null).select("item_id").maybeSingle();
  if (error) return fail(error.message.includes("check") ? "Tanggal kembali tidak boleh sebelum tanggal pinjam." : dbMessage(error.message));
  if (!data) return fail("Peminjaman tidak ditemukan atau sudah dikembalikan.");
  refresh((data as { item_id: string }).item_id);
  return done("Tenggat diperbarui.");
}

export async function deleteLoan(_prev: FormState, fd: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const id = str(fd, "id");
  const { data, error } = await supabase.from("inventory_loans").delete().eq("id", id).select("item_id").maybeSingle();
  if (error) return fail("Gagal menghapus: " + dbMessage(error.message));
  refresh((data as { item_id: string } | null)?.item_id);
  return done("Catatan peminjaman dihapus.");
}
