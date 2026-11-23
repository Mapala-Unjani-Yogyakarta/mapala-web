/** Pilihan baku untuk profil alumni. Harus sama dengan batasan di supabase/migrations/0003_*.sql. */
export const BIDANG = [
  "Kesehatan",
  "Pendidikan",
  "Teknologi",
  "Lingkungan & Kehutanan",
  "Pemerintahan",
  "Wirausaha",
  "Media & Kreatif",
  "Hukum",
  "Lainnya",
] as const;
export type Bidang = (typeof BIDANG)[number];

export const OPEN_TO = [
  { key: "mentor", label: "Mentor", hint: "Bersedia membimbing adik angkatan" },
  { key: "kolaborasi", label: "Kolaborasi", hint: "Terbuka untuk proyek bersama" },
  { key: "rekrutmen", label: "Rekrutmen", hint: "Bisa membuka peluang kerja/magang" },
  { key: "dukungan", label: "Dukungan kegiatan", hint: "Bersedia mendukung kegiatan organisasi" },
] as const;
export type OpenToKey = (typeof OPEN_TO)[number]["key"];
export const OPEN_TO_KEYS = OPEN_TO.map((o) => o.key) as [OpenToKey, ...OpenToKey[]];
export const openToLabel = (key: string) => OPEN_TO.find((o) => o.key === key)?.label ?? key;
