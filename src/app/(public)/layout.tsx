import { getSettings } from "@/lib/data";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";

// Halaman publik disegarkan paling lama tiap 60 detik (dan langsung saat admin menyimpan perubahan).
export const revalidate = 60;

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const s = await getSettings();
  return (
    <>
      <SiteHeader orgName={s.org_name} />
      <main className="flex-1">{children}</main>
      <SiteFooter s={s} />
    </>
  );
}
