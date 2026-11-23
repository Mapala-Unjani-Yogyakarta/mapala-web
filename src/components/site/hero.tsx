"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ArrowRight } from "lucide-react";
import { MountainLayer, PaintFilter } from "./mountains";
import { BrandMark } from "./brand-mark";

/** Ukuran tulisan menyesuaikan panjang nama agar tidak meluap. */
function wordmarkSize(name: string) {
  const n = name.trim().length;
  if (n <= 8) return "text-[clamp(4.5rem,19vw,17rem)]";
  if (n <= 14) return "text-[clamp(4rem,14.5vw,12rem)]";
  if (n <= 22) return "text-[clamp(2.6rem,8.5vw,8rem)]";
  return "text-[clamp(2.2rem,6vw,5.5rem)]";
}

/**
 * Hero layar penuh: langit, gunung berlapis, dan nama organisasi raksasa.
 * Saat di-scroll, tiap lapis bergeser dengan kecepatan berbeda (paralaks).
 * Dimatikan otomatis bila pengguna memilih "kurangi gerakan".
 */
export function Hero({ orgName, tagline }: { orgName: string; tagline: string }) {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const layers = [...el.querySelectorAll<HTMLElement>("[data-depth]")];
    let raf = 0;

    let h = el.offsetHeight;
    const measure = () => {
      h = el.offsetHeight;
      onScroll();
    };
    const update = () => {
      raf = 0;
      if (window.scrollY > h * 1.1) return; // hero sudah lewat: tidak perlu menghitung
      const p = Math.min(Math.max(window.scrollY / h, 0), 1);
      for (const l of layers) {
        const depth = parseFloat(l.dataset.depth ?? "0");
        const zoom = parseFloat(l.dataset.zoom ?? "0");
        const fade = parseFloat(l.dataset.fade ?? "0");
        l.style.transform = `translate3d(0, ${(p * depth * h).toFixed(1)}px, 0) scale(${(1 + p * zoom).toFixed(4)})`;
        if (fade) l.style.opacity = String(Math.max(0, 1 - p * fade));
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const layer = "absolute inset-x-0 bottom-0 h-[78%] will-change-transform [transform-origin:50%_100%]";

  return (
    <section
      ref={root}
      aria-label={orgName}
      className="relative isolate h-[100svh] min-h-[620px] overflow-hidden bg-gradient-to-b from-sky-800 via-sky-500 to-sky-200"
    >
      <PaintFilter />

      {/* Cahaya matahari & awan tipis */}
      <div data-depth="0.7" className="absolute inset-0 will-change-transform">
        <div className="absolute left-1/2 top-[34%] h-[60%] w-[90%] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(255_255_255/0.55),transparent)]" />
        <div className="absolute left-[6%] top-[22%] h-24 w-72 rounded-full bg-[radial-gradient(closest-side,rgb(255_255_255/0.3),transparent)]" />
        <div className="absolute right-[8%] top-[30%] h-28 w-80 rounded-full bg-[radial-gradient(closest-side,rgb(255_255_255/0.25),transparent)]" />
      </div>

      <div data-depth="0.55" data-zoom="0.04" className={layer}>
        <MountainLayer kind="far" />
      </div>
      <div data-depth="0.4" data-zoom="0.08" className={layer}>
        <MountainLayer kind="mid" />
      </div>
      <div data-depth="0.26" data-zoom="0.12" className={layer}>
        <MountainLayer kind="main" />
      </div>

      {/* Nama organisasi: di antara puncak utama dan bukit depan */}
      <div data-depth="0.34" data-fade="2.4" className="absolute inset-x-0 top-[31%] z-20 px-4 text-center will-change-transform sm:top-[29%]">
        <div className="rise mb-4 flex justify-center" style={{ animationDelay: "0.1s" }}>
          <BrandMark size={68} className="shadow-[0_6px_24px_rgba(16,24,50,0.35)] ring-2 ring-white/60" priority />
        </div>
        <p className="rise text-sm tracking-wide text-white/90 sm:text-base" style={{ animationDelay: "0.2s" }}>
          {tagline}
        </p>
        <h1
          className={`rise font-display mt-1 leading-[0.95] tracking-[-0.03em] text-white drop-shadow-[0_2px_28px_rgba(16,38,28,0.5)] ${wordmarkSize(orgName)}`}
          style={{ animationDelay: "0.35s" }}
        >
          {orgName}
        </h1>
      </div>

      <div data-depth="0.1" data-zoom="0.16" className={layer + " z-30"}>
        <MountainLayer kind="front" />
      </div>

      {/* Kabut di dasar: menyatu ke warna halaman */}
      <div aria-hidden className="absolute inset-x-0 bottom-0 z-30 h-[26%] bg-gradient-to-t from-canvas via-canvas/60 to-transparent" />

      <div className="rise absolute inset-x-0 bottom-8 z-40 flex flex-col items-center gap-5 px-4" style={{ animationDelay: "0.7s" }}>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/isi-data" className="inline-flex items-center gap-2 rounded-full bg-cream px-6 py-3 text-sm font-medium text-brand-800 transition-transform hover:-translate-y-0.5">
            Isi Data Anggota <ArrowRight size={16} aria-hidden />
          </Link>
          <Link href="/gallery" className="glass inline-flex items-center rounded-full px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-white/40">
            Lihat Gallery
          </Link>
        </div>
        <div className="flex flex-col items-center gap-2 text-xs tracking-wide text-muted" aria-hidden>
          Gulir untuk mulai
          <span className="scroll-hint block h-8 w-px bg-brand-600" />
        </div>
      </div>
    </section>
  );
}
