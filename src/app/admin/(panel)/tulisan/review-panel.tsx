"use client";

import { ActionForm, SubmitButton } from "@/components/form";
import { Field, inputCls } from "@/components/ui";
import { deletePost, reviewPost } from "@/lib/post-actions";
import type { PostStatus } from "@/lib/types";

/** Tindakan peninjauan: setujui, kembalikan dengan catatan, turunkan, atau hapus. */
export function ReviewPanel({ id, status }: { id: string; status: PostStatus }) {
  return (
    <div className="space-y-6">
      {status === "submitted" && (
        <div className="grid gap-6 md:grid-cols-2">
          <ActionForm action={reviewPost} className="space-y-3">
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="decision" value="approve" />
            <p className="text-sm text-body">Isi sudah layak? Terbitkan agar langsung tampil di website.</p>
            <SubmitButton pendingText="Menerbitkan…">Setujui &amp; terbitkan</SubmitButton>
          </ActionForm>
          <ActionForm action={reviewPost} className="space-y-3">
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="decision" value="reject" />
            <Field label="Catatan untuk penulis" hint="Jelaskan apa yang perlu diperbaiki.">
              <textarea name="note" rows={3} maxLength={500} required className={inputCls} />
            </Field>
            <SubmitButton variant="danger" confirm="Kembalikan tulisan ini ke penulis?">
              Kembalikan untuk revisi
            </SubmitButton>
          </ActionForm>
        </div>
      )}

      {status === "published" && (
        <ActionForm action={reviewPost} className="space-y-3">
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="decision" value="unpublish" />
          <p className="text-sm text-body">Turunkan tulisan dari website dan jadikan draf?</p>
          <SubmitButton variant="ghost" confirm="Turunkan tulisan dari website?">
            Turunkan jadi draf
          </SubmitButton>
        </ActionForm>
      )}

      <ActionForm action={deletePost} className="border-t border-line pt-5">
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="scope" value="admin" />
        <SubmitButton variant="danger" confirm="Hapus tulisan ini secara permanen?">
          Hapus tulisan
        </SubmitButton>
      </ActionForm>
    </div>
  );
}
