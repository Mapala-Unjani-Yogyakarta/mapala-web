"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Badge, EmptyState, inputCls } from "@/components/ui";
import { angkatanValue, cx } from "@/lib/utils";
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

/** Daftar anggota aktif: berorientasi wajah, dengan jabatan saat ini, dikelompokkan per angkatan ("keluarga"). */
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
  }, [members, roles, onlyBoard, angkatan, query, angkatanList]);

  const chip = (active: boolean) =>
    cx("shrink-0 rounded-full border px-4 py-1.5 text-sm transition-colors", active ? "border-brand-700 bg-brand-700 text-white" : "border-line-strong bg-surface text-body hover:border-brand-400");

  return (
    <div>
      <div className="space-y-4">
        <div className="relative">
          <Search size={16} aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama, nama lapangan, atau jabatan" aria-label="Cari anggota" className={cx(inputCls, "!rounded-full !py-2.5 !pl-10")} />
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Tampilkan">
          <button type="button" aria-pressed={!onlyBoard} onClick={() => setOnlyBoard(false)} className={chip(!onlyBoard)}>
            Semua anggota
          </button>
          {boardCount > 0 && (
            <button type="button" aria-pressed={onlyBoard} onClick={() => setOnlyBoard(true)} className={chip(onlyBoard)}>
              Pengurus saat ini <span className="opacity-60">· {boardCount}</span>
            </button>
          )}
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
        Menampilkan {groups.total} dari {members.length} anggota aktif
      </p>

      <div className="mt-8 space-y-16">
        {groups.list.length === 0 && <EmptyState>Tidak ada anggota yang cocok. Coba ubah kata kunci atau filter.</EmptyState>}
        {groups.list.map(([k, items]) => (
          <section key={k} aria-labelledby={`ang-${k}`}>
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
              <div>
                {k !== NO_ANGKATAN && <p className="eyebrow mb-1">Angkatan</p>}
                <h2 id={`ang-${k}`} className="font-display text-6xl leading-none tracking-tight text-ink">
                  {k}
                </h2>
                {profiles[k] && <p className="mt-2 font-display text-xl italic text-accent-600">“{profiles[k]}”</p>}
              </div>
              <div className="text-right text-sm text-muted">
                <p>{items.length} anggota aktif</p>
                {k !== NO_ANGKATAN && (
                  <Link href={`/angkatan/${k}`} className="font-medium text-brand-700 hover:text-brand-900">
                    Profil angkatan →
                  </Link>
                )}
              </div>
            </div>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {items.map((m) => {
                const role = roles[m.id];
                return (
                  <li key={m.id} className="card overflow-hidden">
                    <div className="relative aspect-[4/5] bg-gradient-to-br from-brand-100 to-sky-100">
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
                      {m.status === "luar_biasa" && (
                        <div className="mt-1.5">
                          <Badge tone="warn">Luar biasa</Badge>
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
