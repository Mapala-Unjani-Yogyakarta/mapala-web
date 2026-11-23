import { requireAdmin } from "@/lib/auth";
import { Card, PageHeader } from "@/components/ui";
import { MemberAdminForm } from "../member-admin-form";

export default async function NewMemberPage() {
  await requireAdmin();
  return (
    <>
      <PageHeader title="Tambah Anggota" back={{ href: "/admin/anggota", label: "Daftar anggota" }} />
      <Card>
        <MemberAdminForm />
      </Card>
    </>
  );
}
