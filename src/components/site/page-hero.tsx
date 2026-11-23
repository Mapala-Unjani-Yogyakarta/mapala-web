import Link from "next/link";
import { Ridge } from "./mountains";

/** Kepala halaman versi ringan: langit lembut + siluet gunung + judul serif besar. */
export function PageHero({
  eyebrow,
  title,
  desc,
  back,
  children,
}: {
  eyebrow?: string;
  title: string;
  desc?: string;
  back?: { href: string; label: string };
  children?: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-sky-300 via-sky-200 to-sky-100 pb-24 pt-32 sm:pt-40">
      <Ridge seed={4} className="absolute inset-x-0 bottom-0 h-20 text-canvas sm:h-28" />
      <div className="container-page relative">
        {back && (
          <Link href={back.href} className="mb-4 inline-block text-sm text-sky-800/80 transition-colors hover:text-sky-800">
            ← {back.label}
          </Link>
        )}
        {eyebrow && <p className="eyebrow mb-3 !text-sky-700">{eyebrow}</p>}
        <h1 className="font-display text-5xl leading-[1.02] tracking-tight text-sky-800 sm:text-7xl">{title}</h1>
        {desc && <p className="mt-4 max-w-xl text-lg text-sky-800/80">{desc}</p>}
        {children}
      </div>
    </section>
  );
}
