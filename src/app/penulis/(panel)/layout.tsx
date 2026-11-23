import Link from "next/link";
import { LogOut } from "lucide-react";
import { requireAuthor } from "@/lib/author-auth";
import { getSettings } from "@/lib/data";
import { BrandMark } from "@/components/site/brand-mark";
import { signOutAuthor } from "../actions";

export const dynamic = "force-dynamic";

export default async function AuthorLayout({ children }: { children: React.ReactNode }) {
  const [author, s] = await Promise.all([requireAuthor(), getSettings()]);
  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/penulis" className="flex items-center gap-2.5 font-display text-lg text-ink">
            <BrandMark size={32} /> Ruang Penulis
            <span className="hidden text-sm font-sans text-muted sm:inline">· {s.org_name}</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/blog" className="text-muted hover:text-ink">Lihat blog ↗</Link>
            <span className="hidden text-muted sm:inline">{author.name}</span>
            <form action={signOutAuthor}>
              <button type="submit" className="flex items-center gap-1.5 text-muted hover:text-ink">
                <LogOut size={15} aria-hidden /> Keluar
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">{children}</main>
    </div>
  );
}
