"use client";

import { useRef, useState } from "react";
import Script from "next/script";
import { Camera } from "lucide-react";
import { ActionForm, SubmitButton } from "./form";
import { MemberFields, type MemberDefaults } from "./member-fields";
import { btnGhost, Field } from "./ui";
import { compressImage } from "@/lib/image";
import type { FormState } from "@/lib/form-state";

declare global {
  interface Window {
    turnstile?: { reset: () => void };
  }
}

/** Formulir publik (tanpa login) untuk anggota baru maupun ubah data lewat tautan pribadi. */
export function MemberForm({
  action,
  defaults,
  token,
  currentPhoto,
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  defaults?: MemberDefaults;
  token?: string;
  currentPhoto?: string | null;
}) {
  const photoRef = useRef<Blob | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentPhoto ?? null);
  const [photoError, setPhotoError] = useState("");
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  async function onPick(file?: File) {
    if (!file) return;
    setPhotoError("");
    try {
      const blob = await compressImage(file, 800, 0.8);
      photoRef.current = blob;
      setPreview(URL.createObjectURL(blob));
    } catch (e) {
      setPhotoError(e instanceof Error ? e.message : "Foto tidak bisa diproses");
    }
  }

  return (
    <ActionForm
      action={action}
      resetOnSuccess
      className="space-y-6"
      prepare={(fd) => {
        if (photoRef.current) fd.set("photo", photoRef.current, "foto.jpg");
        else fd.delete("photo");
        // Token Turnstile hanya berlaku sekali: minta token baru untuk percobaan berikutnya
        window.setTimeout(() => window.turnstile?.reset(), 0);
      }}
    >
      {token && <input type="hidden" name="token" value={token} />}
      {/* Jebakan untuk bot: manusia tidak melihat kolom ini */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <MemberFields d={defaults} />

      <Field label="Foto" hint="Foto wajah/setengah badan. Otomatis dikecilkan sebelum dikirim.">
        <div className="flex items-center gap-4">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Pratinjau foto" className="h-20 w-20 rounded-full object-cover" />
          ) : (
            <span className="flex h-20 w-20 items-center justify-center rounded-full border border-dashed border-line-strong bg-sunken text-faint">
              <Camera size={22} aria-hidden />
            </span>
          )}
          <button type="button" className={btnGhost} onClick={() => fileRef.current?.click()}>
            {preview ? "Ganti foto" : "Pilih foto"}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onPick(e.target.files?.[0])} />
        </div>
        {photoError && <span className="mt-1 block text-sm text-danger-700">{photoError}</span>}
      </Field>

      <label className="flex items-start gap-3 rounded-control bg-brand-50 p-4 text-sm text-body">
        <input type="checkbox" name="consent" required className="mt-0.5 h-4 w-4 accent-brand-700" />
        <span>
          Saya menyetujui data saya disimpan oleh pengurus. Hanya <strong>nama, nama lapangan, angkatan, dan foto</strong> yang dapat tampil
          di website. NIM, kontak, golongan darah, dan alamat bersifat rahasia dan hanya dilihat pengurus.
        </span>
      </label>

      {siteKey && (
        <>
          <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" />
          <div className="cf-turnstile" data-sitekey={siteKey} />
        </>
      )}

      <SubmitButton pendingText="Mengirim…">{token ? "Kirim perubahan data" : "Kirim data"}</SubmitButton>
    </ActionForm>
  );
}
