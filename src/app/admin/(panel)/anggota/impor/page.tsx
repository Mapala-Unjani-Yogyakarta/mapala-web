import { requireAdmin } from "@/lib/auth";
import { Card, PageHeader } from "@/components/ui";
import { CSV_COLUMNS } from "@/lib/csv";
import { ImportForm } from "./import-form";

export default async function ImportPage() {
  await requireAdmin();
  const template = "data:text/csv;charset=utf-8," + encodeURIComponent("﻿" + CSV_COLUMNS.map(([h]) => h).join(";") + "\r\n");
  return (
    <>
      <PageHeader title="Impor Anggota" desc="Masukkan banyak anggota sekaligus dari file Excel/Google Sheets." back={{ href: "/admin/anggota", label: "Daftar anggota" }} />
      <Card className="space-y-5">
        <ol className="list-decimal space-y-2 pl-5 text-sm text-body">
          <li>
            Unduh <a href={template} download="templat-anggota.csv" className="font-semibold text-brand-700 underline">templat CSV</a> lalu isi di Excel atau Google Sheets.
          </li>
          <li>Simpan sebagai <strong>CSV</strong> (File → Save As → CSV UTF-8).</li>
          <li>Pilih file di bawah, lalu klik Impor. Baris dengan NIM yang sudah terdaftar akan dilewati.</li>
          <li>Kolom <code>status</code> berisi: aktif, alumni, luar_biasa, atau non_aktif (kosong = aktif).</li>
          <li>Kolom <code>angkatan</code> <strong>wajib</strong>: isi nomor angkatan, <code>XV</code> atau <code>15</code> (otomatis dirapikan jadi XV). Tahun masuk seperti 2022 ditolak.</li>
        </ol>
        <ImportForm />
      </Card>
    </>
  );
}
