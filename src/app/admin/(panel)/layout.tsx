import Link from "next/link";
import { redirect } from "next/navigation";
import { LogOut, Menu } from "lucide-react";
import { BrandMark } from "@/components/site/brand-mark";
import { requireAdmin } from "@/lib/auth";
import { supabaseConfigured } from "@/lib/supabase/public";
import { AdminNav, type AdminLink } from "@/components/admin-nav";
import { signOut } from "../actions";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  if (!supabaseConfigured) redirect("/admin/login");
  const admin = await requireAdmin();
  const { count } = await admin.supabase
    .from("member_submissions")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  const { count: postsPending } = await admin.supabase.from("posts").select("id", { count: "exact", head: true }).eq("status", "submitted");

  const links: AdminLink[] = [
    { href: "/admin", label: "Dashboard", icon: "dashboard" },
    { href: "/admin/verifikasi", label: "Verifikasi", icon: "verifikasi", badge: count ?? 0 },
    { href: "/admin/anggota", label: "Anggota", icon: "anggota" },
    { href: "/admin/periode", label: "Periode & Pengurus", icon: "periode" },
    { href: "/admin/gallery", label: "Gallery", icon: "gallery" },
    { href: "/admin/tulisan", label: "Blog & Berita", icon: "tulisan", badge: postsPending ?? 0 },
    { href: "/admin/penulis", label: "Penulis", icon: "penulis" },
    { href: "/admin/konten", label: "Konten Website", icon: "konten" },
    ...(admin.role === "super_admin" ? [{ href: "/admin/pengurus", label: "Akun Pengurus", icon: "pengurus" } as AdminLink] : []),
  ];

  const account = (
    <div className="border-t border-line pt-4 text-sm">
      <p className="truncate font-medium text-ink">{admin.name}</p>
      <p className="text-xs text-muted">{admin.role === "super_admin" ? "Super admin" : "Pengurus"}</p>
      <Link href="/" className="mt-3 block text-muted hover:text-ink">
        Lihat website ↗
      </Link>
      <form action={signOut}>
        <button type="submit" className="mt-2 flex items-center gap-2 text-muted hover:text-ink">
          <LogOut size={15} aria-hidden /> Keluar
        </button>
      </form>
    </div>
  );

  return (
    <div className="min-h-screen lg:flex">
      <aside className="hidden w-60 shrink-0 flex-col justify-between border-r border-line bg-surface p-4 lg:sticky lg:top-0 lg:flex lg:h-screen">
        <div>
          <Link href="/admin" className="mb-6 flex items-center gap-2 px-3 py-1 font-display text-lg font-medium text-ink">
            <BrandMark size={32} /> Panel Admin
          </Link>
          <AdminNav links={links} />
        </div>
        {account}
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-surface px-4 py-3 lg:hidden">
        <Link href="/admin" className="flex items-center gap-2 font-display font-medium text-ink">
          <BrandMark size={28} /> Panel Admin
        </Link>
        <details className="relative">
          <summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-control border border-line-strong [&::-webkit-details-marker]:hidden">
            <Menu size={20} aria-label="Menu" />
          </summary>
          <div className="absolute right-0 mt-2 w-64 space-y-4 rounded-card border border-line bg-surface p-4 shadow-float">
            <AdminNav links={links} />
            {account}
          </div>
        </details>
      </header>

      <main className="min-w-0 flex-1 px-4 py-10 sm:px-10">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
