import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandMark } from "@/components/site/brand-mark";
import { getAdmin } from "@/lib/auth";
import { supabaseConfigured } from "@/lib/supabase/public";
import { ActionForm, SubmitButton } from "@/components/form";
import { Field, inputCls } from "@/components/ui";
import { signIn } from "../actions";

export const metadata: Metadata = { title: "Login Pengurus", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (supabaseConfigured && (await getAdmin())) redirect("/admin");

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <BrandMark size={72} className="mx-auto" priority />
          <h1 className="font-display mt-2 text-3xl font-medium text-ink">Login Pengurus</h1>
          <p className="mt-1 text-sm text-muted">Masuk untuk mengelola website organisasi.</p>
        </div>
        {!supabaseConfigured && (
          <p className="mb-4 rounded-control border border-warn-200 bg-warn-50 p-3 text-sm text-warn-800">
            Supabase belum dikonfigurasi. Isi <code>.env.local</code> terlebih dahulu (lihat README).
          </p>
        )}
        <div className="panel p-6">
          <ActionForm action={signIn} className="space-y-4">
            <Field label="Email">
              <input name="email" type="email" required autoComplete="username" className={inputCls} />
            </Field>
            <Field label="Kata sandi">
              <input name="password" type="password" required autoComplete="current-password" className={inputCls} />
            </Field>
            <SubmitButton pendingText="Masuk…" className="w-full">
              Masuk
            </SubmitButton>
          </ActionForm>
        </div>
        <p className="mt-4 text-center text-sm">
          <Link href="/" className="text-brand-700 hover:underline">
            ← Kembali ke website
          </Link>
        </p>
      </div>
    </div>
  );
}
