import type { MemberStatus } from "./types";

export const STATUS_LABEL: Record<MemberStatus, string> = {
  aktif: "Aktif",
  alumni: "Alumni",
  luar_biasa: "Anggota Luar Biasa",
  non_aktif: "Non-aktif",
};

export const STATUS_OPTIONS = Object.entries(STATUS_LABEL) as [MemberStatus, string][];

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function formatDate(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(d);
}

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

/** Nomor WhatsApp → format internasional untuk wa.me (08xx → 628xx). */
export function waNumber(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("0")) return "62" + digits.slice(1);
  return digits;
}

const ROMAN: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };

/** Nilai urut angkatan: angka biasa, angka Romawi (XV → 15), atau angka pertama di teks. Tak terbaca = -1. */
export function angkatanValue(a: string | null | undefined): number {
  if (!a) return -1;
  const s = a.trim().toUpperCase();
  if (/^\d+$/.test(s)) return Number(s);
  if (/^[IVXLCDM]+$/.test(s)) {
    let n = 0;
    for (let i = 0; i < s.length; i++) {
      const v = ROMAN[s[i]];
      const next = ROMAN[s[i + 1]];
      n += next && next > v ? -v : v;
    }
    return n;
  }
  const d = s.match(/\d+/);
  return d ? Number(d[0]) : -1;
}

const ROMAN_STEPS: [number, string][] = [[1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];

/** 15 → "XV", 999 → "CMXCIX". */
export function toRoman(n: number): string {
  let out = "";
  for (const [v, sym] of ROMAN_STEPS) {
    while (n >= v) {
      out += sym;
      n -= v;
    }
  }
  return out;
}

export const ANGKATAN_MAX = 999;

/**
 * Rapikan isian angkatan ke bentuk baku (angka Romawi).
 *   "15", "xv", "Angkatan XV", "angkatan ke-15" → "XV"
 * Ditolak (null): kosong, tahun (2022), di luar 1–999, atau Romawi yang salah tulis (IIII, VX).
 */
export function normalizeAngkatan(input: string | null | undefined): string | null {
  if (!input || /^\s*-/.test(input)) return null; // kosong atau diawali minus
  const s = input
    .trim()
    .toUpperCase()
    .replace(/^(?:ANGKATAN|ANG)?[\s.:-]*(?:KE)?[\s.:-]*/, "")
    .replace(/[\s.\-_]/g, "");
  if (!s) return null;
  let n = 0;
  if (/^0*\d{1,3}$/.test(s)) n = Number(s);
  else if (/^[IVXLCDM]+$/.test(s)) {
    n = angkatanValue(s);
    if (toRoman(n) !== s) return null;
  }
  return n >= 1 && n <= ANGKATAN_MAX ? toRoman(n) : null;
}

/**
 * Daftar pilihan angkatan untuk dropdown, terbaru di atas.
 * Batas atas = angkatan tertinggi yang sudah ada + `extra` (agar angkatan baru bisa dipilih).
 */
export function buildAngkatanOptions(existing: (string | null | undefined)[], extra = 2, fallbackTop = 40): string[] {
  let max = 0;
  for (const v of existing) {
    const n = normalizeAngkatan(v);
    if (n) max = Math.max(max, angkatanValue(n));
  }
  const top = Math.min(ANGKATAN_MAX, max > 0 ? max + extra : fallbackTop);
  return Array.from({ length: top }, (_, i) => toRoman(top - i));
}

/** Perkiraan menit membaca (±200 kata/menit), minimal 1. */
export function readingMinutes(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
