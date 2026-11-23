import { requireAuthor } from "@/lib/author-auth";
import { Card, PageHeader } from "@/components/ui";
import { PostEditor } from "@/components/post-editor";

export default async function NewPostPage() {
  const { user } = await requireAuthor();
  return (
    <>
      <PageHeader title="Tulisan baru" back={{ href: "/penulis", label: "Tulisan saya" }} />
      <Card>
        <PostEditor scope="author" uploadFolder={user.id} />
      </Card>
    </>
  );
}
