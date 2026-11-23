import { z } from "zod";
import type { BadgeTone } from "@/components/ui";

/** Harus sama dengan batasan `category` di supabase/migrations/0005_inventory.sql. */
export const CATEGORIES = ["Tenda & shelter", "Tali & panjat", "Navigasi & komunikasi", "Masak & logistik", "Medis & keselamatan", "Carrier & pakaian", "Dokumentasi", "Lainnya"] as const;
export type Category = (typeof CATEGORIES)[number];

export const CONDITIONS = ["baik", "perlu_perbaikan", "rusak", "hilang"] as const;
export type Condition = (typeof CONDITIONS)[number];
export const CONDITION_INFO: Record<Condition, { label: string; tone: BadgeTone }> = {
  baik: { label: "Baik", tone: "brand" },
  perlu_perbaikan: { label: "Perlu perbaikan", tone: "warn" },
  rusak: { label: "Rusak", tone: "danger" },
  hilang: { label: "Hilang", tone: "neutral" },
};
/** Hanya alat berkondisi ini yang boleh dipinjam. */
export const LENDABLE: Condition[] = ["baik", "perlu_perbaikan"];

export type Item = {
  id: string;
  code: string | null;
  name: string;
  category: Category;
  quantity: number;
  condition: Condition;
  location: string | null;
  purchase_date: string | null;
  service_interval_months: number | null;
  last_service_date: string | null;
  lendable_external: boolean;
  notes: string | null;
  is_active: boolean;
};

export type Loan = {
  id: string;
  item_id: string;
  qty: number;
  borrower_kind: "anggota" | "mapala_lain";
  member_id: string | null;
  borrower_name: string;
  contact: string | null;
  purpose: string | null;
  loaned_at: string;
  due_at: string;
  returned_at: string | null;
  return_condition: Condition | null;
  return_notes: string | null;
};

/* ── Tanggal (YYYY-MM-DD, zona Jakarta) ─────────────────────────────── */
export const todayJakarta = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());

export function addMonths(date: string, months: number) {
  const d = new Date(`${date}T00:00:00Z`);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, last));
  return d.toISOString().slice(0, 10);
}

export const daysBetween = (from: string, to: string) => Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);

/* ── Turunan data ───────────────────────────────────────────────────── */
export type ServiceState = { due: string; state: "terlambat" | "segera" | "aman"; days: number } | null;

/** Jadwal servis berikutnya: (servis terakhir, atau tanggal beli) + selang bulan. "segera" = dalam 30 hari. */
export function serviceState(it: Pick<Item, "last_service_date" | "purchase_date" | "service_interval_months">, today = todayJakarta()): ServiceState {
  const base = it.last_service_date ?? it.purchase_date;
  if (!it.service_interval_months || !base) return null;
  const due = addMonths(base, it.service_interval_months);
  const days = daysBetween(today, due);
  return { due, days, state: days < 0 ? "terlambat" : days <= 30 ? "segera" : "aman" };
}

/** Jumlah yang sedang dipinjam per alat. */
export function borrowedByItem(openLoans: Pick<Loan, "item_id" | "qty">[]) {
  const m = new Map<string, number>();
  for (const l of openLoans) m.set(l.item_id, (m.get(l.item_id) ?? 0) + l.qty);
  return m;
}

export const isOverdue = (l: Pick<Loan, "due_at" | "returned_at">, today = todayJakarta()) => !l.returned_at && l.due_at < today;

/* ── Validasi isian ─────────────────────────────────────────────────── */
const date = z
  .string()
  .trim()
  .refine((v) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)), "Tanggal tidak valid");
const optDate = z.union([z.literal(""), date]).transform((v) => (v === "" ? null : v));
const optInt = (min: number, max: number, msg: string) =>
  z
    .string()
    .trim()
    .transform((v, ctx) => {
      if (v === "") return null;
      const n = Number(v);
      if (!Number.isInteger(n) || n < min || n > max) {
        ctx.addIssue({ code: "custom", message: msg });
        return z.NEVER;
      }
      return n;
    });
