"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Camera, CalendarRange, FileText, LayoutDashboard, ShieldCheck, UserCog, Users, type LucideIcon } from "lucide-react";
import { cx } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  verifikasi: ShieldCheck,
  anggota: Users,
  periode: CalendarRange,
  gallery: Camera,
  konten: FileText,
  pengurus: UserCog,
};

export type AdminLink = { href: string; label: string; icon: keyof typeof ICONS; badge?: number };

/** Menu samping panel admin dengan penanda halaman aktif. */
export function AdminNav({ links }: { links: AdminLink[] }) {
  const pathname = usePathname();
  return (
    <ul className="space-y-0.5">
      {links.map((l) => {
        const Icon = ICONS[l.icon];
        const active = l.href === "/admin" ? pathname === "/admin" : pathname.startsWith(l.href);
        return (
          <li key={l.href}>
            <Link
              href={l.href}
              aria-current={active ? "page" : undefined}
              className={cx(
                "flex items-center gap-3 rounded-control px-3 py-2 text-sm transition-colors",
                active ? "bg-brand-50 font-medium text-brand-800" : "text-muted hover:bg-sunken hover:text-ink",
              )}
            >
              <Icon size={17} aria-hidden />
              <span className="flex-1">{l.label}</span>
              {!!l.badge && <span className="rounded-full bg-accent-500 px-2 py-0.5 text-xs font-medium text-white">{l.badge}</span>}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
