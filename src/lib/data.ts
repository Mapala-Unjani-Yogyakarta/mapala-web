import "server-only";
import { createPublicClient } from "./supabase/public";
import type { Album, Alumnus, AlumnusPost, AngkatanProfile, CurrentRole, Period, Photo, Post, PostSummary, PositionWithMember, PublicMember, SiteSettings } from "./types";

/** Query publik: bila database belum siap, tampilkan halaman kosong alih-alih error. */
async function safe<T>(fn: () => PromiseLike<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    console.error("[data]", e);
    return fallback;
  }
}

export const DEFAULT_SETTINGS: SiteSettings = {
  org_name: "Mapala",
  tagline: "Mahasiswa Pecinta Alam",
  about: "Profil organisasi akan tampil di sini setelah diisi lewat panel admin.",
  vision: "",
  mission: "",
  history: "",
  founded_year: null,
  contact_email: "",
  contact_phone: "",
  whatsapp: "",
  instagram: "",
  address: "",
  hero_image_url: null,
};

export function getSettings() {
  return safe(async () => {
    const { data } = await createPublicClient().from("site_settings").select("*").eq("id", 1).maybeSingle();
    return { ...DEFAULT_SETTINGS, ...(data ?? {}) } as SiteSettings;
  }, DEFAULT_SETTINGS);
}

export function getStats() {
  return safe(async () => {
    const db = createPublicClient();
    const count = async (table: string) => {
      let q = db.from(table).select("id", { count: "exact", head: true });
      if (table === "members") q = q.in("status", ["aktif", "luar_biasa"]); // sama dengan daftar di halaman Anggota
      const { count } = await q;
      return count ?? 0;
    };
    const [members, periods, albums, photos] = await Promise.all([
      count("members"),
      count("periods"),
      count("albums"),
      count("photos"),
    ]);
    return { members, periods, albums, photos };
  }, { members: 0, periods: 0, albums: 0, photos: 0 });
}

export function getPeriods() {
  return safe(async () => {
    const { data } = await createPublicClient()
      .from("periods")
      .select("*")
      .order("year_start", { ascending: false });
    return (data ?? []) as Period[];
  }, [] as Period[]);
}

export function getPeriodBySlug(slug: string) {
  return safe(async () => {
    const { data } = await createPublicClient().from("periods").select("*").eq("slug", slug).maybeSingle();
    return (data ?? null) as Period | null;
  }, null as Period | null);
}

export function getCurrentPeriod() {
  return safe(async () => {
    const db = createPublicClient();
    const { data: current } = await db.from("periods").select("*").eq("is_current", true).limit(1).maybeSingle();
    if (current) return current as Period;
    const { data: latest } = await db
      .from("periods")
      .select("*")
      .order("year_start", { ascending: false })
      .limit(1)
      .maybeSingle();
    return (latest ?? null) as Period | null;
  }, null as Period | null);
}

export function getPositions(periodId: string) {
  return safe(async () => {
    const { data } = await createPublicClient()
      .from("positions")
      .select("id, title, division, sort_order, members!inner(id, full_name, nickname, photo_url, angkatan)")
      .eq("period_id", periodId)
      .order("sort_order", { ascending: true });
    return (data ?? []) as unknown as PositionWithMember[];
  }, [] as PositionWithMember[]);
}

export function getAlbums(limit?: number) {
  return safe(async () => {
    let q = createPublicClient()
      .from("albums")
      .select("*")
      .eq("is_published", true)
      .order("event_date", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });
    if (limit) q = q.limit(limit);
    const { data } = await q;
    return (data ?? []) as Album[];
  }, [] as Album[]);
}

export function getAlbumBySlug(slug: string) {
  return safe(async () => {
    const { data } = await createPublicClient()
      .from("albums")
      .select("*")
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();
    return (data ?? null) as Album | null;
  }, null as Album | null);
}

