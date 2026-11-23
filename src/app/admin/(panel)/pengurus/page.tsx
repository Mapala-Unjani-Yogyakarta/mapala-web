import { requireSuperAdmin } from "@/lib/auth";
import { ActionForm, SubmitButton } from "@/components/form";
import { Badge, Card, Field, PageHeader, inputCls } from "@/components/ui";
import { changeOwnPassword, createAdminAccount, removeAdminAccount, resetAdminPassword } from "./actions";

export default async function AdminAccountsPage() {
  const me = await requireSuperAdmin();
  const { data } = await me.supabase.from("admins").select("user_id, full_name, email, role, created_at").order("created_at");
  const admins = (data ?? []) as { user_id: string; full_name: string; email: string | null; role: "super_admin" | "pengurus" }[];

  return (
    <>
      <PageHeader title="Akun Pengurus" desc="Atur siapa yang boleh masuk ke panel admin. Anggota biasa tidak membutuhkan akun." />
      <div className="space-y-6">
        <Card>
          <h2 className="mb-3 font-semibold">Daftar akun</h2>
          <ul className="divide-y divide-line">
            {admins.map((a) => (
              <li key={a.user_id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="font-medium">
                    {a.full_name} {a.user_id === me.user.id && <span className="text-xs text-muted">(kamu)</span>}
                  </p>
                  <p className="text-sm text-muted">{a.email ?? "—"}</p>
                  <div className="mt-1">
                    <Badge tone={a.role === "super_admin" ? "accent" : "brand"}>{a.role === "super_admin" ? "Super admin" : "Pengurus"}</Badge>
                  </div>
                </div>
                {a.user_id !== me.user.id && (
                  <div className="flex flex-wrap items-start gap-2">
                    <ActionForm action={resetAdminPassword} resetOnSuccess className="flex gap-2">
                      <input type="hidden" name="user_id" value={a.user_id} />
                      <input name="password" type="password" minLength={8} required placeholder="Kata sandi baru" autoComplete="new-password" className={inputCls + " w-44"} aria-label={`Kata sandi baru untuk ${a.full_name}`} />
                      <SubmitButton variant="ghost" pendingText="…">
                        Ganti
                      </SubmitButton>
                    </ActionForm>
                    <ActionForm action={removeAdminAccount}>
                      <input type="hidden" name="user_id" value={a.user_id} />
                      <SubmitButton variant="danger" pendingText="…" confirm={`Hapus akun ${a.full_name}? Ia tidak bisa masuk lagi.`}>
                        Hapus
                      </SubmitButton>
                    </ActionForm>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <h2 className="mb-4 font-semibold">Tambah akun pengurus</h2>
          <ActionForm action={createAdminAccount} resetOnSuccess className="grid gap-4 sm:grid-cols-2">
            <Field label="Nama lengkap" required>
              <input name="full_name" required maxLength={100} className={inputCls} />
            </Field>
            <Field label="Email" required>
              <input name="email" type="email" required autoComplete="off" className={inputCls} />
            </Field>
            <Field label="Kata sandi awal" required hint="Minimal 8 karakter. Sarankan orangnya menggantinya setelah masuk.">
              <input name="password" type="password" required minLength={8} autoComplete="new-password" className={inputCls} />
            </Field>
            <Field label="Peran">
              <select name="role" defaultValue="pengurus" className={inputCls}>
                <option value="pengurus">Pengurus: kelola anggota, periode, gallery, konten</option>
                <option value="super_admin">Super admin: semua, termasuk kelola akun</option>
              </select>
            </Field>
            <div className="sm:col-span-2">
              <SubmitButton pendingText="Membuat…">Buat akun</SubmitButton>
            </div>
          </ActionForm>
        </Card>

        <Card>
          <h2 className="mb-4 font-semibold">Ganti kata sandi saya</h2>
          <ActionForm action={changeOwnPassword} resetOnSuccess className="grid gap-4 sm:grid-cols-2">
            <Field label="Kata sandi baru">
              <input name="password" type="password" required minLength={8} autoComplete="new-password" className={inputCls} />
            </Field>
            <Field label="Ulangi kata sandi baru">
              <input name="confirm" type="password" required minLength={8} autoComplete="new-password" className={inputCls} />
            </Field>
            <div className="sm:col-span-2">
              <SubmitButton>Ganti kata sandi</SubmitButton>
            </div>
          </ActionForm>
        </Card>
      </div>
    </>
  );
}
