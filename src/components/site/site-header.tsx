"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { Menu, Mountain, X } from "lucide-react";
import { cx } from "@/lib/utils";
import { NAV } from "./nav";

/** true selama halaman masih di area hero (dipakai agar navbar berganti gaya). */
function useInHeroZone() {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener("scroll", cb, { passive: true });
      return () => window.removeEventListener("scroll", cb);
    },
    () => window.scrollY < window.innerHeight * 0.55,
    () => true,
  );
}

/** Navbar pil melayang dari kaca buram. Di atas hero berwarna putih; di tempat lain gelap. */
export function SiteHeader({ orgName }: { orgName: string }) {
  const pathname = usePathname();
  const inHero = useInHeroZone();
  const hasSceneHero = pathname === "/" || pathname.startsWith("/periode") || pathname.startsWith("/gallery");
  const overHero = hasSceneHero && inHero;
  // `key` mereset menu mobile setiap pindah halaman
  return <HeaderBar key={pathname} orgName={orgName} overHero={overHero} pathname={pathname} />;
}

function HeaderBar({ orgName, overHero, pathname }: { orgName: string; overHero: boolean; pathname: string }) {
  const [open, setOpen] = useState(false);
  const text = overHero ? "text-white" : "text-ink";
  const muted = overHero ? "text-white/80 hover:text-white" : "text-muted hover:text-ink";

  return (
    <header className="fixed inset-x-0 top-3 z-50 px-3 sm:top-5 sm:px-6">
      <div className={cx("mx-auto flex max-w-5xl items-center justify-between rounded-full py-2 pl-5 pr-2 transition-colors duration-300", overHero ? "glass" : "glass-light")}>
        <Link href="/" className={cx("flex items-center gap-2 font-display text-xl", text)}>
          <Mountain size={18} aria-hidden />
          {orgName}
        </Link>

        <nav aria-label="Menu utama" className="hidden items-center gap-7 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              aria-current={pathname === n.href ? "page" : undefined}
              className={cx("text-sm transition-colors", muted, pathname === n.href && (overHero ? "text-white" : "text-ink"))}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/isi-data" className={cx("hidden rounded-full px-5 py-2.5 text-sm font-medium transition-transform hover:-translate-y-0.5 sm:inline-block", overHero ? "bg-cream text-brand-800" : "bg-brand-700 text-white")}>
            Isi Data Anggota
          </Link>
          <button
            type="button"
            aria-expanded={open}
            aria-label={open ? "Tutup menu" : "Buka menu"}
            onClick={() => setOpen((o) => !o)}
            className={cx("flex h-10 w-10 items-center justify-center rounded-full md:hidden", overHero ? "bg-white/20 text-white" : "bg-sunken text-ink")}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="glass-light mx-auto mt-2 max-w-5xl rounded-card p-2 shadow-float md:hidden">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="block rounded-control px-4 py-3 text-body hover:bg-sunken">
              {n.label}
            </Link>
          ))}
          <Link href="/isi-data" className="mt-1 block rounded-full bg-brand-700 px-4 py-3 text-center text-sm font-medium text-white">
            Isi Data Anggota
          </Link>
        </div>
      )}
    </header>
  );
}
