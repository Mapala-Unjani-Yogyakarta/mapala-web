import { requireAdmin } from "@/lib/auth";
import { ActionForm, SubmitButton } from "@/components/form";
import { Card, EmptyState, Field, PageHeader, inputCls } from "@/components/ui";
import { formatDate, siteUrl } from "@/lib/utils";
import { addAuthor, removeAuthor } from "./actions";

export default async function AuthorsPage() {
  const { supabase } = await requireAdmin();
  const [{ data: authorsRaw }, { data: members }, { data: privs }, { data: counts }] = await Promise.all([
    supabase.from("authors").select("user_id, member_id, full_name, email, created_at").order("created_at"),
    supabase.from("members").select("id, full_name, angkatan").order("full_name"),
    supabase.from("member_private").select("member_id, email").not("email", "is", null),
    supabase.from("posts").select("author_user_id, status"),
  ]);
  const authors = (authorsRaw ?? []) as { user_id: string; member_id: string | null; full_name: string; email: string | null; created_at: string }[];
  const emailOf = new Map(((privs ?? []) as { member_id: string; email: string | null }[]).map((p) => [p.member_id, p.email]));
  const taken = new Set(authors.map((a) => a.member_id));
  const candidates = ((members ?? []) as { id: string; full_name: string; angkatan: string | null }[]).filter((m) => !taken.has(m.id));
  const tally = new Map<string, { total: number; published: number }>();
  for (const r of (counts ?? []) as { author_user_id: string | null; status: string }[]) {
    if (!r.author_user_id) continue;
    const t = tally.get(r.author_user_id) ?? { total: 0, published: 0 };
    t.total++;
    if (r.status === "published") t.published++;
    tally.set(r.author_user_id, t);
  }

  return (
    <>
      <PageHeader title="Penulis" desc="Anggota yang boleh menulis di blog. Mereka masuk lewat tautan email, tanpa kata sandi." />
      <div className="space-y-6">
        <Card>
          <h2 className="mb-3 font-semibold">Daftar penulis</h2>
          {authors.length === 0 ? (
            <EmptyState>Belum ada penulis. Tambahkan anggota di bawah.</EmptyState>
          ) : (
            <ul className="divide-y divide-line">
              {authors.map((a) => (
                <li key={a.user_id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="font-medium text-ink">{a.full_name}</p>
                    <p className="text-sm text-muted">
                      {a.email ?? "—"} · {tally.get(a.user_id)?.published ?? 0} terbit dari {tally.get(a.user_id)?.total ?? 0} tulisan · sejak {formatDate(a.created_at)}
                    </p>
                  </div>
                  <ActionForm action={removeAuthor}>
                    <input type="hidden" name="user_id" value={a.user_id} />
                    <SubmitButton variant="danger" pendingText="…" confirm={`Cabut akses menulis ${a.full_name}?`}>
                      Cabut akses
                    </SubmitButton>
                  </ActionForm>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="mb-1 font-semibold">Tambah penulis</h2>
          <p className="mb-4 text-sm text-muted">
            Pilih anggota (emailnya diambil dari data privat) atau isi email lain. Setelah ditambahkan, minta penulis membuka{" "}
            <code className="rounded bg-sunken px-1.5 py-0.5 text-xs">{siteUrl()}/penulis/masuk</code> dan meminta tautan masuk.
          </p>
          <ActionForm action={addAuthor} resetOnSuccess className="grid gap-4 sm:grid-cols-2">
            <Field label="Anggota" className="sm:col-span-2">
              <select name="member_id" defaultValue="" className={inputCls}>
                <option value="">— atau isi email manual di bawah —</option>
                {candidates.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.full_name}
                    {m.angkatan ? ` (${m.angkatan})` : ""}
                    {emailOf.get(m.id) ? ` · ${emailOf.get(m.id)}` : " · belum ada email"}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Email" hint="Kosongkan bila memakai email anggota di atas.">
              <input name="email" type="email" className={inputCls} autoComplete="off" />
            </Field>
            <Field label="Nama penulis" hint="Kosongkan bila memilih anggota.">
              <input name="full_name" maxLength={100} className={inputCls} />
            </Field>
            <div className="sm:col-span-2">
              <SubmitButton pendingText="Menambah…">Jadikan penulis</SubmitButton>
            </div>
          </ActionForm>
        </Card>
      </div>
    </>
  );
}
