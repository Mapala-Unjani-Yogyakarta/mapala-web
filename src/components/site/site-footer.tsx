import Link from "next/link";
import type { SiteSettings } from "@/lib/types";
import { waNumber } from "@/lib/utils";
import { BrandMark } from "./brand-mark";
import { Ridge } from "./mountains";
import { NAV } from "./nav";

const link = "text-brand-200 transition-colors hover:text-white";

export function SiteFooter({ s }: { s: SiteSettings }) {
  const ig = s.instagram.replace(/^@/, "");
  return (
    <footer className="mt-24">
      <Ridge seed={9} className="-mb-px block h-16 w-full text-brand-800 sm:h-24" />
      <div className="bg-brand-800 text-brand-100">
        <div className="container-page grid gap-10 py-14 md:grid-cols-3">
          <div className="flex items-start gap-4">
            <BrandMark size={64} className="ring-white/30" />
            <div>
              <p className="font-display text-3xl leading-tight text-white">{s.org_name}</p>
              <p className="mt-1 text-sm text-brand-200">{s.tagline}</p>
            </div>
          </div>

          <div className="text-sm">
            <p className="eyebrow mb-3 !text-brand-300">Kontak</p>
            <ul className="space-y-1.5 text-brand-200">
              {s.address && <li>{s.address}</li>}
              {s.contact_email && (
                <li>
                  <a className={link} href={`mailto:${s.contact_email}`}>
                    {s.contact_email}
                  </a>
                </li>
              )}
              {s.whatsapp && (
                <li>
                  <a className={link} href={`https://wa.me/${waNumber(s.whatsapp)}`}>
                    WhatsApp {s.whatsapp}
                  </a>
                </li>
              )}
              {ig && (
                <li>
                  <a className={link} href={`https://instagram.com/${ig}`}>
                    Instagram @{ig}
                  </a>
                </li>
              )}
            </ul>
          </div>

          <div className="text-sm">
            <p className="eyebrow mb-3 !text-brand-300">Jelajahi</p>
            <ul className="space-y-1.5">
              {NAV.map((n) => (
                <li key={n.href}>
                  <Link className={link} href={n.href}>
                    {n.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link className={link} href="/admin">
                  Login pengurus
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-brand-700 pb-20 pt-5 text-center text-xs text-brand-300 sm:pb-5">
          <p>© {new Date().getFullYear()} {s.org_name}</p>
          <p className="mt-2">
            Dibuat oleh{" "}
            <a
              href="https://www.linkedin.com/in/muhammad-rizky-0b8050212/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Muhammad Rizky (Pecul), developer website ini, di LinkedIn"
              className="group inline-flex items-center gap-1.5 font-medium text-brand-100 transition-colors hover:text-white"
            >
              <span className="link-grow">Muhammad Rizky (Pecul)</span>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-110">
                <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
              </svg>
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
