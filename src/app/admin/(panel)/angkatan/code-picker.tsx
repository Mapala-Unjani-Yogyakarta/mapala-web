"use client";

import { useRouter } from "next/navigation";
import { inputCls } from "@/components/ui";

/** Pilih kode angkatan lalu buka formulir profilnya. */
export function CodePicker({ options }: { options: string[] }) {
  const router = useRouter();
  return (
    <select defaultValue="" aria-label="Tambah profil angkatan" onChange={(e) => e.target.value && router.push(`/admin/angkatan/${e.target.value}`)} className={inputCls + " max-w-xs"}>
      <option value="">Tambah profil angkatan…</option>
      {options.map((c) => (
        <option key={c} value={c}>
          Angkatan {c}
        </option>
      ))}
    </select>
  );
}
