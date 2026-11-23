import type { Metadata } from "next";
import { MemberForm } from "@/components/member-form";
import { createServiceClient } from "@/lib/supabase/admin";
import { PageHero } from "@/components/site/page-hero";
import { getAngkatanValues } from "@/lib/data";
import { buildAngkatanOptions } from "@/lib/utils";
import { submitMemberForm } from "../../isi-data/actions";

// Halaman pribadi: jangan diindeks mesin pencari dan jangan di-cache.
export const metadata: Metadata = { title: "Ubah Data Anggota", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function UbahDataPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  let defaults: Record<string, string | null> | null = null;
  let photo: string | null = null;
  let openTo: string[] = [];
  try {
    const db = createServiceClient();
    const { data: priv } = await db.from("member_private").select("*").eq("edit_token", token).maybeSingle();
    if (priv) {
      const { data: member } = await db.from("members").select("*").eq("id", priv.member_id).maybeSingle();
      if (member) {
        defaults = {
          ...priv,
          ...member,
          skills: ((member.skills as string[] | null) ?? []).join(", "),
          grad_year: member.grad_year ? String(member.grad_year) : "",
        };
        photo = member.photo_url;
        openTo = (member.open_to as string[] | null) ?? [];
      }
    }
  } catch {
    defaults = null;
  }

  const angkatanOptions = buildAngkatanOptions(await getAngkatanValues());

  return (
    <>
      <PageHero
        eyebrow="Tautan pribadi"
        title="Ubah Data Anggota"
        desc={defaults ? `Halo, ${defaults.full_name}. Perubahan tampil setelah diverifikasi pengurus.` : undefined}
      />
      <div className="mx-auto max-w-2xl px-4 pb-6 sm:px-6">
        {defaults ? (
          <>
            <p className="text-sm text-muted">Jangan bagikan tautan ini ke orang lain.</p>
            <div className="panel mt-4 p-5 sm:p-8">
              <MemberForm action={submitMemberForm} defaults={defaults} token={token} currentPhoto={photo} angkatanOptions={angkatanOptions} defaultOpenTo={openTo} />
            </div>
          </>
        ) : (
          <div className="rounded-card border border-danger-200 bg-danger-50 p-6 text-sm text-danger-700">
            Tautan ini tidak valid atau sudah dicabut. Silakan minta tautan baru kepada pengurus.
          </div>
        )}
      </div>
    </>
  );
}
