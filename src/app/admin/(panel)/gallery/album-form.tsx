import { ActionForm, SubmitButton } from "@/components/form";
import { Field, inputCls } from "@/components/ui";
import type { Album } from "@/lib/types";
import { saveAlbum } from "./actions";

export function AlbumForm({ album }: { album?: Album }) {
  return (
    <ActionForm action={saveAlbum} className="space-y-4">
      {album && <input type="hidden" name="id" value={album.id} />}
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Judul album / kegiatan" required className="sm:col-span-2">
          <input name="title" required minLength={3} maxLength={120} defaultValue={album?.title ?? ""} className={inputCls} />
        </Field>
        <Field label="Tanggal kegiatan">
          <input name="event_date" type="date" defaultValue={album?.event_date ?? ""} className={inputCls} />
        </Field>
        <Field label="Deskripsi" className="sm:col-span-3">
          <textarea name="description" rows={3} maxLength={2000} defaultValue={album?.description ?? ""} className={inputCls} />
        </Field>
      </div>
      {album && (
        <label className="flex items-center gap-3 text-sm">
          <input type="checkbox" name="is_published" defaultChecked={album.is_published} className="h-4 w-4 accent-brand-700" />
          <span>
            <strong>Tampilkan di website</strong>
          </span>
        </label>
      )}
      <SubmitButton>{album ? "Simpan album" : "Buat album"}</SubmitButton>
    </ActionForm>
  );
}
