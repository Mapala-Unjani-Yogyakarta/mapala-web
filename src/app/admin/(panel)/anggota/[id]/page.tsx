import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { Badge, Card, PageHeader } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/form";
import { siteUrl, waNumber } from "@/lib/utils";
import { MemberAdminForm } from "../member-admin-form";
import { EditLinkPanel } from "../edit-link-panel";
import { deleteMember } from "../actions";

export default async function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();

  const [{ data: member }, { data: priv }, { data: history }] = await Promise.all([
    supabase.from("members").select("*").eq("id", id).maybeSingle(),
    supabase.from("member_private").select("*").eq("member_id", id).maybeSingle(),
    supabase
      .from("positions")
      .select("id, title, division, periods(name, year_start)")
      .eq("member_id", id),
  ]);
  if (!member) notFound();

  const link = priv?.edit_token ? `${siteUrl()}/ubah/${priv.edit_token}` : null;
  const defaults = { ...(priv ?? {}), ...member, is_public: String(member.is_public) };
  const jabatan = ((history ?? []) as unknown as { id: string; title: string; division: string | null; periods: { name: string; year_start: number } | null }[]).sort((a, b) => (b.periods?.year_start ?? 0) - (a.periods?.year_start ?? 0));

  return (
    <>
      <PageHeader title={member.full_name} desc={member.nickname ? `“${member.nickname}”` : undefined} back={{ href: "/admin/anggota", label: "Daftar anggota" }} />
      <div className="space-y-6">
        <Card>
          <h2 className="mb-4 font-semibold">Data anggota</h2>
          <MemberAdminForm id={id} defaults={defaults} />
        </Card>

        <Card>
          <h2 className="font-semibold">Tautan pribadi ubah data</h2>
          <p className="mb-4 mt-1 text-sm text-muted">
            Kirim tautan ini ke anggota agar ia bisa memperbarui datanya sendiri tanpa login. Perubahan tetap masuk antrean verifikasi.
          </p>
          <EditLinkPanel memberId={id} link={link} name={member.full_name} waPhone={priv?.phone ? waNumber(priv.phone) : null} />
        </Card>

        <Card>
          <h2 className="mb-3 font-semibold">Riwayat jabatan</h2>
          {jabatan.length === 0 ? (
            <p className="text-sm text-muted">Belum pernah menjabat. Tetapkan jabatan lewat menu Periode & Pengurus.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {jabatan.map((j) => (
                <li key={j.id} className="flex flex-wrap items-center gap-2">
                  <Badge tone="brand">{j.periods?.name}</Badge>
                  <span>
                    {j.title}
                    {j.division ? ` · ${j.division}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="border-danger-200">
          <h2 className="font-semibold text-danger-700">Hapus anggota</h2>
          <p className="mb-3 mt-1 text-sm text-muted">Menghapus anggota juga menghapus data privat dan riwayat jabatannya. Tindakan ini tidak bisa dibatalkan.</p>
          <ActionForm action={deleteMember}>
            <input type="hidden" name="id" value={id} />
            <SubmitButton variant="danger" confirm={`Hapus ${member.full_name} secara permanen?`}>
              Hapus anggota
            </SubmitButton>
          </ActionForm>
        </Card>
      </div>
    </>
  );
}
