import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthor } from "@/lib/author-auth";
import { supabaseConfigured } from "@/lib/supabase/public";
import { ActionForm, SubmitButton } from "@/components/form";
import { BrandMark } from "@/components/site/brand-mark";
import { Field, inputCls } from "@/components/ui";
import { requestLoginLink } from "../actions";

export const metadata: Metadata = { title: "Masuk Penulis", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AuthorLoginPage({ searchParams }: { searchParams: Promise<{ galat?: string }> }) {
  const sp = await searchParams;
  if (supabaseConfigured && (await getAuthor())) redirect("/penulis");

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <BrandMark size={72} className="mx-auto" priority />
          <h1 className="mt-3 font-display text-4xl text-ink">Ruang Penulis</h1>
          <p className="mt-1 text-sm text-muted">Masuk dengan tautan yang kami kirim ke emailmu. Tanpa kata sandi.</p>
        </div>

        {sp.galat && (
          <p className="mb-4 rounded-control border border-danger-200 bg-danger-50 p-3 text-sm text-danger-700">
            Tautan masuk tidak valid atau sudah kedaluwarsa. Minta tautan baru di bawah, dan buka di browser yang sama dengan tempat kamu memintanya.
          </p>
        )}

        <div className="panel p-6">
          <ActionForm action={requestLoginLink} className="space-y-4">
            <Field label="Email penulis" hint="Gunakan email yang didaftarkan pengurus.">
              <input name="email" type="email" required autoComplete="email" className={inputCls} placeholder="nama@email.com" />
            </Field>
            <SubmitButton pendingText="Mengirim…" className="w-full">
              Kirim tautan masuk
            </SubmitButton>
          </ActionForm>
        </div>

        <p className="mt-5 text-center text-sm text-muted">
          Belum punya akses? Minta pengurus menambahkanmu sebagai penulis.
          <br />
          <Link href="/blog" className="text-brand-700 hover:underline">
            ← Kembali ke blog
          </Link>
        </p>
      </div>
    </div>
  );
}
