import { Field, inputCls } from "./ui";
import { angkatanValue, buildAngkatanOptions } from "@/lib/utils";

export type MemberDefaults = Partial<Record<string, string | null>>;

/** Kolom isian anggota yang dipakai bersama oleh formulir publik dan panel admin. */
export function MemberFields({ d = {}, angkatanOptions }: { d?: MemberDefaults; angkatanOptions?: string[] }) {
  const v = (k: string) => d[k] ?? "";
  const options = angkatanOptions ?? buildAngkatanOptions([]);
  const currentAngkatan = v("angkatan");
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Nama lengkap" required className="sm:col-span-2">
        <input name="full_name" required minLength={3} maxLength={120} defaultValue={v("full_name")} className={inputCls} autoComplete="name" />
      </Field>
      <Field label="Nama lapangan" hint="Julukan di organisasi, jika ada">
        <input name="nickname" maxLength={60} defaultValue={v("nickname")} className={inputCls} />
      </Field>
      <Field label="Angkatan" required hint="Nomor urut angkatan, bukan tahun masuk. Contoh: XV = angkatan ke-15. Tidak tahu? Tanya pengurus.">
        <select name="angkatan" required defaultValue={currentAngkatan} className={inputCls}>
          <option value="" disabled>
            Pilih angkatan…
          </option>
          {currentAngkatan && !options.includes(currentAngkatan) && <option value={currentAngkatan}>{currentAngkatan} (isian lama, sebaiknya diganti)</option>}
          {options.map((a) => (
            <option key={a} value={a}>
              Angkatan {a} (ke-{angkatanValue(a)})
            </option>
          ))}
        </select>
      </Field>
      <Field label="NIM">
        <input name="nim" maxLength={30} defaultValue={v("nim")} className={inputCls} inputMode="numeric" />
      </Field>
      <Field label="Email">
        <input name="email" type="email" maxLength={120} defaultValue={v("email")} className={inputCls} autoComplete="email" />
      </Field>
      <Field label="No. HP / WhatsApp">
        <input name="phone" type="tel" maxLength={20} defaultValue={v("phone")} className={inputCls} autoComplete="tel" />
      </Field>
      <Field label="Golongan darah">
        <select name="blood_type" defaultValue={v("blood_type")} className={inputCls}>
          <option value="">Tidak tahu / tidak diisi</option>
          {["A", "B", "AB", "O"].map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Alamat" className="sm:col-span-2">
        <textarea name="address" rows={2} maxLength={300} defaultValue={v("address")} className={inputCls} />
      </Field>
      <Field label="Nama kontak darurat" hint="Keluarga yang dihubungi saat kegiatan lapangan">
        <input name="emergency_name" maxLength={120} defaultValue={v("emergency_name")} className={inputCls} />
      </Field>
      <Field label="HP kontak darurat">
        <input name="emergency_phone" type="tel" maxLength={20} defaultValue={v("emergency_phone")} className={inputCls} />
      </Field>
    </div>
  );
}
