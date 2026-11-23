"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import { Badge, EmptyState } from "@/components/ui";
import { FilterBar, FilterSelect, FilterToggle } from "./filter-bar";
import { angkatanValue } from "@/lib/utils";
import type { CurrentRole, PublicMember } from "@/lib/types";

const NO_ANGKATAN = "Tanpa angkatan";

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

/** Daftar seluruh anggota (aktif, alumni, luar biasa): berorientasi wajah, dengan jabatan saat ini, dikelompokkan per angkatan ("keluarga"). */
export function MemberDirectory({
  members,
  roles,
  profiles,
}: {
  members: PublicMember[];
  roles: Record<string, CurrentRole>;
  profiles: Record<string, string | null>;
}) {
  const [q, setQ] = useState("");
  const [onlyBoard, setOnlyBoard] = useState(false);
  const [status, setStatus] = useState("semua");
  const [angkatan, setAngkatan] = useState("semua");
  const query = useDeferredValue(q.trim().toLowerCase());
  const boardCount = members.filter((m) => roles[m.id]).length;

  const angkatanList = useMemo(() => {
    const counts = new Map<string, number>();
    for (const m of members) {
      const k = m.angkatan?.trim() || NO_ANGKATAN;
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => {
      if (a[0] === NO_ANGKATAN) return 1;
      if (b[0] === NO_ANGKATAN) return -1;
      return angkatanValue(b[0]) - angkatanValue(a[0]) || a[0].localeCompare(b[0]);
    });
  }, [members]);

  const groups = useMemo(() => {
    const filtered = members.filter((m) => {
      if (onlyBoard && !roles[m.id]) return false;
      if (status !== "semua" && m.status !== status) return false;
      const k = m.angkatan?.trim() || NO_ANGKATAN;
      if (angkatan !== "semua" && k !== angkatan) return false;
      if (query && !`${m.full_name} ${m.nickname ?? ""} ${roles[m.id]?.title ?? ""}`.toLowerCase().includes(query)) return false;
      return true;
    });
    const map = new Map<string, PublicMember[]>();
    for (const m of filtered) {
      const k = m.angkatan?.trim() || NO_ANGKATAN;
      map.set(k, [...(map.get(k) ?? []), m]);
    }
    const order = new Map(angkatanList.map(([k], i) => [k, i]));
    return { total: filtered.length, list: [...map.entries()].sort((a, b) => (order.get(a[0]) ?? 0) - (order.get(b[0]) ?? 0)) };
  }, [members, roles, onlyBoard, status, angkatan, query, angkatanList]);

  const activeCount = (onlyBoard ? 1 : 0) + (angkatan !== "semua" ? 1 : 0) + (status !== "semua" ? 1 : 0);
  const reset = () => {
    setQ("");
    setOnlyBoard(false);
    setStatus("semua");
    setAngkatan("semua");
  };

  return (
    <div>
      <FilterBar
        q={q}
        onQ={setQ}
        placeholder="Cari nama atau jabatan"
        activeCount={activeCount + (q ? 1 : 0)}
        onReset={reset}
        summary={`${groups.total} dari ${members.length} anggota`}
        cols="lg:grid-cols-4"
      >
        <FilterSelect label="Angkatan" value={angkatan} onChange={setAngkatan}>
          <option value="semua">Semua angkatan</option>
          {angkatanList.map(([k, n]) => (
            <option key={k} value={k}>
              {k === NO_ANGKATAN ? k : `Angkatan ${k}`} ({n})
            </option>
          ))}
        </FilterSelect>
        <FilterSelect label="Status" value={status} onChange={setStatus}>
          <option value="semua">Semua status</option>
          <option value="aktif">Aktif</option>
          <option value="alumni">Alumni</option>
          <option value="luar_biasa">Anggota luar biasa</option>
        </FilterSelect>
        {boardCount > 0 && (
          <FilterToggle pressed={onlyBoard} onClick={() => setOnlyBoard((v) => !v)}>
            Pengurus saja <span className="opacity-60">({boardCount})</span>
          </FilterToggle>
        )}
      </FilterBar>

      <div className="mt-8 space-y-12">
        {groups.list.length === 0 && <EmptyState>Tidak ada anggota yang cocok. Coba ubah kata kunci atau filter.</EmptyState>}
        {groups.list.map(([k, items]) => (
          <section key={k} aria-labelledby={`ang-${k}`}>
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-line pb-3">
              <div className="flex flex-wrap items-baseline gap-x-3">
                <h2 id={`ang-${k}`} className="font-display text-4xl leading-none tracking-tight text-ink">
                  {k === NO_ANGKATAN ? k : `Angkatan ${k}`}
                </h2>
                {profiles[k] && <span className="font-display text-lg italic text-accent-600">“{profiles[k]}”</span>}
              </div>
              <p className="text-sm text-muted">
                {items.length} anggota
                {k !== NO_ANGKATAN && (
                  <>
                    {" · "}
                    <Link href={`/angkatan/${k}`} className="font-medium text-brand-700 hover:text-brand-900 hover:underline">
                      Profil →
                    </Link>
                  </>
                )}
              </p>
            </div>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {items.map((m, i) => {
                const role = roles[m.id];
                return (
                  <li key={m.id} style={{ "--i": i } as React.CSSProperties} className="card lift pop-in overflow-hidden">
                    <div className="relative aspect-square bg-gradient-to-br from-brand-100 to-sky-100">
                      {m.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.photo_url} alt={m.full_name} loading="lazy" className="h-full w-full object-cover" />
                      ) : (
                        <span aria-hidden className="grid h-full place-items-center font-display text-5xl text-brand-600/70">
                          {initials(m.full_name)}
                        </span>
                      )}
                      {role && (
                        <span className="absolute left-2 top-2">
                          <Badge tone="brand">{role.title}</Badge>
                        </span>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="truncate font-medium text-ink">{m.full_name}</p>
                      {m.nickname && <p className="truncate font-display text-lg italic leading-tight text-brand-700">“{m.nickname}”</p>}
                      {role?.division && <p className="mt-0.5 truncate text-xs text-muted">{role.division}</p>}
                      {m.status !== "aktif" && (
                        <div className="mt-1.5">
                          <Badge tone={m.status === "alumni" ? "accent" : "warn"}>{m.status === "alumni" ? "Alumni" : "Luar biasa"}</Badge>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
