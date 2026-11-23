"use client";

import { useRef, useState } from "react";
import { Bold, Heading2, ImagePlus, Italic, Link as LinkIcon, List, ListOrdered, Quote } from "lucide-react";
import { ActionForm, SubmitButton } from "@/components/form";
import { Markdown } from "@/components/markdown";
import { ImageField } from "@/components/uploader";
import { Field, inputCls } from "@/components/ui";
import { compressImage } from "@/lib/image";
import { createClient } from "@/lib/supabase/client";
import { cx } from "@/lib/utils";
import type { Post } from "@/lib/types";
import { savePost } from "@/lib/post-actions";

const tool = "inline-flex h-9 w-9 items-center justify-center rounded-control text-body transition-colors hover:bg-sunken disabled:opacity-50";

/** Editor tulisan: Markdown sederhana dengan tombol format, sisipkan foto, dan pratinjau. */
export function PostEditor({ post, scope, uploadFolder }: { post?: Post | null; scope: "admin" | "author"; uploadFolder: string }) {
  const [body, setBody] = useState(post?.body ?? "");
  const [tab, setTab] = useState<"tulis" | "pratinjau">("tulis");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const ta = useRef<HTMLTextAreaElement>(null);
  const file = useRef<HTMLInputElement>(null);

  function apply(fn: (sel: string, before: string, after: string) => { text: string; select?: [number, number] }) {
    const el = ta.current;
    if (!el) return;
    const s = el.selectionStart;
    const e = el.selectionEnd;
    const r = fn(body.slice(s, e), body.slice(0, s), body.slice(e));
    setBody(r.text);
    requestAnimationFrame(() => {
      el.focus();
      if (r.select) el.setSelectionRange(r.select[0], r.select[1]);
    });
  }

  const surround = (mark: string, placeholder: string) =>
    apply((sel, before, after) => {
      const inner = sel || placeholder;
      return { text: before + mark + inner + mark + after, select: [before.length + mark.length, before.length + mark.length + inner.length] };
    });

  const linePrefix = (prefix: string) =>
    apply((sel, before, after) => {
      const lineStart = before.lastIndexOf("\n") + 1;
      const head = before.slice(0, lineStart);
      const lineHead = before.slice(lineStart);
      return { text: head + prefix + lineHead + sel + after, select: [head.length + prefix.length + lineHead.length, head.length + prefix.length + lineHead.length + sel.length] };
    });

  const addLink = () => {
    const url = window.prompt("Alamat tautan (diawali https://)", "https://");
    if (!url || !/^https?:\/\//i.test(url)) return;
    apply((sel, before, after) => {
      const label = sel || "teks tautan";
      return { text: `${before}[${label}](${url})${after}` };
    });
  };

  async function insertPhoto(f?: File) {
    if (!f) return;
    setUploading(true);
    setUploadError("");
    try {
      const blob = await compressImage(f, 1600);
      const supabase = createClient();
      const path = `${uploadFolder}/${crypto.randomUUID()}.jpg`;
      const { error } = await supabase.storage.from("blog").upload(path, blob, { contentType: "image/jpeg" });
      if (error) throw error;
      const url = supabase.storage.from("blog").getPublicUrl(path).data.publicUrl;
      const alt = window.prompt("Deskripsi singkat foto (untuk pembaca layar)", "") ?? "";
      apply((_sel, before, after) => ({ text: `${before}\n\n![${alt.replace(/[\[\]]/g, "")}](${url})\n\n${after}` }));
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Gagal mengunggah foto");
    } finally {
      setUploading(false);
      if (file.current) file.current.value = "";
    }
  }

  const editable = !post || post.status !== "published" || scope === "admin";

  return (
    <ActionForm action={savePost} className="space-y-6">
      <input type="hidden" name="scope" value={scope} />
      {post && <input type="hidden" name="id" value={post.id} />}

      {post?.status === "rejected" && post.review_note && (
        <div className="rounded-card border border-warn-200 bg-warn-50 p-4 text-sm text-warn-800">
          <p className="font-medium">Catatan dari pengurus</p>
          <p className="mt-1 whitespace-pre-line">{post.review_note}</p>
        </div>
      )}

      <Field label="Judul" required>
        <input name="title" required minLength={3} maxLength={150} defaultValue={post?.title ?? ""} className={cx(inputCls, "!py-3 font-display !text-2xl")} placeholder="Judul tulisan" />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Ringkasan" hint="Maksimal 300 karakter. Tampil di daftar tulisan." className="sm:col-span-2">
          <textarea name="excerpt" rows={3} maxLength={300} defaultValue={post?.excerpt ?? ""} className={inputCls} />
        </Field>
        {scope === "admin" && (
          <Field label="Jenis">
            <select name="kind" defaultValue={post?.kind ?? "berita"} className={inputCls}>
              <option value="berita">Berita (resmi dari pengurus)</option>
              <option value="blog">Blog (tulisan anggota)</option>
            </select>
          </Field>
        )}
      </div>

      <Field label="Foto sampul" hint="Opsional. Tampil di daftar dan di atas tulisan.">
        <ImageField name="cover_url" bucket="blog" folder={uploadFolder} defaultUrl={post?.cover_url} maxDim={1600} shape="wide" />
      </Field>

      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-medium text-ink">
            Isi tulisan <span className="text-accent-500">*</span>
          </span>
          <div className="inline-flex rounded-full border border-line-strong p-0.5 text-sm" role="tablist">
            {(["tulis", "pratinjau"] as const).map((t) => (
              <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={cx("rounded-full px-4 py-1 transition-colors", tab === t ? "bg-brand-700 text-white" : "text-body hover:bg-sunken")}>
                {t === "tulis" ? "Tulis" : "Pratinjau"}
              </button>
            ))}
          </div>
        </div>

        {tab === "tulis" ? (
          <div className="overflow-hidden rounded-control border border-line-strong bg-surface focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-200">
            <div className="flex flex-wrap items-center gap-0.5 border-b border-line bg-sunken/60 px-2 py-1.5">
              <button type="button" className={tool} onClick={() => linePrefix("## ")} aria-label="Judul bagian" title="Judul bagian"><Heading2 size={16} /></button>
              <button type="button" className={tool} onClick={() => surround("**", "tebal")} aria-label="Tebal" title="Tebal"><Bold size={16} /></button>
              <button type="button" className={tool} onClick={() => surround("*", "miring")} aria-label="Miring" title="Miring"><Italic size={16} /></button>
              <button type="button" className={tool} onClick={() => linePrefix("- ")} aria-label="Daftar poin" title="Daftar poin"><List size={16} /></button>
              <button type="button" className={tool} onClick={() => linePrefix("1. ")} aria-label="Daftar bernomor" title="Daftar bernomor"><ListOrdered size={16} /></button>
              <button type="button" className={tool} onClick={() => linePrefix("> ")} aria-label="Kutipan" title="Kutipan"><Quote size={16} /></button>
              <button type="button" className={tool} onClick={addLink} aria-label="Tautan" title="Tautan"><LinkIcon size={16} /></button>
              <span className="mx-1 h-5 w-px bg-line-strong" aria-hidden />
              <button type="button" className={cx(tool, "w-auto gap-1.5 px-2.5 text-sm")} disabled={uploading} onClick={() => file.current?.click()}>
                <ImagePlus size={16} aria-hidden /> {uploading ? "Mengunggah…" : "Sisipkan foto"}
              </button>
              <input ref={file} type="file" accept="image/*" className="hidden" onChange={(e) => insertPhoto(e.target.files?.[0])} />
            </div>
            <textarea
              ref={ta}
              name="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={16}
              maxLength={60000}
              required
              className="block min-h-[22rem] w-full resize-y bg-transparent p-4 text-[0.95rem] leading-relaxed text-ink focus:outline-none"
              placeholder="Tulis ceritamu di sini. Gunakan tombol di atas untuk judul bagian, tebal, daftar, tautan, dan foto."
            />
          </div>
        ) : (
          <>
            <input type="hidden" name="body" value={body} />
            <div className="min-h-[22rem] rounded-control border border-line bg-surface p-5">
              {body.trim() ? <Markdown>{body}</Markdown> : <p className="text-sm text-muted">Belum ada isi untuk dipratinjau.</p>}
            </div>
          </>
        )}
        <p className="mt-1.5 flex justify-between text-xs text-muted">
          <span>Format: Markdown sederhana (tombol di atas membantumu).</span>
          <span>{body.length.toLocaleString("id-ID")} / 60.000</span>
        </p>
        {uploadError && <p className="mt-1 text-sm text-danger-700">{uploadError}</p>}
      </div>

      {editable ? (
        <div className="flex flex-wrap items-center gap-3 border-t border-line pt-5">
          <SubmitButton name="intent" value="draft" variant="ghost" pendingText="Menyimpan…">
            Simpan draf
          </SubmitButton>
          {scope === "author" ? (
            <SubmitButton name="intent" value="submit" pendingText="Mengajukan…">
              Ajukan untuk ditinjau
            </SubmitButton>
          ) : (
            <SubmitButton name="intent" value="publish" pendingText="Menerbitkan…">
              {post?.status === "published" ? "Simpan perubahan terbit" : "Terbitkan"}
            </SubmitButton>
          )}
          <p className="text-xs text-muted">{scope === "author" ? "Tulisan baru tampil di website setelah disetujui pengurus." : "“Terbitkan” langsung tampil di website."}</p>
        </div>
      ) : (
        <p className="rounded-card bg-sunken px-4 py-3 text-sm text-muted">Tulisan ini sudah terbit dan hanya bisa diubah pengurus.</p>
      )}
    </ActionForm>
  );
}
