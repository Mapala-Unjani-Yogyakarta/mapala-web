"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { done, fail, type FormState } from "@/lib/form-state";
import { revalidatePublic } from "@/lib/revalidate";
import { firstError } from "@/lib/validation";
import { slugify } from "@/lib/utils";

const albumSchema = z.object({
  title: z.string().trim().min(3, "Judul album minimal 3 karakter").max(120),
  description: z.string().trim().max(2000),
  event_date: z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal tidak valid")]),
});

const nz = (v: string) => (v ? v : null);

export async function saveAlbum(_prev: FormState, fd: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const parsed = albumSchema.safeParse({
    title: String(fd.get("title") ?? ""),
    description: String(fd.get("description") ?? ""),
    event_date: String(fd.get("event_date") ?? ""),
  });
  if (!parsed.success) return fail(firstError(parsed.error));
  const a = parsed.data;
  const id = String(fd.get("id") ?? "");

  if (id) {
    const { error } = await supabase
      .from("albums")
      .update({ title: a.title, description: nz(a.description), event_date: nz(a.event_date), is_published: fd.get("is_published") === "on" })
      .eq("id", id);
    if (error) return fail(error.message);
    revalidatePublic();
    return done("Album disimpan.");
  }

  const base = slugify(a.title) || "album";
  const slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
  const { data, error } = await supabase
    .from("albums")
    .insert({ title: a.title, description: nz(a.description), event_date: nz(a.event_date), slug, is_published: true })
    .select("id")
    .single();
  if (error || !data) return fail(error?.message ?? "Gagal membuat album");
  revalidatePublic();
  redirect(`/admin/gallery/${data.id}`);
}

export async function addPhotos(albumId: string, photos: { url: string; path: string }[]): Promise<{ error?: string }> {
  const { supabase } = await requireAdmin();
  if (!photos.length) return {};
  const { error } = await supabase.from("photos").insert(photos.map((p) => ({ album_id: albumId, url: p.url, path: p.path })));
  if (error) return { error: error.message };

  // Foto pertama otomatis jadi sampul bila belum ada
  const { data: album } = await supabase.from("albums").select("cover_url").eq("id", albumId).maybeSingle();
  if (album && !album.cover_url) await supabase.from("albums").update({ cover_url: photos[0].url }).eq("id", albumId);

  revalidatePublic();
  revalidatePath(`/admin/gallery/${albumId}`);
  return {};
}

export async function deletePhoto(_prev: FormState, fd: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const id = String(fd.get("id") ?? "");
  const albumId = String(fd.get("album_id") ?? "");
  const { data: photo } = await supabase.from("photos").select("url, path").eq("id", id).maybeSingle();
  if (!photo) return fail("Foto tidak ditemukan.");

  const { error } = await supabase.from("photos").delete().eq("id", id);
  if (error) return fail(error.message);
  await supabase.storage.from("gallery").remove([photo.path]);

  // Bila yang dihapus adalah sampul, pakai foto lain
  const { data: album } = await supabase.from("albums").select("cover_url").eq("id", albumId).maybeSingle();
  if (album?.cover_url === photo.url) {
    const { data: next } = await supabase.from("photos").select("url").eq("album_id", albumId).limit(1).maybeSingle();
    await supabase.from("albums").update({ cover_url: next?.url ?? null }).eq("id", albumId);
  }
  revalidatePublic();
  revalidatePath(`/admin/gallery/${albumId}`);
  return done("Foto dihapus.");
}

export async function setCover(_prev: FormState, fd: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const albumId = String(fd.get("album_id") ?? "");
  const { error } = await supabase.from("albums").update({ cover_url: String(fd.get("url") ?? "") }).eq("id", albumId);
  if (error) return fail(error.message);
  revalidatePublic();
  revalidatePath(`/admin/gallery/${albumId}`);
  return done("Sampul diperbarui.");
}

export async function deleteAlbum(_prev: FormState, fd: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const id = String(fd.get("id") ?? "");
  const { data: photos } = await supabase.from("photos").select("path").eq("album_id", id);
  const { error } = await supabase.from("albums").delete().eq("id", id);
  if (error) return fail(error.message);
  const paths = (photos ?? []).map((p: { path: string }) => p.path);
  if (paths.length) await supabase.storage.from("gallery").remove(paths);
  revalidatePublic();
  redirect("/admin/gallery");
}
