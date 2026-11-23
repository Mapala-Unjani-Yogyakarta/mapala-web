"use client";

import { createContext, startTransition, useActionState, useContext, useEffect, useRef } from "react";
import type { FormState } from "@/lib/form-state";
import { btnPrimary, btnDanger, btnGhost } from "./ui";
import { cx } from "@/lib/utils";

const PendingCtx = createContext(false);

/**
 * Form untuk server action. Isian TIDAK dikosongkan saat ada error validasi,
 * dan pesan sukses/gagal tampil di bawah form.
 */
export function ActionForm({
  action,
  children,
  className,
  resetOnSuccess,
  prepare,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  children: React.ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
  /** Dipanggil sebelum dikirim, mis. untuk menyisipkan foto hasil kompresi. */
  prepare?: (fd: FormData) => void;
}) {
  const [state, formAction, pending] = useActionState(action, null as FormState);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok && resetOnSuccess) ref.current?.reset();
  }, [state, resetOnSuccess]);

  return (
    <PendingCtx.Provider value={pending}>
      <form
        ref={ref}
        className={className}
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          prepare?.(fd);
          startTransition(() => formAction(fd));
        }}
      >
        {children}
        {state?.error && (
          <p role="alert" className="mt-3 rounded-control border border-danger-200 bg-danger-50 px-3 py-2 text-sm text-danger-700">
            {state.error}
          </p>
        )}
        {state?.ok && (
          <p role="status" className="mt-3 rounded-control border border-brand-200 bg-brand-50 px-3 py-2 text-sm text-brand-800">
            {state.ok}
          </p>
        )}
      </form>
    </PendingCtx.Provider>
  );
}

export function SubmitButton({
  children,
  pendingText = "Menyimpan…",
  variant = "primary",
  confirm,
  className,
}: {
  children: React.ReactNode;
  pendingText?: string;
  variant?: "primary" | "danger" | "ghost";
  confirm?: string;
  className?: string;
}) {
  const pending = useContext(PendingCtx);
  const base = variant === "danger" ? btnDanger : variant === "ghost" ? btnGhost : btnPrimary;
  return (
    <button
      type="submit"
      disabled={pending}
      className={cx(base, className)}
      onClick={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {pending ? pendingText : children}
    </button>
  );
}
