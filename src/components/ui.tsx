/**
 * Komponen dasar UI. Semua warna/bentuk berasal dari token di
 * src/app/globals.css — jangan menulis warna mentah (mis. gray-500) di sini.
 */
import Link from "next/link";
import { cx } from "@/lib/utils";

/* ── Gaya form & tombol ───────────────────────────────────────────── */
export const inputCls =
  "block w-full rounded-control border border-line-strong bg-surface px-3 py-2 text-sm text-ink placeholder:text-faint focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:bg-sunken";

export const btnBase =
  "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:cursor-not-allowed disabled:opacity-60";
export const btnPrimary = cx(btnBase, "bg-brand-700 text-white hover:bg-brand-800");
export const btnGhost = cx(btnBase, "border border-line-strong bg-surface text-ink hover:bg-sunken");
export const btnDanger = cx(btnBase, "border border-danger-200 bg-surface text-danger-700 hover:bg-danger-50");
export const btnAccent = cx(btnBase, "bg-accent-500 text-white hover:bg-accent-600");

/* ── Form ─────────────────────────────────────────────────────────── */
export function Field({
  label,
  hint,
  required,
  children,
  className,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cx("block", className)}>
      <span className="mb-1 block text-sm font-medium text-ink">
        {label}
        {required && <span className="text-accent-500"> *</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

/* ── Label status ─────────────────────────────────────────────────── */
const BADGE_TONES = {
  brand: "bg-brand-100 text-brand-800",
  accent: "bg-accent-50 text-accent-600",
  warn: "bg-warn-100 text-warn-800",
  danger: "bg-danger-100 text-danger-700",
  neutral: "bg-sunken text-muted",
};
export type BadgeTone = keyof typeof BADGE_TONES;

export function Badge({ tone = "neutral", children }: { tone?: BadgeTone; children: React.ReactNode }) {
  return (
    <span className={cx("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", BADGE_TONES[tone])}>
      {children}
    </span>
  );
}

/* ── Tata letak ───────────────────────────────────────────────────── */
export function PageHeader({
  title,
  desc,
  action,
  back,
}: {
  title: string;
  desc?: string;
  action?: React.ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <div className="mb-8">
      {back && (
        <Link href={back.href} className="mb-3 inline-block text-sm text-muted hover:text-ink">
          ← {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-medium tracking-tight text-ink">{title}</h1>
          {desc && <p className="mt-1 max-w-2xl text-sm text-muted">{desc}</p>}
        </div>
        {action}
      </div>
    </div>
  );
}

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cx("card p-5", className)}>{children}</div>;
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-card border border-dashed border-line-strong px-6 py-12 text-center text-sm text-muted">
      {children}
    </div>
  );
}

/** Kepala bagian di halaman publik: label kecil + judul + tautan opsional. */
export function SectionHeading({
  eyebrow,
  title,
  href,
  hrefLabel,
  tone = "dark",
}: {
  eyebrow?: string;
  title: string;
  href?: string;
  hrefLabel?: string;
  /** "light" = teks putih untuk latar gelap (senja/malam). */
  tone?: "dark" | "light";
}) {
  const light = tone === "light";
  return (
    <div className="mb-10 flex items-end justify-between gap-4">
      <div>
        {eyebrow && <p className={cx("eyebrow mb-2", light && "!text-white/70")}>{eyebrow}</p>}
        <h2 className={cx("section-title", light && "!text-white")}>{title}</h2>
      </div>
      {href && (
        <Link href={href} className={cx("shrink-0 text-sm font-medium", light ? "text-cream hover:text-white" : "text-brand-700 hover:text-brand-900")}>
          {hrefLabel ?? "Lihat semua"} →
        </Link>
      )}
    </div>
  );
}

export function Avatar({ src, name, size = 40 }: { src?: string | null; name: string; size?: number }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={name} width={size} height={size} loading="lazy" className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />
  ) : (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-brand-100 font-medium text-brand-700"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials}
    </span>
  );
}
