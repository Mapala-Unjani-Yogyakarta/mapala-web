import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedPosts } from "@/lib/data";
import { SceneHero } from "@/components/site/scene-section";
import { PostList } from "@/components/site/post-list";

export const metadata: Metadata = {
  title: "Blog & Berita",
  description: "Kabar organisasi dan tulisan anggota: cerita perjalanan, pengalaman, dan pengetahuan seputar alam.",
};

export default async function BlogPage() {
  const posts = await getPublishedPosts();
  return (
    <>
      <SceneHero scene="cabin" eyebrow="Tulisan" title="Blog & Berita" desc="Kabar organisasi dan cerita dari anggota: perjalanan, pengalaman, dan pengetahuan seputar alam." />
      <div className="container-page pb-6">
        <PostList posts={posts} />
        <p className="mt-14 rounded-card bg-brand-50 px-5 py-4 text-sm text-body">
          Anggota yang ingin menulis? Minta akses penulis kepada pengurus, lalu masuk lewat{" "}
          <Link href="/penulis/masuk" className="font-medium text-brand-700 underline underline-offset-4">
            Ruang Penulis
          </Link>
          . Cukup dengan tautan masuk ke emailmu, tanpa kata sandi.
        </p>
      </div>
    </>
  );
}