export function getPhotos(albumId: string) {
  return safe(async () => {
    const { data } = await createPublicClient()
      .from("photos")
      .select("*")
      .eq("album_id", albumId)
      .order("created_at", { ascending: true });
    return (data ?? []) as Photo[];
  }, [] as Photo[]);
}

/** Anggota aktif & luar biasa yang ditandai tampil publik (RLS). Alumni punya halaman sendiri. Hanya kolom publik. */
export function getPublicMembers() {
  return safe(async () => {
    const { data } = await createPublicClient()
      .from("members")
      .select("id, full_name, nickname, angkatan, status, photo_url")
      .in("status", ["aktif", "luar_biasa"])
      .order("full_name", { ascending: true })
      .limit(3000);
    return (data ?? []) as PublicMember[];
  }, [] as PublicMember[]);
}

/** Semua nilai angkatan yang sudah ada (untuk menentukan rentang pilihan di formulir). */
export function getAngkatanValues() {
  return safe(async () => {
    const { data } = await createPublicClient().from("members").select("angkatan").not("angkatan", "is", null).limit(3000);
    return ((data ?? []) as { angkatan: string | null }[]).map((r) => r.angkatan);
  }, [] as (string | null)[]);
}

/** Alumni yang tampil publik beserta profil sukarela mereka. */
export function getAlumni() {
  return safe(async () => {
    const { data } = await createPublicClient()
      .from("members")
      .select("id, full_name, nickname, angkatan, photo_url, profession, workplace, city, public_instagram, public_linkedin, public_whatsapp, bidang, open_to")
      .eq("status", "alumni")
      .order("full_name", { ascending: true })
      .limit(3000);
    return (data ?? []) as Alumnus[];
  }, [] as Alumnus[]);
}

const POST_SUMMARY = "id, slug, kind, title, excerpt, cover_url, author_name, published_at";

/** Tulisan yang sudah terbit (RLS), terbaru dulu. */
export function getPublishedPosts(limit = 100) {
  return safe(async () => {
    const { data } = await createPublicClient()
      .from("posts")
      .select(POST_SUMMARY)
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(limit);
    return (data ?? []) as PostSummary[];
  }, [] as PostSummary[]);
}

export function getPostBySlug(slug: string) {
  return safe(async () => {
    const { data } = await createPublicClient().from("posts").select("*").eq("slug", slug).eq("status", "published").maybeSingle();
    return (data ?? null) as Post | null;
  }, null as Post | null);
}

/** Jabatan tiap anggota pada periode saat ini: { id anggota → jabatan }. */
export function getCurrentRoles() {
  return safe(async () => {
    const period = await getCurrentPeriod();
    if (!period) return {} as Record<string, CurrentRole>;
    const { data } = await createPublicClient()
      .from("positions")
      .select("member_id, title, division, sort_order")
      .eq("period_id", period.id)
      .order("sort_order", { ascending: true });
    const out: Record<string, CurrentRole> = {};
    for (const r of (data ?? []) as { member_id: string; title: string; division: string | null }[]) {
      if (!out[r.member_id]) out[r.member_id] = { title: r.title, division: r.division };
    }
    return out;
  }, {} as Record<string, CurrentRole>);
}

/** Profil angkatan (julukan, motto, tahun masuk, foto) yang sudah diisi pengurus. */
export function getAngkatanProfiles() {
  return safe(async () => {
    const { data } = await createPublicClient().from("angkatan").select("*");
    return (data ?? []) as AngkatanProfile[];
  }, [] as AngkatanProfile[]);
}

/** Tulisan terbit milik anggota tertentu (untuk "alumni menulis"). */
export function getPostsByMembers(memberIds: string[]) {
  return safe(async () => {
    if (memberIds.length === 0) return [] as AlumnusPost[];
    const { data } = await createPublicClient()
      .from("posts")
      .select("id, slug, title, author_member_id")
      .eq("status", "published")
      .in("author_member_id", memberIds)
      .order("published_at", { ascending: false })
      .limit(200);
    return (data ?? []) as AlumnusPost[];
  }, [] as AlumnusPost[]);
}
