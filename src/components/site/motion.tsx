"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";

type Variant = "up" | "fade" | "left" | "right" | "scale";

/**
 * Memunculkan isinya dengan halus saat pertama kali terlihat di layar.
 * Tanpa JavaScript atau dengan "kurangi gerakan", isinya langsung tampil biasa (lihat globals.css).
 */
export function Reveal({
  children,
  variant = "up",
  delay = 0,
  as: Tag = "div",
  className,
}: {
  children: React.ReactNode;
  variant?: Variant;
  /** Jeda dalam milidetik, untuk memunculkan item berurutan */
  delay?: number;
  as?: "div" | "li" | "section" | "p" | "span";
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      el.setAttribute("data-in", "");
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          el.setAttribute("data-in", "");
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const Comp = Tag as React.ElementType;
  return (
    <Comp ref={ref} data-reveal={variant} style={delay ? ({ "--d": `${delay}ms` } as React.CSSProperties) : undefined} className={className}>
      {children}
    </Comp>
  );
}

/** Angka yang berhitung naik dari 0 saat terlihat. Teks akhir sudah ada di HTML awal (aman untuk mesin pencari). */
export function CountUp({ value, duration = 1400, className }: { value: number; duration?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches || typeof IntersectionObserver === "undefined") return;
    let raf = 0;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - t, 3);
          el.textContent = String(Math.round(value * eased));
          if (t < 1) raf = requestAnimationFrame(tick);
        };
        el.textContent = "0";
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, duration]);
  return (
    <span ref={ref} className={className}>
      {value}
    </span>
  );
}

/** Garis tipis di puncak layar yang memanjang sesuai kemajuan membaca. */
export function ScrollProgress() {
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = bar.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      el.style.transform = `scaleX(${max > 0 ? Math.min(window.scrollY / max, 1) : 0})`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);
  return <div ref={bar} aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px] origin-left scale-x-0 bg-accent-500" />;
}

/** Tombol kembali ke atas; muncul halus setelah menggulir cukup jauh. */
export function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 900);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <button
      type="button"
      aria-label="Kembali ke atas"
      tabIndex={show ? 0 : -1}
      onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })}
      className={
        "press glass-light fixed bottom-5 right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full text-brand-800 shadow-float transition-[opacity,transform] duration-300 hover:-translate-y-0.5 sm:right-6 " +
        (show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0")
      }
    >
      <ArrowUp size={18} aria-hidden />
    </button>
  );
}
