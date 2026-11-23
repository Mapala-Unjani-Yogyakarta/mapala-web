"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import { Briefcase, MapPin, PenLine, Search } from "lucide-react";
import { Avatar, Badge, EmptyState, inputCls } from "@/components/ui";
import { BIDANG, OPEN_TO, openToLabel } from "@/lib/profile-options";
import { angkatanValue, cx } from "@/lib/utils";
import type { Alumnus, AlumnusPost } from "@/lib/types";
import { IntroDialog } from "./intro-dialog";

const NO_BIDANG = "Belum memilih bidang";
const linkCls = "rounded-full border border-line-strong px-3 py-1 text-xs font-medium text-body transition-colors hover:border-brand-500 hover:text-brand-700";

const cityKey = (c: string | null | undefined) => (c ?? "").trim().toLowerCase();

/** Jaringan alumni: dikelompokkan per bidang, saring kota / angkatan / "terbuka untuk", dan minta dikenalkan lewat pengurus. */
export function AlumniDirectory({ alumni, posts }: { alumni: Alumnus[]; posts: Record<string, AlumnusPost[]> }) {
  const [q, setQ] = useState("");
  const [bidang, setBidang] = useState("semua");
  const [city, setCity] = useState("semua");
  const [open, setOpen] = useState("semua");
  const [angkatan, setAngkatan] = useState("semua");
  const [target, setTarget] = useState<Alumnus | null>(null);
  const query = useDeferredValue(q.trim().toLowerCase());

  const cities = useMemo(() => {
    const m = new Map<string, { label: string; n: number }>();
    for (const a of alumni) {
      const k = cityKey(a.city);
      if (!k) continue;
      const cur = m.get(k);
      m.set(k, { label: cur?.label ?? a.city!.trim(), n: (cur?.n ?? 0) + 1 });
    }
    return [...m.entries()].sort((a, b) => b[1].n - a[1].n || a[1].label.localeCompare(b[1].label)).slice(0, 10);
  }, [alumni]);

  const angkatanList = useMemo(
    () =>
      [...new Set(alumni.map((a) => a.angkatan?.trim()).filter(Boolean) as string[])].sort((a, b) => angkatanValue(b) - angkatanValue(a) || a.localeCompare(b)),
    [alumni],
  );

  const bidangCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of alumni) m.set(a.bidang || NO_BIDANG, (m.get(a.bidang || NO_BIDANG) ?? 0) + 1);
    return m;
  }, [alumni]);

  const groups = useMemo(() => {
    const filtered = alumni.filter((a) => {
      if (bidang !== "semua" && (a.bidang || NO_BIDANG) !== bidang) return false;
      if (city !== "semua" && cityKey(a.city) !== city) return false;
      if (angkatan !== "semua" && (a.angkatan?.trim() ?? "") !== angkatan) return false;
      if (open !== "semua" && !(a.open_to ?? []).includes(open)) return false;
      if (!query) return true;
      return [a.full_name, a.nickname, a.profession, a.workplace, a.city, a.bidang].filter(Boolean).join(" ").toLowerCase().includes(query);
    });
    const map = new Map<string, Alumnus[]>();
    for (const a of filtered) map.set(a.bidang || NO_BIDANG, [...(map.get(a.bidang || NO_BIDANG) ?? []), a]);
    const order = [...BIDANG, NO_BIDANG] as string[];
    return { total: filtered.length, list: [...map.entries()].sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0])) };
  }, [alumni, bidang, city, angkatan, open, query]);

  const chip = (active: boolean) =>
    cx("shrink-0 rounded-full border px-4 py-1.5 text-sm transition-colors", active ? "border-brand-700 bg-brand-700 text-white" : "border-line-strong bg-surface text-body hover:border-brand-400");
  const row = "-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0";
  const label = "mb-1.5 text-xs font-medium uppercase tracking-wider text-muted";

  return (
    <div>
      <div className="space-y-5">
        <div className="relative">
          <Search size={16} aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama, profesi, tempat kerja, atau kota" aria-label="Cari alumni" className={cx(inputCls, "!rounded-full !py-2.5 !pl-10")} />
        </div>

        <div>
          <p className={label}>Bidang</p>
          <div className={row} role="group" aria-label="Filter bidang">
            <div className="flex gap-2 pb-1">
              <button type="button" aria-pressed={bidang === "semua"} onClick={() => setBidang("semua")} className={chip(bidang === "semua")}>Semua bidang</button>
              {[...BIDANG, NO_BIDANG].filter((b) => bidangCounts.has(b)).map((b) => (
                <button key={b} type="button" aria-pressed={bidang === b} onClick={() => setBidang(b)} className={chip(bidang === b)}>
                  {b} <span className="opacity-60">· {bidangCounts.get(b)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {cities.length > 0 && (
          <div>
            <p className={label}>Kota</p>
            <div className={row} role="group" aria-label="Filter kota">
              <div className="flex gap-2 pb-1">
                <button type="button" aria-pressed={city === "semua"} onClick={() => setCity("semua")} className={chip(city === "semua")}>Semua kota</button>
                {cities.map(([k, c]) => (
                  <button key={k} type="button" aria-pressed={city === k} onClick={() => setCity(k)} className={chip(city === k)}>
                    {c.label} <span className="opacity-60">· {c.n}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className={label}>Terbuka untuk</p>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter terbuka untuk">
              <button type="button" aria-pressed={open === "semua"} onClick={() => setOpen("semua")} className={chip(open === "semua")}>Semua</button>
              {OPEN_TO.map((o) => (
                <button key={o.key} type="button" aria-pressed={open === o.key} onClick={() => setOpen(o.key)} className={chip(open === o.key)}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={label} htmlFor="f-angkatan">Angkatan</label>
            <select id="f-angkatan" value={angkatan} onChange={(e) => setAngkatan(e.target.value)} className={inputCls}>
              <option value="semua">Semua angkatan</option>
              {angkatanList.map((a) => (
                <option key={a} value={a}>Angkatan {a}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <p className="mt-7 text-sm text-muted" aria-live="polite">Menampilkan {groups.total} dari {alumni.length} alumni</p>

      <div className="mt-6 space-y-14">
        {groups.list.length === 0 && <EmptyState>Tidak ada alumni yang cocok. Coba ubah kata kunci atau filter.</EmptyState>}
        {groups.list.map(([b, items]) => (
          <section key={b} aria-labelledby={`bd-${b}`}>
            <div className="mb-5 flex items-baseline justify-between gap-3 border-b border-line pb-3">
              <h2 id={`bd-${b}`} className="font-display text-4xl tracking-tight text-ink">{b}</h2>
              <span className="text-sm text-muted">{items.length} alumni</span>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((a) => {
                const tulisan = posts[a.id] ?? [];
                return (
                  <li key={a.id} className="card flex flex-col gap-3 p-5">
                    <div className="flex items-center gap-3">
                      <Avatar src={a.photo_url} name={a.full_name} size={56} />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-ink">{a.full_name}</p>
                        <p className="truncate text-sm text-muted">
                          {a.angkatan ? <Link href={`/angkatan/${a.angkatan}`} className="hover:text-brand-700 hover:underline">Angkatan {a.angkatan}</Link> : "Tanpa angkatan"}
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
                    {(a.open_to ?? []).length > 0 && (
                      <div className="flex flex-wrap gap-1.5" aria-label="Terbuka untuk">
                        {(a.open_to ?? []).map((k) => (
                          <Badge key={k} tone="brand">{openToLabel(k)}</Badge>
                        ))}
                      </div>
                    )}
                    {tulisan.length > 0 && (
                      <div className="rounded-control bg-sunken/70 px-3 py-2 text-sm">
                        <p className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted">
                          <PenLine size={12} aria-hidden /> Menulis di blog
                        </p>
                        <ul className="space-y-0.5">
                          {tulisan.slice(0, 2).map((p) => (
                            <li key={p.id}>
                              <Link href={`/blog/${p.slug}`} className="text-brand-700 hover:underline">{p.title}</Link>
                            </li>
                          ))}
                        </ul>
                        {tulisan.length > 2 && <p className="mt-1 text-xs text-muted">+{tulisan.length - 2} tulisan lain</p>}
                      </div>
                    )}
                    <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
                      <button type="button" onClick={() => setTarget(a)} className="rounded-full bg-brand-700 px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand-800">
                        Minta dikenalkan
                      </button>
                      {a.public_instagram && <a href={`https://instagram.com/${a.public_instagram}`} target="_blank" rel="noopener noreferrer" className={linkCls}>Instagram</a>}
                      {a.public_linkedin && <a href={a.public_linkedin} target="_blank" rel="noopener noreferrer" className={linkCls}>LinkedIn</a>}
                      {a.public_whatsapp && <a href={`https://wa.me/${a.public_whatsapp}`} target="_blank" rel="noopener noreferrer" className={linkCls}>WhatsApp</a>}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      <IntroDialog target={target} onClose={() => setTarget(null)} />
    </div>
  );
}
