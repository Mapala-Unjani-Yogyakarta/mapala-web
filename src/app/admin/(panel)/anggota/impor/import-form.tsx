"use client";

import { useRef, useState } from "react";
import { FileSpreadsheet } from "lucide-react";
import { ActionForm, SubmitButton } from "@/components/form";
import { btnGhost } from "@/components/ui";
import { CSV_COLUMNS, parseCsv } from "@/lib/csv";
import { importMembers } from "../actions";

export function ImportForm() {
  const rowsRef = useRef<Record<string, string>[]>([]);
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function onPick(file?: File) {
    if (!file) return;
    setError("");
    setInfo("");
    rowsRef.current = [];
    try {
      const table = parseCsv(await file.text());
      if (table.length < 2) throw new Error("File kosong atau hanya berisi judul kolom.");
      const header = table[0].map((h) => h.trim().toLowerCase());
      if (!header.includes("nama_lengkap")) throw new Error('Kolom "nama_lengkap" tidak ditemukan. Gunakan templat yang disediakan.');
      rowsRef.current = table.slice(1).map((cells) => Object.fromEntries(header.map((h, i) => [h, (cells[i] ?? "").trim()])));
      setInfo(`${rowsRef.current.length} baris siap diimpor dari ${file.name}.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "File tidak bisa dibaca.");
    }
  }

  return (
    <ActionForm
      action={importMembers}
      className="space-y-4"
      prepare={(fd) => fd.set("rows", JSON.stringify(rowsRef.current))}
    >
      <button type="button" className={btnGhost} onClick={() => fileRef.current?.click()}>
        <FileSpreadsheet size={16} aria-hidden /> Pilih file CSV
      </button>
      <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => onPick(e.target.files?.[0])} />
      {info && <p className="text-sm text-brand-800">{info}</p>}
      {error && <p role="alert" className="text-sm text-danger-700">{error}</p>}
      <div>
        <SubmitButton pendingText="Mengimpor…">Impor anggota</SubmitButton>
      </div>
      <p className="text-xs text-muted">Kolom yang dikenali: {CSV_COLUMNS.map(([h]) => h).join(", ")}.</p>
    </ActionForm>
  );
}
