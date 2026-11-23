"use client";

import { ActionForm, SubmitButton } from "@/components/form";
import { MemberFields, type MemberDefaults } from "@/components/member-fields";
import { ImageField } from "@/components/uploader";
import { Field, inputCls } from "@/components/ui";
import { STATUS_OPTIONS } from "@/lib/utils";
import { saveMember } from "./actions";

export function MemberAdminForm({ defaults, id, angkatanOptions, openTo }: { defaults?: MemberDefaults; id?: string; angkatanOptions?: string[]; openTo?: string[] }) {
  const d = defaults ?? {};
  return (
    <ActionForm action={saveMember} className="space-y-6">
      {id && <input type="hidden" name="id" value={id} />}

      <Field label="Foto">
        <ImageField name="photo_url" bucket="members" folder="admin" defaultUrl={d.photo_url} maxDim={800} />
      </Field>

      <MemberFields d={d} angkatanOptions={angkatanOptions} openTo={openTo} />

      <div className="grid gap-4 border-t border-line pt-6 sm:grid-cols-2">
        <Field label="Nomor anggota">
          <input name="member_number" maxLength={40} defaultValue={d.member_number ?? ""} className={inputCls} />
        </Field>
        <Field label="Status">
          <select name="status" defaultValue={d.status ?? "aktif"} className={inputCls}>
            {STATUS_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <div className="rounded-control border border-line bg-sunken/50 p-4 sm:col-span-2">
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" name="spotlight" defaultChecked={!!d.spotlight_at} className="mt-0.5 h-4 w-4 accent-brand-700" />
            <span>
              <strong>Sorotan alumni</strong> — tampilkan besar di bagian atas halaman Alumni (maksimal 3 orang, hanya berstatus Alumni).
            </span>
          </label>
          <Field label="Kutipan atau cerita singkat" hint="Opsional, maksimal 240 karakter. Tampil di bawah nama pada sorotan." className="mt-3">
            <textarea name="spotlight_quote" rows={2} maxLength={240} defaultValue={d.spotlight_quote ?? ""} className={inputCls} />
          </Field>
        </div>
        <label className="flex items-start gap-3 text-sm sm:col-span-2">
          <input type="checkbox" name="is_public" defaultChecked={d.is_public === undefined ? true : d.is_public === "true"} className="mt-0.5 h-4 w-4 accent-brand-700" />
          <span>
            <strong>Tampilkan di website</strong> (nama, nama lapangan, angkatan, dan foto). Jika dimatikan, anggota tidak muncul di halaman publik, termasuk susunan pengurus.
          </span>
        </label>
      </div>

      <SubmitButton>{id ? "Simpan perubahan" : "Tambah anggota"}</SubmitButton>
    </ActionForm>
  );
}
