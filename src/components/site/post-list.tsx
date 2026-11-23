"use client";

import { useState } from "react";
import { EmptyState } from "@/components/ui";
import { cx } from "@/lib/utils";
import type { PostSummary } from "@/lib/types";
import { PostCard } from "./post-card";

const TABS = [
  { key: "semua", label: "Semua" },
  { key: "berita", label: "Berita" },
  { key: "blog", label: "Blog" },
] as const;

export function PostList({ posts }: { posts: PostSummary[] }) {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("semua");
  const shown = tab === "semua" ? posts : posts.filter((p) => p.kind === tab);
  return (
    <div>
      <div className="mb-8 flex flex-wrap gap-2" role="group" aria-label="Jenis tulisan">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            aria-pressed={tab === t.key}
            onClick={() => setTab(t.key)}
            className={cx("rounded-full border px-4 py-1.5 text-sm transition-colors", tab === t.key ? "border-brand-700 bg-brand-700 text-white" : "border-line-strong bg-surface text-body hover:border-brand-400")}
          >
            {t.label}
          </button>
        ))}
      </div>
      {shown.length === 0 ? (
        <EmptyState>Belum ada tulisan di kategori ini.</EmptyState>
      ) : (
        <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((p, i) => (
            <li key={p.id} style={{ "--i": i } as React.CSSProperties} className="pop-in">
              <PostCard post={p} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
