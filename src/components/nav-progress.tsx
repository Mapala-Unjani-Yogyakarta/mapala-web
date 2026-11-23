"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Bilah progres tipis di tepi atas layar saat pindah halaman.
 * Mulai saat tautan internal diklik; selesai saat halaman baru tampil
 * (perubahan alamat, atau isi halaman berhenti berubah). Tanpa state React.
 */
export function NavProgress() {
  const bar = useRef<HTMLDivElement>(null);
  const timers = useRef<{ trickle?: number; safety?: number; settle?: number }>({});
  const pathname = usePathname();

  // Selesai bila alamat berubah
  useEffect(() => {
    finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      if (!running()) return;
      // isi halaman berubah lalu diam 350 md → anggap selesai (mis. pindah dengan query berbeda)
      window.clearTimeout(timers.current.settle);
      timers.current.settle = window.setTimeout(() => {
        if (performance.now() - startedAt.current > 250) finish();
      }, 350);
    });
    observer.observe(document.body, { childList: true, subtree: true });

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search) return;
      start();
    };
    const onPop = () => start();
    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPop);
    return () => {
      observer.disconnect();
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPop);
      clearTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startedAt = useRef(0);
  const active = useRef(false);
  const running = () => active.current;

  function clearTimers() {
    window.clearInterval(timers.current.trickle);
    window.clearTimeout(timers.current.safety);
    window.clearTimeout(timers.current.settle);
  }

  function start() {
    const el = bar.current;
    if (!el) return;
    clearTimers();
    active.current = true;
    startedAt.current = performance.now();
    el.style.transition = "none";
    el.style.opacity = "1";
    el.style.width = "0%";
    void el.offsetWidth; // paksa reflow agar animasi mulai dari 0
    el.style.transition = "width 300ms ease-out, opacity 250ms ease-out";
    el.style.width = "18%";
    let w = 18;
    timers.current.trickle = window.setInterval(() => {
      w += (90 - w) * 0.12; // melambat mendekati 90%
      el.style.width = `${w.toFixed(1)}%`;
    }, 280);
    timers.current.safety = window.setTimeout(finish, 12000); // jaga-jaga bila tidak pernah selesai
  }

  function finish() {
    const el = bar.current;
    if (!el || !active.current) return;
    active.current = false;
    clearTimers();
    el.style.width = "100%";
    window.setTimeout(() => {
      el.style.opacity = "0";
    }, 220);
  }

  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px]">
      <div ref={bar} className="h-full bg-accent-500 shadow-[0_0_10px_rgba(168,105,58,0.6)]" style={{ width: "0%", opacity: 0 }} />
    </div>
  );
}
