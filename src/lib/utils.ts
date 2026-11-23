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