const text = (max: number, label: string) => z.string().trim().max(max, `${label} maksimal ${max} karakter`);

export const itemSchema = z.object({
  name: z.string().trim().min(2, "Nama alat minimal 2 karakter").max(120, "Nama alat maksimal 120 karakter"),
  code: text(40, "Kode aset").transform((v) => (v ? v.toUpperCase() : null)),
  category: z.enum(CATEGORIES, { message: "Pilih kategori" }),
  quantity: z
    .string()
    .trim()
    .transform((v, ctx) => {
      const n = Number(v);
      if (!Number.isInteger(n) || n < 1 || n > 9999) {
        ctx.addIssue({ code: "custom", message: "Jumlah harus bilangan bulat 1–9999" });
        return z.NEVER;
      }
      return n;
    }),
  condition: z.enum(CONDITIONS, { message: "Pilih kondisi" }),
  location: text(120, "Lokasi simpan").transform((v) => v || null),
  purchase_date: optDate,
  service_interval_months: optInt(1, 120, "Selang servis 1–120 bulan"),
  last_service_date: optDate,
  notes: text(500, "Catatan").transform((v) => v || null),
});

export const loanSchema = z
  .object({
    item_id: z.string().uuid("Alat tidak valid"),
    qty: z
      .string()
      .trim()
      .transform((v, ctx) => {
        const n = Number(v);
        if (!Number.isInteger(n) || n < 1 || n > 9999) {
          ctx.addIssue({ code: "custom", message: "Jumlah pinjam harus bilangan bulat minimal 1" });
          return z.NEVER;
        }
        return n;
      }),
    borrower_kind: z.enum(["anggota", "mapala_lain"], { message: "Pilih jenis peminjam" }),
    member_id: z.string().trim(),
    borrower_name: text(120, "Nama peminjam"),
    contact: text(60, "Kontak"),
    purpose: text(300, "Keperluan"),
    loaned_at: date,
    due_at: date,
  })
  .superRefine((v, ctx) => {
    if (v.due_at < v.loaned_at) ctx.addIssue({ code: "custom", path: ["due_at"], message: "Tanggal kembali tidak boleh sebelum tanggal pinjam" });
    if (v.borrower_kind === "anggota" && !z.string().uuid().safeParse(v.member_id).success) ctx.addIssue({ code: "custom", path: ["member_id"], message: "Pilih anggota peminjam" });
    if (v.borrower_kind === "mapala_lain") {
      if (v.borrower_name.length < 2) ctx.addIssue({ code: "custom", path: ["borrower_name"], message: "Isi nama mapala peminjam" });
      if (v.contact.length < 5) ctx.addIssue({ code: "custom", path: ["contact"], message: "Isi kontak penanggung jawab (HP/WhatsApp) mapala peminjam" });
    }
  });

export const returnSchema = z.object({
  id: z.string().uuid(),
  returned_at: date,
  return_condition: z.enum(CONDITIONS, { message: "Pilih kondisi saat kembali" }),
  return_notes: text(300, "Catatan").transform((v) => v || null),
});

/** Pesan galat dari aturan database sudah berbahasa Indonesia; terjemahkan galat umum sisanya. */
export function dbMessage(m: string) {
  const own = m.match(/Stok tidak cukup[^"]*|Alat [^"]*(?:dipinjamkan ke mapala lain|diarsipkan|rusak\/hilang)|Pilih anggota peminjam|Jumlah tidak boleh kurang[^"]*|Alat masih dipinjam[^"]*|Data pokok peminjaman[^"]*|Peminjaman yang sudah dikembalikan[^"]*/);
  if (own) return own[0];
  if (m.includes("inventory_items_code_uq")) return "Kode aset sudah dipakai alat lain.";
  return m;
}
