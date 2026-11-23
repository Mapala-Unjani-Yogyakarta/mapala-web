import type { Metadata } from "next";
import { MemberForm } from "@/components/member-form";
import { PageHero } from "@/components/site/page-hero";
import { submitMemberForm } from "./actions";

export const metadata: Metadata = { title: "Isi Data Anggota" };

export default function IsiDataPage() {
  return (
    <>
      <PageHero
        eyebrow="Arsip anggota"
        title="Isi Data Anggota"
        desc="Tidak perlu akun. Data diperiksa pengurus sebelum tampil di website."
      />
      <div className="mx-auto max-w-2xl px-4 pb-6 sm:px-6">
        <p className="rounded-control bg-accent-50 px-4 py-3 text-sm text-accent-600">
          Sudah pernah terdata dan ingin mengubah data? Minta <strong>tautan pribadi</strong> ke pengurus.
        </p>
        <div className="panel mt-6 p-5 sm:p-8">
          <MemberForm action={submitMemberForm} />
        </div>
      </div>
    </>
  );
}
