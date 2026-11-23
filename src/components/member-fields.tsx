import { Field, inputCls } from "./ui";
import { angkatanValue, buildAngkatanOptions } from "@/lib/utils";
import { BIDANG, OPEN_TO } from "@/lib/profile-options";

export type MemberDefaults = Partial<Record<string, string | null>>;

/** Kolom isian anggota yang dipakai bersama oleh formulir publik dan panel admin. */
export function MemberFields({ d = {}, angkatanOptions, openTo = [] }: { d?: MemberDefaults; angkatanOptions?: string[]; openTo?: string[] }) {
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
      <div className="mt-2 border-t border-line pt-6 sm:col-span-2">
        <h3 className="font-display text-2xl text-ink">Profil alumni (opsional)</h3>
        <p className="mt-1 text-sm text-muted">
          Bagian ini <strong className="text-ink">tampil untuk umum</strong> di halaman Alumni bila statusmu alumni. Isi hanya yang ingin kamu tampilkan, dan kosongkan sisanya.
        </p>
      </div>
      <Field label="Bidang" hint="Dipakai untuk mengelompokkan alumni">
        <select name="bidang" defaultValue={v("bidang")} className={inputCls}>
          <option value="">— pilih bidang —</option>
          {BIDANG.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Profesi" hint="Contoh: Dokter, Guru, Software Engineer">
        <input name="profession" maxLength={120} defaultValue={v("profession")} className={inputCls} />
      </Field>
      <Field label="Tempat kerja / institusi">
        <input name="workplace" maxLength={120} defaultValue={v("workplace")} className={inputCls} />
      </Field>
      <fieldset className="sm:col-span-2">
        <legend className="mb-1 text-sm font-medium text-ink">Terbuka untuk</legend>
        <p className="mb-2 text-xs text-muted">Opsional. Tampil sebagai label di profilmu agar orang tahu bagaimana bisa terhubung.</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {OPEN_TO.map((o) => (
            <label key={o.key} className="flex items-start gap-3 rounded-control border border-line bg-surface p-3 text-sm">
              <input type="checkbox" name="open_to" value={o.key} defaultChecked={openTo.includes(o.key)} className="mt-0.5 h-4 w-4 accent-brand-700" />
              <span>
                <span className="font-medium text-ink">{o.label}</span>
                <span className="block text-xs text-muted">{o.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <Field label="Kota domisili">
        <input name="city" maxLength={80} defaultValue={v("city")} className={inputCls} />
      </Field>
      <Field label="Instagram" hint="Nama akun saja, mis. mapala_unjani">
        <input name="public_instagram" maxLength={60} defaultValue={v("public_instagram")} className={inputCls} placeholder="tanpa @" />
      </Field>
      <Field label="LinkedIn" hint="Tempel tautan profilmu">
        <input name="public_linkedin" maxLength={200} defaultValue={v("public_linkedin")} className={inputCls} placeholder="https://www.linkedin.com/in/…" />
      </Field>
      <Field label="WhatsApp (ditampilkan publik)" hint="Terpisah dari nomor HP pribadi di atas">
        <input name="public_whatsapp" type="tel" maxLength={20} defaultValue={v("public_whatsapp")} className={inputCls} />
      </Field>
    </div>
  );
}
