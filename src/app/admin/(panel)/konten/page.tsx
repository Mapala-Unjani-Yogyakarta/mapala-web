import { requireAdmin } from "@/lib/auth";
import { ActionForm, SubmitButton } from "@/components/form";
import { ImageField } from "@/components/uploader";
import { Card, Field, PageHeader, inputCls } from "@/components/ui";
import { DEFAULT_SETTINGS } from "@/lib/data";
import type { SiteSettings } from "@/lib/types";
import { saveSettings } from "./actions";

export default async function ContentPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle();
  const s = { ...DEFAULT_SETTINGS, ...(data ?? {}) } as SiteSettings;

  return (
    <>
      <PageHeader title="Konten Website" desc="Teks dan kontak yang tampil di beranda dan footer." />
      <ActionForm action={saveSettings} className="space-y-6">
        <Card className="space-y-4">
          <h2 className="font-semibold">Identitas</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nama organisasi" required>
              <input name="org_name" required maxLength={80} defaultValue={s.org_name} className={inputCls} />
            </Field>
            <Field label="Tagline">
              <input name="tagline" maxLength={120} defaultValue={s.tagline} className={inputCls} />
            </Field>
            <Field label="Tahun berdiri">
              <input name="founded_year" type="number" min={1900} max={2100} defaultValue={s.founded_year ?? ""} className={inputCls} />
            </Field>
          </div>
          <Field label="Foto latar beranda" hint="Opsional. Foto lanskap horizontal paling cocok.">
            <ImageField name="hero_image_url" bucket="site" folder="hero" defaultUrl={s.hero_image_url} maxDim={1920} shape="wide" />
          </Field>
        </Card>

        <Card className="space-y-4">
          <h2 className="font-semibold">Profil</h2>
          <Field label="Tentang organisasi" hint="Tampil di bagian atas beranda">
            <textarea name="about" rows={4} maxLength={1500} defaultValue={s.about} className={inputCls} />
          </Field>
          <Field label="Visi">
            <textarea name="vision" rows={3} maxLength={1500} defaultValue={s.vision} className={inputCls} />
          </Field>
          <Field label="Misi" hint="Satu poin per baris">
            <textarea name="mission" rows={5} maxLength={3000} defaultValue={s.mission} className={inputCls} />
          </Field>
          <Field label="Sejarah singkat">
            <textarea name="history" rows={5} maxLength={3000} defaultValue={s.history} className={inputCls} />
          </Field>
        </Card>

        <Card className="space-y-4">
          <h2 className="font-semibold">Kontak</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email">
              <input name="contact_email" type="email" maxLength={120} defaultValue={s.contact_email} className={inputCls} />
            </Field>
            <Field label="WhatsApp" hint="Contoh: 081234567890">
              <input name="whatsapp" maxLength={30} defaultValue={s.whatsapp} className={inputCls} />
            </Field>
            <Field label="Telepon">
              <input name="contact_phone" maxLength={30} defaultValue={s.contact_phone} className={inputCls} />
            </Field>
            <Field label="Instagram" hint="Tanpa tautan, cukup nama akun">
              <input name="instagram" maxLength={60} defaultValue={s.instagram} className={inputCls} />
            </Field>
            <Field label="Alamat sekretariat" className="sm:col-span-2">
              <textarea name="address" rows={2} maxLength={300} defaultValue={s.address} className={inputCls} />
            </Field>
          </div>
        </Card>

        <SubmitButton>Simpan konten</SubmitButton>
      </ActionForm>
    </>
  );
}
