"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Trash2, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/image";
import { btnGhost, btnPrimary } from "./ui";

/** Unggah satu foto ke Supabase Storage dan simpan URL-nya di input tersembunyi. */
export function ImageField({
  name,
  bucket,
  folder,
  defaultUrl,
  maxDim = 1200,
  shape = "square",
}: {
  name: string;
  bucket: "site" | "members" | "gallery";
  folder: string;
  defaultUrl?: string | null;
  maxDim?: number;
  shape?: "square" | "wide";
}) {
  const [url, setUrl] = useState(defaultUrl ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function onPick(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const blob = await compressImage(file, maxDim);
      const supabase = createClient();
      const path = `${folder}/${crypto.randomUUID()}.jpg`;
      const { error: upErr } = await supabase.storage.from(bucket).upload(path, blob, { contentType: "image/jpeg" });
      if (upErr) throw upErr;
      setUrl(supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal mengunggah foto");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <input type="hidden" name={name} value={url} />
      <div className="flex items-center gap-4">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt="Pratinjau"
            className={shape === "wide" ? "h-24 w-40 rounded-control object-cover" : "h-20 w-20 rounded-control object-cover"}
          />
        ) : (
          <div
            className={
              (shape === "wide" ? "h-24 w-40" : "h-20 w-20") +
              " flex items-center justify-center rounded-control border border-dashed border-line-strong bg-sunken text-faint"
            }
          >
            <ImagePlus size={22} aria-hidden />
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <button type="button" className={btnGhost} disabled={busy} onClick={() => inputRef.current?.click()}>
            <Upload size={16} aria-hidden /> {busy ? "Mengunggah…" : url ? "Ganti foto" : "Pilih foto"}
          </button>
          {url && !busy && (
            <button type="button" className={btnGhost} onClick={() => setUrl("")}>
              <Trash2 size={16} aria-hidden /> Hapus
            </button>
          )}
        </div>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => onPick(e.target.files?.[0])} />
      </div>
      {error && <p className="mt-2 text-sm text-danger-700">{error}</p>}
    </div>
  );
}

type UploadedPhoto = { url: string; path: string };

/** Unggah banyak foto sekaligus ke album gallery. */
export function PhotoUploader({
  albumId,
  addPhotos,
}: {
  albumId: string;
  addPhotos: (albumId: string, photos: UploadedPhoto[]) => Promise<{ error?: string }>;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [message, setMessage] = useState("");

  async function onPick(files: FileList | null) {
    if (!files || files.length === 0) return;
    const list = Array.from(files);
    const supabase = createClient();
    const uploaded: UploadedPhoto[] = [];
    const failed: string[] = [];
    setMessage("");
    setProgress({ done: 0, total: list.length });

    for (const [i, file] of list.entries()) {
      try {
        const blob = await compressImage(file, 1600);
        const path = `${albumId}/${crypto.randomUUID()}.jpg`;
        const { error } = await supabase.storage.from("gallery").upload(path, blob, { contentType: "image/jpeg" });
        if (error) throw error;
        uploaded.push({ path, url: supabase.storage.from("gallery").getPublicUrl(path).data.publicUrl });
      } catch {
        failed.push(file.name);
      }
      setProgress({ done: i + 1, total: list.length });
    }

    if (uploaded.length > 0) {
      const res = await addPhotos(albumId, uploaded);
      if (res.error) failed.push(res.error);
    }
    setProgress(null);
    setMessage(
      failed.length
        ? `${uploaded.length} foto berhasil. Gagal: ${failed.join(", ")}`
        : `${uploaded.length} foto berhasil diunggah.`,
    );
    if (inputRef.current) inputRef.current.value = "";
    router.refresh();
  }

  return (
    <div>
      <button type="button" className={btnPrimary} disabled={!!progress} onClick={() => inputRef.current?.click()}>
        <Upload size={16} aria-hidden />
        {progress ? `Mengunggah ${progress.done}/${progress.total}…` : "Unggah foto"}
      </button>
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => onPick(e.target.files)} />
      <p className="mt-2 text-xs text-muted">Bisa pilih banyak foto sekaligus. Foto otomatis dikecilkan agar hemat penyimpanan.</p>
      {message && <p role="status" className="mt-2 text-sm text-body">{message}</p>}
    </div>
  );
}
