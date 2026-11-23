import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { ActionForm, SubmitButton } from "@/components/form";
import { ImageField } from "@/components/uploader";
import { Card, Field, PageHeader, inputCls } from "@/components/ui";
import { normalizeAngkatan } from "@/lib/utils";
import type { AngkatanProfile } from "@/lib/types";
import { deleteAngkatan, saveAngkatan } from "../actions";

export default async function EditAngkatanPage({ params }: { params: Promise<{ kode: string }> }) {
  const { kode } = await params;
  const code = normalizeAngkatan(decodeURIComponent(kode));
  if (!code) notFound();
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("angkatan").select("*").eq("code", code).maybeSingle();
  const p = (data ?? null) as AngkatanProfile | null;

  return (
    <>
      <PageHeader title={`Angkatan ${code}`} back={{ href: "/admin/angkatan", label: "Profil Angkatan" }} />
      <Card>
        <ActionForm action={saveAngkatan} className="space-y-5">
          <input type="hidden" name="code" value={code} />
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Julukan angkatan" hint="Mis. Bayu Samudra" className="sm:col-span-2">
              <input name="name" maxLength={80} defaultValue={p?.name ?? ""} className={inputCls} />
            </Field>
            <Field label="Tahun masuk">
              <input name="entry_year" type="number" min={1950} max={2100} defaultValue={p?.entry_year ?? ""} className={inputCls} />
            </Field>
            <Field label="Motto" className="sm:col-span-3">
              <input name="motto" maxLength={200} defaultValue={p?.motto ?? ""} className={inputCls} />
            </Field>
            <Field label="Cerita singkat angkatan" hint="Maksimal 1500 karakter." className="sm:col-span-3">
              <textarea name="description" rows={5} maxLength={1500} defaultValue={p?.description ?? ""} className={inputCls} />
            </Field>
          </div>
          <Field label="Foto bersama" hint="Opsional. Tampil di halaman angkatan.">
            <ImageField name="photo_url" bucket="members" folder="angkatan" defaultUrl={p?.photo_url} maxDim={1600} shape="wide" />
          </Field>
          <SubmitButton>Simpan profil</SubmitButton>
        </ActionForm>
      </Card>
      {p && (
        <Card className="mt-6 border-danger-200">
          <h2 className="font-semibold text-danger-700">Hapus profil</h2>
          <p className="mb-3 mt-1 text-sm text-muted">Hanya menghapus profil (julukan, motto, foto). Data anggota tidak terpengaruh.</p>
          <ActionForm action={deleteAngkatan}>
            <input type="hidden" name="code" value={code} />
            <SubmitButton variant="danger" confirm={`Hapus profil angkatan ${code}?`}>Hapus profil</SubmitButton>
          </ActionForm>
        </Card>
      )}
    </>
  );
}
