/** Penguraian dan pembuatan CSV sederhana (cukup untuk Excel / Google Sheets). */

export function detectDelimiter(headerLine: string): string {
  const counts: [string, number][] = [",", ";", "\t"].map((d) => [d, headerLine.split(d).length - 1]);
  counts.sort((a, b) => b[1] - a[1]);
  return counts[0][1] > 0 ? counts[0][0] : ",";
}

export function parseCsv(input: string): string[][] {
  const text = input.replace(/^﻿/, "");
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const delimiter = detectDelimiter(firstLine);
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else quoted = false;
      } else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === delimiter) {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      cell = "";
      if (row.some((c) => c.trim() !== "")) rows.push(row);
      row = [];
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c.trim() !== "")) rows.push(row);
  return rows;
}

export function toCsv(rows: (string | number | null | undefined)[][], delimiter = ";"): string {
  const esc = (v: string | number | null | undefined) => {
    let s = v == null ? "" : String(v);
    // Cegah "formula injection" saat dibuka di Excel
    if (/^[=+\-@]/.test(s) && !/^\+?[0-9][0-9\s-]*$/.test(s)) s = "'" + s;
    return /["\n\r;,]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return "﻿" + rows.map((r) => r.map(esc).join(delimiter)).join("\r\n");
}

export const CSV_COLUMNS = [
  ["nomor_anggota", "member_number"],
  ["nama_lengkap", "full_name"],
  ["nama_lapangan", "nickname"],
  ["angkatan", "angkatan"],
  ["status", "status"],
  ["nim", "nim"],
  ["email", "email"],
  ["hp", "phone"],
  ["golongan_darah", "blood_type"],
  ["alamat", "address"],
  ["kontak_darurat_nama", "emergency_name"],
  ["kontak_darurat_hp", "emergency_phone"],
] as const;
