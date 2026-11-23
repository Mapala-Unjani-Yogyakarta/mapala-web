import type { Metadata } from "next";
import Link from "next/link";
import { MemberForm } from "@/components/member-form";
import { PageHero } from "@/components/site/page-hero";
import { getAngkatanValues } from "@/lib/data";
import { buildAngkatanOptions } from "@/lib/utils";
import { submitAlumniJoin } from "./actions";

export const metadata: Metadata = {
  title: "Gabung Jaringan Alumni",
  description: "Daftarkan dirimu ke jaringan alumni Mapala Unjani Yogyakarta: tampil di direktori, jadi mentor, atau terbuka untuk berkolaborasi.",
};

export default async function GabungAlumniPage() {
  const angkatanOptions = buildAngkatanOptions(await getAngkatanValues());
  return (
    <>
      <PageHero eyebrow="Jaringan alumni" title="Gabung Jaringan Alumni" desc="Tidak perlu akun. Isi singkat saja; pengurus memeriksa sebelum profilmu tampil." />
      <div className="mx-auto max-w-2xl px-4 pb-6 sm:px-6">
        <p className="rounded-control bg-accent-50 px-4 py-3 text-sm text-accent-600">
          Hanya yang kamu isi di bagian profil yang tampil untuk umum. Email dipakai pengurus untuk menghubungimu dan <strong>tidak ditampilkan</strong>.
          Sudah terdata sebagai anggota? Minta <strong>tautan pribadi</strong> ke pengurus untuk memperbarui datamu. <Link href="/alumni" className="underline">Kembali ke Alumni</Link>
        </p>
        <div className="panel mt-6 p-5 sm:p-8">
          <MemberForm
            action={submitAlumniJoin}
            mode="alumni"
            angkatanOptions={angkatanOptions}
            submitLabel="Gabung jaringan alumni"
            consentText={
              <>
                Saya menyetujui data saya disimpan pengurus. <strong>Nama, angkatan, foto, dan isian profil</strong> akan tampil untuk umum di halaman Alumni setelah diverifikasi.
                Email hanya dilihat pengurus.
              </>
            }
          />
        </div>
      </div>
    </>
  );
}
