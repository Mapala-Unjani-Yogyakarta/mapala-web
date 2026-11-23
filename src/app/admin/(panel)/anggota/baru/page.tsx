import { requireAdmin } from "@/lib/auth";
import { Card, PageHeader } from "@/components/ui";
import { buildAngkatanOptions } from "@/lib/utils";
import { MemberAdminForm } from "../member-admin-form";

export default async function NewMemberPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("members").select("angkatan");
  const angkatanOptions = buildAngkatanOptions(((data ?? []) as { angkatan: string | null }[]).map((r) => r.angkatan));
  return (
    <>
      <PageHeader title="Tambah Anggota" back={{ href: "/admin/anggota", label: "Daftar anggota" }} />
      <Card>
        <MemberAdminForm angkatanOptions={angkatanOptions} />
      </Card>
    </>
  );
}
