import { requireAdmin } from "@/lib/auth";
import { Card, PageHeader } from "@/components/ui";
import { ItemForm } from "../inventory-forms";

export default async function NewItemPage() {
  await requireAdmin();
  return (
    <>
      <PageHeader title="Tambah Alat" back={{ href: "/admin/inventaris", label: "Inventaris" }} />
      <Card>
        <ItemForm />
      </Card>
    </>
  );
}
