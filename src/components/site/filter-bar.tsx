"use client";

import { useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { inputCls } from "@/components/ui";
import { cx } from "@/lib/utils";

/**
 * Bilah filter ringkas: satu kolom cari + beberapa pilihan (dropdown).
 * Di HP pilihan dilipat di balik tombol "Filter"; di layar lebar langsung terlihat dalam satu baris.
 */
export function FilterBar({
  q,
  onQ,
  placeholder,
  activeCount,
  onReset,
  summary,
  cols = "lg:grid-cols-4",
  children,
}: {
  q: string;
  onQ: (v: string) => void;
  placeholder: string;
  activeCount: number;
  onReset: () => void;
  summary: string;
  cols?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
          <input type="search" value={q} onChange={(e) => onQ(e.target.value)} placeholder={placeholder} aria-label={placeholder} className={cx(inputCls, "!rounded-full !py-2.5 !pl-10")} />
        </div>
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className={cx("inline-flex shrink-0 items-center gap-2 rounded-full border px-4 text-sm sm:hidden", activeCount > 0 ? "border-brand-600 bg-brand-50 font-medium text-brand-800" : "border-line-strong bg-surface text-body")}
        >
          <SlidersHorizontal size={15} aria-hidden /> Filter{activeCount > 0 ? ` · ${activeCount}` : ""}
        </button>
      </div>

      <div className={cx(open ? "grid" : "hidden", "gap-2 sm:grid sm:grid-cols-2", cols)}>{children}</div>

      <div className="flex items-center justify-between gap-3 text-sm text-muted">
        <span aria-live="polite">{summary}</span>
        {activeCount > 0 && (
          <button type="button" onClick={onReset} className="shrink-0 font-medium text-brand-700 hover:text-brand-900 hover:underline">
            Atur ulang
          </button>
        )}
      </div>
    </div>
  );
}

/** Dropdown ringkas. Bernilai "semua" = tidak ada filter (tidak disorot). */
export function FilterSelect({ label, value, onChange, children }: { label: string; value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cx(inputCls, "!rounded-full !py-2 !pl-4 !text-sm", value !== "semua" && "!border-brand-600 !bg-brand-50 font-medium text-brand-800")}
      >
        {children}
      </select>
    </label>
  );
}

/** Tombol sakelar berbentuk pil (mis. "Pengurus saja"). */
export function FilterToggle({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cx("rounded-full border px-4 py-2 text-left text-sm transition-colors", pressed ? "border-brand-600 bg-brand-50 font-medium text-brand-800" : "border-line-strong bg-surface text-body hover:border-brand-400")}
    >
      {children}
    </button>
  );
}
