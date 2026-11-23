"use client";

import { useState } from "react";
import { Copy, MessageCircle } from "lucide-react";
import { ActionForm, SubmitButton } from "@/components/form";
import { btnGhost, inputCls } from "@/components/ui";
import { createEditLink, revokeEditLink } from "./actions";

export function EditLinkPanel({
  memberId,
  link,
  name,
  waPhone,
}: {
  memberId: string;
  link: string | null;
  name: string;
  /** Nomor WhatsApp dalam format internasional (62…), jika ada. */
  waPhone: string | null;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Salin tautan ini:", link);
    }
  }

  const text = `Halo ${name}, berikut tautan pribadi untuk memperbarui datamu di arsip organisasi. Jangan dibagikan ke orang lain ya:\n${link}`;
  const waHref = `https://wa.me/${waPhone ?? ""}?text=${encodeURIComponent(text)}`;

  return (
    <div className="space-y-4">
      {link ? (
        <>
          <input readOnly value={link} onFocus={(e) => e.currentTarget.select()} className={inputCls} aria-label="Tautan pribadi" />
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={copy} className={btnGhost}>
              <Copy size={16} aria-hidden /> {copied ? "Tersalin!" : "Salin tautan"}
            </button>
            <a href={waHref} target="_blank" rel="noreferrer" className={btnGhost}>
              <MessageCircle size={16} aria-hidden /> Kirim lewat WhatsApp
            </a>
          </div>
          <div className="flex flex-wrap gap-4 border-t border-line pt-3">
            <ActionForm action={createEditLink}>
              <input type="hidden" name="id" value={memberId} />
              <SubmitButton variant="ghost" confirm="Buat tautan baru? Tautan lama akan langsung tidak berlaku.">
                Buat ulang tautan
              </SubmitButton>
            </ActionForm>
            <ActionForm action={revokeEditLink}>
              <input type="hidden" name="id" value={memberId} />
              <SubmitButton variant="danger" confirm="Cabut tautan ini?">
                Cabut tautan
              </SubmitButton>
            </ActionForm>
          </div>
        </>
      ) : (
        <ActionForm action={createEditLink}>
          <input type="hidden" name="id" value={memberId} />
          <SubmitButton>Buat tautan pribadi</SubmitButton>
        </ActionForm>
      )}
    </div>
  );
}
