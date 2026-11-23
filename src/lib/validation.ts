import { z } from "zod";
import { normalizeAngkatan } from "./utils";

const phone = z
  .string()
  .trim()
  .max(20, "Nomor terlalu panjang")
  .regex(/^[0-9+\-\s]*$/, "Nomor hanya boleh berisi angka, spasi, + dan -");

/** Nama akun Instagram: "@nama", "instagram.com/nama", atau "nama" → "nama". */
const instagram = z
  .string()
  .trim()
  .transform((v, ctx) => {
    if (!v) return "";
    const h = v.replace(/^(?:https?:\/\/)?(?:www\.)?instagram\.com\//i, "").replace(/^@/, "").replace(/[/?#].*$/, "");
    if (!/^[A-Za-z0-9._]{1,30}$/.test(h)) {
      ctx.addIssue({ code: "custom", message: "Instagram: isi nama akun saja, mis. mapala_unjani" });
      return z.NEVER;
    }
    return h;
  });

/** Tautan profil LinkedIn (https://www.linkedin.com/in/nama). */
const linkedin = z
  .string()
  .trim()
  .transform((v, ctx) => {
    if (!v) return "";
    const url = /^https?:\/\//i.test(v) ? v : `https://${v}`;
    const m = url.match(/^https?:\/\/([a-z]{2,3}\.)?linkedin\.com\/in\/([A-Za-z0-9\-_%]{2,100})\/?(?:[?#].*)?$/i);
    if (!m) {
      ctx.addIssue({ code: "custom", message: "LinkedIn: tempel tautan profil, mis. https://www.linkedin.com/in/nama" });
      return z.NEVER;
    }
    return `https://www.linkedin.com/in/${m[2]}`;
  });

/** Nomor WhatsApp → format internasional tanpa +, mis. 081234567890 → 6281234567890. */
const whatsapp = z
  .string()
  .trim()
  .transform((v, ctx) => {
    if (!v) return "";
    let d = v.replace(/\D/g, "");
    if (d.startsWith("0")) d = "62" + d.slice(1);
    if (d.length < 9 || d.length > 15) {
      ctx.addIssue({ code: "custom", message: "WhatsApp: nomor tidak valid, mis. 081234567890" });
      return z.NEVER;
    }
    return d;
  });

const optionalText = (max: number) => z.string().trim().max(max, `Maksimal ${max} karakter`);

export const memberFieldsSchema = z.object({
  full_name: z.string().trim().min(3, "Nama lengkap minimal 3 karakter").max(120, "Nama terlalu panjang"),
  nickname: optionalText(60),
  // Wajib & dirapikan: "15" / "angkatan xv" → "XV". Tahun masuk (2022) ditolak.
  angkatan: z
    .string()
    .trim()
    .min(1, "Pilih angkatan")
    .transform((v, ctx) => {
      const n = normalizeAngkatan(v);
      if (!n) {
        ctx.addIssue({ code: "custom", message: "Angkatan tidak valid. Pilih dari daftar atau isi nomor angkatan (mis. XV atau 15), bukan tahun masuk." });
        return z.NEVER;
      }
      return n;
    }),
  nim: optionalText(30),
  email: z.union([z.literal(""), z.string().trim().max(120).email("Format email tidak valid")]),
  phone,
  blood_type: z.enum(["", "A", "B", "AB", "O"], { message: "Golongan darah tidak valid" }),
  address: optionalText(300),
  emergency_name: optionalText(120),
  emergency_phone: phone,
  // Profil alumni (opsional, TAMPIL PUBLIK di halaman Alumni)
  profession: optionalText(120),
  workplace: optionalText(120),
  city: optionalText(80),
  public_instagram: instagram,
  public_linkedin: linkedin,
  public_whatsapp: whatsapp,
});

export type MemberFields = z.infer<typeof memberFieldsSchema>;

export const MEMBER_FIELD_KEYS = Object.keys(memberFieldsSchema.shape) as (keyof MemberFields)[];

/** Ambil nilai dari FormData hanya untuk kolom yang dikenal (string kosong bila tidak ada). */
export function readFields(fd: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of MEMBER_FIELD_KEYS) {
    const v = fd.get(key);
    out[key] = typeof v === "string" ? v : "";
  }
  return out;
}

export function firstError(error: z.ZodError) {
  return error.issues[0]?.message ?? "Data tidak valid";
}

export const FIELD_LABELS: Record<string, string> = {
  full_name: "Nama lengkap",
  nickname: "Nama lapangan",
  angkatan: "Angkatan",
  nim: "NIM",
  email: "Email",
  phone: "No. HP",
  blood_type: "Golongan darah",
  address: "Alamat",
  emergency_name: "Kontak darurat",
  emergency_phone: "HP kontak darurat",
  profession: "Profesi",
  workplace: "Tempat kerja / institusi",
  city: "Kota",
  public_instagram: "Instagram (publik)",
  public_linkedin: "LinkedIn (publik)",
  public_whatsapp: "WhatsApp (publik)",
};
