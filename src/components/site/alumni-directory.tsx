"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { Briefcase, MapPin, Search } from "lucide-react";
import { Avatar, EmptyState, inputCls } from "@/components/ui";
import { angkatanValue, cx } from "@/lib/utils";
import type { Alumnus } from "@/lib/types";

const NO_ANGKATAN = "Tanpa angkatan";
const linkCls = "rounded-full border border-line-strong px-3 py-1 text-xs font-medium text-body transition-colors hover:border-brand-500 hover:text-brand-700";

/** Direktori alumni: cari nama/profesi/kota, saring per angkatan, dengan kontak yang diizinkan tampil. */
export function AlumniDirectory({ alumni }: { alumni: Alumnus[] }) {
  const [q, setQ] = useState("");
  const [angkatan, setAngkatan] = useState("semua");
  const query = useDeferredValue(q.trim().toLowerCase());

  const angkatanList = useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of alumni) {
      const k = a.angkatan?.trim() || NO_ANGKATAN;
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => {
      if (a[0] === NO_ANGKATAN) return 1;
      if (b[0] === NO_ANGKATAN) return -1;
      return angkatanValue(b[0]) - angkatanValue(a[0]) || a[0].localeCompare(b[0]);
    });
  }, [alumni]);

  const filtered = useMemo(
    () =>
      alumni.filter((a) => {
        const k = a.angkatan?.trim() || NO_ANGKATAN;
        if (angkatan !== "semua" && k !== angkatan) return false;
        if (!query) return true;
        return [a.full_name, a.nickname, a.profession, a.workplace, a.city].filter(Boolean).join(" ").toLowerCase().includes(query);
      }),
    [alumni, angkatan, query],
  );

  const chip = (active: boolean) =>
    cx("shrink-0 rounded-full border px-4 py-1.5 text-sm transition-colors", active ? "border-brand-700 bg-brand-700 text-white" : "border-line-strong bg-surface text-body hover:border-brand-400");

  return (
    <div>
      <div className="space-y-4">
        <div className="relative">
          <Search size={16} aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama, profesi, tempat kerja, atau kota" aria-label="Cari alumni" className={cx(inputCls, "!rounded-full !py-2.5 !pl-10")} />
        </div>
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="group" aria-label="Filter angkatan">
          <div className="flex gap-2 pb-1">
            <button type="button" aria-pressed={angkatan === "semua"} onClick={() => setAngkatan("semua")} className={chip(angkatan === "semua")}>
              Semua angkatan
            </button>
            {angkatanList.map(([k, n]) => (
              <button key={k} type="button" aria-pressed={angkatan === k} onClick={() => setAngkatan(k)} className={chip(angkatan === k)}>
                {k === NO_ANGKATAN ? k : `Angkatan ${k}`} <span className="opacity-60">· {n}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-6 text-sm text-muted" aria-live="polite">
        Menampilkan {filtered.length} dari {alumni.length} alumni
      </p>

      {filtered.length === 0 ? (
        <div className="mt-6">
          <EmptyState>Tidak ada alumni yang cocok. Coba ubah kata kunci atau filter.</EmptyState>
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((a) => (
            <li key={a.id} className="card flex flex-col gap-3 p-5">
              <div className="flex items-center gap-3">
                <Avatar src={a.photo_url} name={a.full_name} size={56} />
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink">{a.full_name}</p>
                  <p className="truncate text-sm text-muted">
                    {a.angkatan ? `Angkatan ${a.angkatan}` : "Tanpa angkatan"}
                    {a.nickname ? ` · “${a.nickname}”` : ""}
                  </p>
                </div>
              </div>
              {(a.profession || a.workplace) && (
                <p className="flex items-start gap-2 text-sm text-body">
                  <Briefcase size={15} aria-hidden className="mt-0.5 shrink-0 text-brand-600" />
                  <span>{[a.profession, a.workplace].filter(Boolean).join(" · ")}</span>
                </p>
              )}
              {a.city && (
                <p className="flex items-center gap-2 text-sm text-body">
                  <MapPin size={15} aria-hidden className="shrink-0 text-brand-600" />
                  {a.city}
                </p>
              )}
              {(a.public_instagram || a.public_linkedin || a.public_whatsapp) && (
                <div className="mt-auto flex flex-wrap gap-2 pt-1">
                  {a.public_instagram && (
                    <a href={`https://instagram.com/${a.public_instagram}`} target="_blank" rel="noopener noreferrer" className={linkCls}>
                      Instagram
                    </a>
                  )}
                  {a.public_linkedin && (
                    <a href={a.public_linkedin} target="_blank" rel="noopener noreferrer" className={linkCls}>
                      LinkedIn
                    </a>
                  )}
                  {a.public_whatsapp && (
                    <a href={`https://wa.me/${a.public_whatsapp}`} target="_blank" rel="noopener noreferrer" className={linkCls}>
                      WhatsApp
                    </a>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
