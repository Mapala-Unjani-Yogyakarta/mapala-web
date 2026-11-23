"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";
import { X } from "lucide-react";
import { ActionForm, SubmitButton } from "@/components/form";
import { Field, inputCls } from "@/components/ui";
import type { Alumnus } from "@/lib/types";
import { requestIntro } from "@/app/(public)/alumni/actions";

/** Kotak Turnstile yang dirender saat dialog dibuka (mendukung banyak kali dibuka). */
function TurnstileBox({ siteKey }: { siteKey: string }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let id: string | undefined;
    let tries = 0;
    const timer = window.setInterval(() => {
      if (window.turnstile && box.current) {
        window.clearInterval(timer);
        id = window.turnstile.render(box.current, { sitekey: siteKey });
      } else if (++tries > 50) window.clearInterval(timer);
    }, 200);
    return () => {
      window.clearInterval(timer);
      if (id) window.turnstile?.remove(id);
    };
  }, [siteKey]);
  return <div ref={box} className="mt-1" />;
}

/** Dialog "Minta dikenalkan": satu dialog bersama untuk semua kartu alumni. */
export function IntroDialog({ target, onClose }: { target: Alumnus | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (target && !el.open) el.showModal();
    if (!target && el.open) el.close();
  }, [target]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose(); // klik di latar gelap
      }}
      className="m-auto w-[min(32rem,92vw)] rounded-panel border border-line bg-surface p-0 text-body shadow-float backdrop:bg-ink/50 backdrop:backdrop-blur-sm"
    >
      {target && (
        <div className="p-6">
          {siteKey && <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" />}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl leading-tight text-ink">Minta dikenalkan</h2>
              <p className="mt-1 text-sm text-muted">
                dengan <strong className="text-ink">{target.full_name}</strong>
                {target.profession ? ` · ${target.profession}` : ""}
              </p>
            </div>
            <button type="button" onClick={onClose} aria-label="Tutup" className="rounded-full p-1.5 text-muted hover:bg-sunken hover:text-ink">
              <X size={20} />
            </button>
          </div>
          <p className="mt-4 rounded-control bg-brand-50 px-3 py-2 text-xs text-body">
            Kontak alumni tidak dibuka. Pesanmu diteruskan ke <strong>pengurus</strong>, yang akan menanyakan kesediaan alumni lalu menyambungkan kalian.
          </p>
          <ActionForm action={requestIntro} resetOnSuccess className="mt-4 space-y-4">
            <input type="hidden" name="member_id" value={target.id} />
            <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
              <label>
                Website
                <input name="website" tabIndex={-1} autoComplete="off" />
              </label>
            </div>
            <Field label="Namamu" required>
              <input name="name" required minLength={2} maxLength={100} autoComplete="name" className={inputCls} />
            </Field>
            <Field label="Email atau WhatsApp-mu" required hint="Dipakai pengurus untuk membalas.">
              <input name="contact" required minLength={5} maxLength={120} className={inputCls} />
            </Field>
            <Field label="Tujuan perkenalan" required hint="Singkat saja (20–600 karakter): siapa kamu dan apa yang ingin dibicarakan.">
              <textarea name="message" required rows={4} minLength={20} maxLength={600} className={inputCls} />
            </Field>
            {siteKey && <TurnstileBox siteKey={siteKey} />}
            <SubmitButton pendingText="Mengirim…">Kirim permintaan</SubmitButton>
          </ActionForm>
        </div>
      )}
    </dialog>
  );
}
