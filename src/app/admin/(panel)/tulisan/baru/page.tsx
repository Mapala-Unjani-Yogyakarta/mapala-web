import { requireAdmin } from "@/lib/auth";
import { Card, PageHeader } from "@/components/ui";
import { PostEditor } from "@/components/post-editor";

export default async function NewAdminPostPage() {
  const { user } = await requireAdmin();
  return (
    <>
      <PageHeader title="Tulisan baru" back={{ href: "/admin/tulisan", label: "Blog & Berita" }} />
      <Card>
        <PostEditor scope="admin" uploadFolder={user.id} />
      </Card>
    </>
  );
}
