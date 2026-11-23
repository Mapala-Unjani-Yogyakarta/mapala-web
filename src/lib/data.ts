import "server-only";
import { createPublicClient } from "./supabase/public";
import type { Album, Period, Photo, PositionWithMember, SiteSettings } from "./types";

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
      const { count } = await db.from(table).select("id", { count: "exact", head: true });
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
