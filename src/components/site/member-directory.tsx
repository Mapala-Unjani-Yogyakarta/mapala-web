"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Avatar, Badge, EmptyState, inputCls } from "@/components/ui";
import { angkatanValue, cx } from "@/lib/utils";
import type { PublicMember } from "@/lib/types";

type StatusFilter = "semua" | "aktif" | "alumni" | "luar_biasa";

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: "semua", label: "Semua" },
  { key: "aktif", label: "Aktif" },
  { key: "alumni", label: "Alumni" },
  { key: "luar_biasa", label: "Luar biasa" },
];

const NO_ANGKATAN = "Tanpa angkatan";

/** Daftar anggota publik: cari nama, saring status/angkatan, dikelompokkan per angkatan. */
export function MemberDirectory({ members }: { members: PublicMember[] }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<StatusFilter>("semua");
  const [angkatan, setAngkatan] = useState<string>("semua");
  const query = useDeferredValue(q.trim().toLowerCase());

  // Daftar angkatan (terbaru dulu) beserta jumlahnya
  const angkatanList = useMemo(() => {
    const counts = new Map<string, number>();
    for (const m of members) {
      const key = m.angkatan?.trim() || NO_ANGKATAN;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => {
      if (a[0] === NO_ANGKATAN) return 1;
      if (b[0] === NO_ANGKATAN) return -1;
      return angkatanValue(b[0]) - angkatanValue(a[0]) || a[0].localeCompare(b[0]);
    });
  }, [members]);

  const groups = useMemo(() => {
    const filtered = members.filter((m) => {
      if (status !== "semua" && m.status !== status) return false;
      const key = m.angkatan?.trim() || NO_ANGKATAN;
      if (angkatan !== "semua" && key !== angkatan) return false;
      if (query && !`${m.full_name} ${m.nickname ?? ""}`.toLowerCase().includes(query)) return false;
      return true;
    });
    const map = new Map<string, PublicMember[]>();
    for (const m of filtered) {
      const key = m.angkatan?.trim() || NO_ANGKATAN;
      map.set(key, [...(map.get(key) ?? []), m]);
    }
    const order = new Map(angkatanList.map(([k], i) => [k, i]));
    return { total: filtered.length, list: [...map.entries()].sort((a, b) => (order.get(a[0]) ?? 0) - (order.get(b[0]) ?? 0)) };
  }, [members, status, angkatan, query, angkatanList]);

  const chip = (active: boolean) =>
    cx(
      "shrink-0 rounded-full border px-4 py-1.5 text-sm transition-colors",
      active ? "border-brand-700 bg-brand-700 text-white" : "border-line-strong bg-surface text-body hover:border-brand-400",
    );

  return (
    <div>
      {/* Pencarian & penyaring */}
      <div className="space-y-4">
        <div className="relative">
          <Search size={16} aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nama atau nama lapangan"
            aria-label="Cari anggota"
            className={cx(inputCls, "!rounded-full !py-2.5 !pl-10")}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter status">
          {STATUS_TABS.map((t) => (
            <button key={t.key} type="button" aria-pressed={status === t.key} onClick={() => setStatus(t.key)} className={chip(status === t.key)}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="group" aria-label="Filter angkatan">
          <div className="flex gap-2 pb-1">
            <button type="button" aria-pressed={angkatan === "semua"} onClick={() => setAngkatan("semua")} className={chip(angkatan === "semua")}>
              Semua angkatan
            </button>
            {angkatanList.map(([key, count]) => (
              <button key={key} type="button" aria-pressed={angkatan === key} onClick={() => setAngkatan(key)} className={chip(angkatan === key)}>
                {key === NO_ANGKATAN ? key : `Angkatan ${key}`} <span className="opacity-60">· {count}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-6 text-sm text-muted" aria-live="polite">
        Menampilkan {groups.total} dari {members.length} anggota
      </p>

      {/* Hasil per angkatan */}
      <div className="mt-6 space-y-12">
        {groups.list.length === 0 && (
          <EmptyState>
            Tidak ada anggota yang cocok. Coba ubah kata kunci atau filter.
          </EmptyState>
        )}
        {groups.list.map(([key, items]) => (
          <section key={key} aria-labelledby={`ang-${key}`}>
            <div className="mb-4 flex items-baseline justify-between gap-3 border-b border-line pb-3">
              <h2 id={`ang-${key}`} className="font-display text-3xl tracking-tight text-ink">
                {key === NO_ANGKATAN ? key : `Angkatan ${key}`}
              </h2>
              <span className="text-sm text-muted">{items.length} anggota</span>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((m) => (
                <li key={m.id} className="card flex items-center gap-3 p-3.5">
                  <Avatar src={m.photo_url} name={m.full_name} size={48} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-ink">{m.full_name}</p>
                    {m.nickname && <p className="truncate text-sm text-muted">“{m.nickname}”</p>}
                  </div>
                  {m.status !== "aktif" && <Badge tone={m.status === "alumni" ? "accent" : "warn"}>{m.status === "alumni" ? "Alumni" : "Luar biasa"}</Badge>}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
