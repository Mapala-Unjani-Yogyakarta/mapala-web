"use client";

import { useEffect, useRef } from "react";
import { cx } from "@/lib/utils";

/**
 * Pembungkus bagian dengan latar adegan berparalaks.
 * Setiap elemen `[data-depth]` di dalam `scene` bergeser turun mengikuti scroll,
 * jadi tampak lebih lambat dari halaman (makin besar depth = makin jauh).
 * Dimatikan otomatis bila pengguna memilih "kurangi gerakan".
 *
 *  mode "section": progres dihitung dari saat bagian masuk layar sampai keluar.
 *  mode "hero"   : progres dihitung dari posisi paling atas halaman.
 */
export function Parallax({
  scene,
  children,
  className,
  mode = "section",
  id,
  label,
}: {
  scene: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  mode?: "section" | "hero";
  id?: string;
  label?: string;
}) {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const layers = [...el.querySelectorAll<HTMLElement>("[data-depth]")];
    let raf = 0;
    let visible = false;

    const update = () => {
      raf = 0;
      if (!visible) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const t =
        mode === "hero"
          ? Math.min(Math.max(-rect.top / rect.height, 0), 1)
          : Math.min(Math.max((vh - rect.top) / (vh + rect.height), 0), 1);
      for (const l of layers) {
        const depth = parseFloat(l.dataset.depth ?? "0");
        l.style.transform = `translate3d(0, ${(t * depth * rect.height * 0.7).toFixed(1)}px, 0)`;
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    // Hanya hitung & promosikan ke GPU selagi bagian ini terlihat di layar
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        for (const l of layers) l.style.willChange = visible ? "transform" : "auto";
        if (visible) onScroll();
      },
      { rootMargin: "120px 0px" },
    );
    io.observe(el);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [mode]);

  return (
    <section ref={root} id={id} aria-label={label} className={cx("relative isolate overflow-hidden", className)}>
      <div aria-hidden className="absolute inset-0 -z-10">
        {scene}
      </div>
      <div className="relative">{children}</div>
    </section>
  );
}
