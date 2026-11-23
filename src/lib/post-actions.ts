"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { requireAuthor } from "@/lib/author-auth";
import { done, fail, type FormState } from "@/lib/form-state";
import { revalidatePublic } from "@/lib/revalidate";
import { firstError } from "@/lib/validation";
import { slugify } from "@/lib/utils";

const MIN_BODY_TO_SEND = 80;

const storagePrefix = () => `${(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "")}/storage/v1/object/public/blog/`;

const postSchema = z.object({
  title: z.string().trim().min(3, "Judul minimal 3 karakter").max(150, "Judul maksimal 150 karakter"),
  excerpt: z.string().trim().max(300, "Ringkasan maksimal 300 karakter"),
  body: z.string().max(60000, "Isi terlalu panjang (maksimal 60.000 karakter)"),
  cover_url: z
    .string()
    .trim()
    .max(500)
    .refine((v) => v === "" || v.startsWith(storagePrefix()), "Foto sampul harus diunggah lewat tombol unggah"),
  kind: z.enum(["blog", "berita"]),
});

type Scope = "admin" | "author";

async function actor(scope: Scope) {
  if (scope === "admin") {
    const a = await requireAdmin();
    return { scope, supabase: a.supabase, user: a.user, name: a.name };
  }
  const a = await requireAuthor();
  return { scope, supabase: a.supabase, user: a.user, name: a.name };
}

const listPath = (scope: Scope) => (scope === "admin" ? "/admin/tulisan" : "/penulis");
const scopeOf = (fd: FormData): Scope => (fd.get("scope") === "admin" ? "admin" : "author");
const nz = (v: string) => (v ? v : null);

/** Simpan tulisan. intent: draft | submit (penulis) | publish (pengurus). */
export async function savePost(_prev: FormState, fd: FormData): Promise<FormState> {
  const scope = scopeOf(fd);
  const a = await actor(scope);
  const intent = String(fd.get("intent") ?? "draft");
  if (scope === "author" && intent === "publish") return fail("Hanya pengurus yang bisa menerbitkan.");
  if (scope === "admin" && intent === "submit") return fail("Pengurus langsung menerbitkan, bukan mengajukan.");

  const parsed = postSchema.safeParse({
    title: String(fd.get("title") ?? ""),
    excerpt: String(fd.get("excerpt") ?? ""),
    body: String(fd.get("body") ?? ""),
    cover_url: String(fd.get("cover_url") ?? ""),
    kind: scope === "admin" ? String(fd.get("kind") ?? "blog") : "blog",
  });
  if (!parsed.success) return fail(firstError(parsed.error));
  const v = parsed.data;
  const sending = intent === "submit" || intent === "publish";
  if (sending && v.body.trim().length < MIN_BODY_TO_SEND) return fail(`Isi tulisan terlalu pendek (minimal ${MIN_BODY_TO_SEND} karakter) untuk ${intent === "publish" ? "diterbitkan" : "diajukan"}.`);

  const status = intent === "publish" ? "published" : intent === "submit" ? "submitted" : "draft";
  const id = String(fd.get("id") ?? "");
  const now = new Date().toISOString();
  const fields = { title: v.title, excerpt: nz(v.excerpt), body: v.body, cover_url: nz(v.cover_url), status };

  if (id) {
    const { data: existing } = await a.supabase.from("posts").select("published_at, status").eq("id", id).maybeSingle();
    if (!existing) return fail("Tulisan tidak ditemukan atau bukan milikmu.");
    const patch: Record<string, unknown> = { ...fields };
    if (scope === "admin") {
      patch.kind = v.kind;
      if (intent === "publish") {
        patch.published_at = existing.published_at ?? now;
        patch.reviewed_by = a.user.id;
        patch.review_note = null;
      }
    }
    const { data: updated, error } = await a.supabase.from("posts").update(patch).eq("id", id).select("id");
    if (error) return fail("Gagal menyimpan: " + error.message);
    if (!updated || updated.length === 0) return fail("Tulisan ini tidak bisa diubah lagi (mungkin sudah terbit atau bukan milikmu).");
    revalidatePublic();
    if (sending) redirect(listPath(scope));
    revalidatePath(`${listPath(scope)}/${id}`);
    return done("Draf tersimpan.");
  }

  // Tulisan baru
  for (let attempt = 0; attempt < 2; attempt++) {
    const slug = `${slugify(v.title) || "tulisan"}-${Math.random().toString(36).slice(2, 6)}`;
    const { data, error } = await a.supabase
      .from("posts")
      .insert({
        ...fields,
        slug,
        kind: v.kind,
        author_user_id: a.user.id,
        author_name: a.name,
        ...(scope === "admin" && intent === "publish" ? { published_at: now, reviewed_by: a.user.id } : {}),
      })
      .select("id")
      .single();
    if (error?.code === "23505") continue; // slug bentrok: coba lagi dengan akhiran baru
    if (error || !data) return fail("Gagal menyimpan: " + (error?.message ?? ""));
    revalidatePublic();
    redirect(sending ? listPath(scope) : `${listPath(scope)}/${data.id}`);
  }
  return fail("Gagal membuat alamat tulisan. Coba simpan lagi.");
}

/** Hapus tulisan (penulis: hanya draf/ditolak miliknya; pengurus: semua). */
export async function deletePost(_prev: FormState, fd: FormData): Promise<FormState> {
  const scope = scopeOf(fd);
  const a = await actor(scope);
  const { data, error } = await a.supabase.from("posts").delete().eq("id", String(fd.get("id") ?? "")).select("id");
  if (error) return fail("Gagal menghapus: " + error.message);
  if (!data || data.length === 0) return fail("Tulisan tidak bisa dihapus (mungkin sudah terbit; minta pengurus menurunkannya dulu).");
  revalidatePublic();
  redirect(listPath(scope));
}

/** Tinjauan pengurus: approve (terbitkan) | reject (kembalikan dengan catatan) | unpublish (jadi draf). */
export async function reviewPost(_prev: FormState, fd: FormData): Promise<FormState> {
  const a = await actor("admin");
  const id = String(fd.get("id") ?? "");
  const decision = String(fd.get("decision") ?? "");
  const note = String(fd.get("note") ?? "").trim().slice(0, 500);
  const { data: existing } = await a.supabase.from("posts").select("published_at").eq("id", id).maybeSingle();
  if (!existing) return fail("Tulisan tidak ditemukan.");

  let patch: Record<string, unknown>;
  if (decision === "approve") patch = { status: "published", published_at: existing.published_at ?? new Date().toISOString(), reviewed_by: a.user.id, review_note: null };
  else if (decision === "reject") {
    if (!note) return fail("Tulis catatan agar penulis tahu apa yang perlu diperbaiki.");
    patch = { status: "rejected", review_note: note, reviewed_by: a.user.id };
  } else if (decision === "unpublish") patch = { status: "draft" };
  else return fail("Keputusan tidak dikenal.");

  const { error } = await a.supabase.from("posts").update(patch).eq("id", id);
  if (error) return fail(error.message);
  revalidatePublic();
  redirect("/admin/tulisan");
}
