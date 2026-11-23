import { z } from "zod";

const phone = z
  .string()
  .trim()
  .max(20, "Nomor terlalu panjang")
  .regex(/^[0-9+\-\s]*$/, "Nomor hanya boleh berisi angka, spasi, + dan -");

const optionalText = (max: number) => z.string().trim().max(max, `Maksimal ${max} karakter`);

export const memberFieldsSchema = z.object({
  full_name: z.string().trim().min(3, "Nama lengkap minimal 3 karakter").max(120, "Nama terlalu panjang"),
  nickname: optionalText(60),
  angkatan: optionalText(30),
  nim: optionalText(30),
  email: z.union([z.literal(""), z.string().trim().max(120).email("Format email tidak valid")]),
  phone,
  blood_type: z.enum(["", "A", "B", "AB", "O"], { message: "Golongan darah tidak valid" }),
  address: optionalText(300),
  emergency_name: optionalText(120),
  emergency_phone: phone,
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
};
