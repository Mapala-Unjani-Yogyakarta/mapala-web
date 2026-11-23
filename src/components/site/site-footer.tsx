import Link from "next/link";
import type { SiteSettings } from "@/lib/types";
import { waNumber } from "@/lib/utils";
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
          <div>
            <p className="font-display text-3xl text-white">{s.org_name}</p>
            <p className="mt-1 text-sm text-brand-200">{s.tagline}</p>
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
        <div className="border-t border-brand-700 py-5 text-center text-xs text-brand-300">
          © {new Date().getFullYear()} {s.org_name}
        </div>
      </div>
    </footer>
  );
}
