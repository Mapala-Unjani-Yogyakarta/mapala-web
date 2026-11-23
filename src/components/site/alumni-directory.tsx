"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useRef, useState } from "react";
import { Briefcase, GraduationCap, Globe, HeartHandshake, MapPin, PenLine, Rocket, UserRoundSearch } from "lucide-react";
import { Avatar, Badge, EmptyState } from "@/components/ui";
import { BIDANG, OPEN_TO, openToLabel } from "@/lib/profile-options";
import { angkatanValue, cx } from "@/lib/utils";
import type { Alumnus, AlumnusPost } from "@/lib/types";
import { FilterBar, FilterSelect } from "./filter-bar";
import { IntroDialog } from "./intro-dialog";

const NO_BIDANG = "Belum memilih bidang";
const linkCls = "rounded-full border border-line-strong px-3 py-1 text-xs font-medium text-body transition-colors hover:border-brand-500 hover:text-brand-700";

const ENTRIES = [
  { key: "mentor", title: "Cari mentor", desc: "Alumni yang bersedia membimbing", Icon: UserRoundSearch },
  { key: "rekrutmen", title: "Peluang kerja & magang", desc: "Alumni yang bisa membuka jalan", Icon: Rocket },
  { key: "dukungan", title: "Dukung kegiatan", desc: "Alumni yang siap mendukung organisasi", Icon: HeartHandshake },
] as const;

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
  const listRef = useRef<HTMLDivElement>(null);
  const jump = () => window.setTimeout(() => listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  const pickOpen = (k: string) => {
    setOpen((cur) => (cur === k ? "semua" : k));
    jump();
  };
  const pickCity = (k: string) => {
    setCity((cur) => (cur === k ? "semua" : k));
    jump();
  };
  const openCounts = useMemo(() => Object.fromEntries(ENTRIES.map((e) => [e.key, alumni.filter((a) => (a.open_to ?? []).includes(e.key)).length])), [alumni]);

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
      return [a.full_name, a.nickname, a.profession, a.workplace, a.city, a.bidang, a.bio, ...(a.skills ?? [])].filter(Boolean).join(" ").toLowerCase().includes(query);
    });
    const map = new Map<string, Alumnus[]>();
    for (const a of filtered) map.set(a.bidang || NO_BIDANG, [...(map.get(a.bidang || NO_BIDANG) ?? []), a]);
    const order = [...BIDANG, NO_BIDANG] as string[];
    return { total: filtered.length, list: [...map.entries()].sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0])) };
  }, [alumni, bidang, city, angkatan, open, query]);

  const activeCount = [bidang, city, open, angkatan].filter((v) => v !== "semua").length + (q ? 1 : 0);
  const reset = () => {
    setQ("");
    setBidang("semua");
    setCity("semua");
    setOpen("semua");
    setAngkatan("semua");
  };

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-3" role="group" aria-label="Cari alumni berdasarkan kebutuhan">
        {ENTRIES.map(({ key, title, desc, Icon }) => {
          const n = openCounts[key] ?? 0;
          const active = open === key;
          return (
            <button
              key={key}
              type="button"
              aria-pressed={active}
              disabled={n === 0 && !active}
              onClick={() => pickOpen(key)}
              className={cx(
                "card press flex items-center gap-3 p-4 text-left transition-[border-color,background-color,transform,box-shadow] duration-300 enabled:hover:-translate-y-0.5 enabled:hover:shadow-float disabled:cursor-not-allowed disabled:opacity-50",
                active ? "!border-brand-600 bg-brand-50" : "hover:border-brand-500",
              )}
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                <Icon size={20} aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block font-medium text-ink">
                  {title} <span className="text-brand-700">({n})</span>
                </span>
                <span className="block text-xs text-muted">{desc}</span>
              </span>
            </button>
          );
        })}
      </div>

      {cities.length > 0 && (
        <p className="mt-4 flex flex-wrap items-center gap-x-1 gap-y-1.5 text-sm text-muted" aria-label="Ringkasan kota">
          <span className="mr-1">Alumni di:</span>
          {cities.slice(0, 6).map(([k, c], i) => (
            <span key={k} className="inline-flex items-center">
              {i > 0 && <span aria-hidden className="mr-1 text-faint">·</span>}
              <button
                type="button"
                aria-pressed={city === k}
                onClick={() => pickCity(k)}
                className={cx("rounded-full px-2 py-0.5 transition-colors hover:text-brand-700", city === k ? "bg-brand-100 font-medium text-brand-800" : "text-body")}
              >
                {c.label} ({c.n})
              </button>
            </span>
          ))}
        </p>
      )}

      <div ref={listRef} className="mt-5 scroll-mt-24" />
      <FilterBar
        q={q}
        onQ={setQ}
        placeholder="Cari nama, keahlian, profesi, atau kota"
        activeCount={activeCount}
        onReset={reset}
        summary={`${groups.total} dari ${alumni.length} alumni`}
      >
        <FilterSelect label="Bidang" value={bidang} onChange={setBidang}>
          <option value="semua">Semua bidang</option>
          {[...BIDANG, NO_BIDANG].filter((b) => bidangCounts.has(b)).map((b) => (
            <option key={b} value={b}>
              {b} ({bidangCounts.get(b)})
            </option>
          ))}
        </FilterSelect>
        <FilterSelect label="Kota" value={city} onChange={setCity}>
          <option value="semua">Semua kota</option>
          {cities.map(([k, c]) => (
            <option key={k} value={k}>
              {c.label} ({c.n})
            </option>
          ))}
        </FilterSelect>
        <FilterSelect label="Terbuka untuk" value={open} onChange={setOpen}>
          <option value="semua">Terbuka untuk: semua</option>
          {OPEN_TO.map((o) => (
            <option key={o.key} value={o.key}>
              {o.label}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect label="Angkatan" value={angkatan} onChange={setAngkatan}>
          <option value="semua">Semua angkatan</option>
          {angkatanList.map((a) => (
            <option key={a} value={a}>
              Angkatan {a}
            </option>
          ))}
        </FilterSelect>
      </FilterBar>

      <div className="mt-8 space-y-12">
        {groups.list.length === 0 && <EmptyState>Tidak ada alumni yang cocok. Coba ubah kata kunci atau filter.</EmptyState>}
        {groups.list.map(([b, items]) => (
          <section key={b} aria-labelledby={`bd-${b}`}>
            <div className="mb-4 flex items-baseline justify-between gap-3 border-b border-line pb-3">
              <h2 id={`bd-${b}`} className="font-display text-3xl tracking-tight text-ink">{b}</h2>
              <span className="text-sm text-muted">{items.length} alumni</span>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((a, i) => {
                const tulisan = posts[a.id] ?? [];
                return (
                  <li key={a.id} style={{ "--i": i } as React.CSSProperties} className="card lift pop-in flex flex-col gap-2.5 p-4">
                    <div className="flex items-center gap-3">
                      <Avatar src={a.photo_url} name={a.full_name} size={48} />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-ink">{a.full_name}</p>
                        <p className="truncate text-sm text-muted">
                          {a.angkatan ? <Link href={`/angkatan/${a.angkatan}`} className="hover:text-brand-700 hover:underline">Angkatan {a.angkatan}</Link> : "Tanpa angkatan"}
                          {a.nickname ? ` · “${a.nickname}”` : ""}
                        </p>
                      </div>
                    </div>
                    {a.bio && <p className="text-sm leading-relaxed text-body">{a.bio}</p>}
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
                    {a.grad_year && (
                      <p className="flex items-center gap-2 text-sm text-body">
                        <GraduationCap size={15} aria-hidden className="shrink-0 text-brand-600" />
                        Lulus {a.grad_year}
                      </p>
                    )}
                    {(a.skills ?? []).length > 0 && (
                      <div className="flex flex-wrap gap-1.5" aria-label="Keahlian">
                        {(a.skills ?? []).map((sk) => (
                          <button
                            key={sk}
                            type="button"
                            onClick={() => {
                              setQ(sk);
                              jump();
                            }}
                            title={`Cari alumni dengan keahlian ${sk}`}
                            className="rounded-full bg-sunken px-2.5 py-0.5 text-xs text-body transition-colors hover:bg-brand-100 hover:text-brand-800"
                          >
                            {sk}
                          </button>
                        ))}
                      </div>
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
                      {a.website && (
                        <a href={a.website} target="_blank" rel="noopener noreferrer nofollow" className={cx(linkCls, "inline-flex items-center gap-1")}>
                          <Globe size={12} aria-hidden /> Situs
                        </a>
                      )}
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
