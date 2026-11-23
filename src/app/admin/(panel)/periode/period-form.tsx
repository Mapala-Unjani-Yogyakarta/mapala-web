import { ActionForm, SubmitButton } from "@/components/form";
import { Field, inputCls } from "@/components/ui";
import type { Period } from "@/lib/types";
import { savePeriod } from "./actions";

export function PeriodForm({ period }: { period?: Period }) {
  const y = new Date().getFullYear();
  return (
    <ActionForm action={savePeriod} className="space-y-4">
      {period && <input type="hidden" name="id" value={period.id} />}
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Nama periode" required className="sm:col-span-3">
          <input name="name" required defaultValue={period?.name ?? `Periode ${y}/${y + 1}`} maxLength={80} className={inputCls} />
        </Field>
        <Field label="Tahun mulai" required>
          <input name="year_start" type="number" required min={1950} max={2100} defaultValue={period?.year_start ?? y} className={inputCls} />
        </Field>
        <Field label="Tahun selesai" required>
          <input name="year_end" type="number" required min={1950} max={2100} defaultValue={period?.year_end ?? y + 1} className={inputCls} />
        </Field>
        <Field label="Tema / slogan" className="sm:col-span-3">
          <input name="theme" maxLength={200} defaultValue={period?.theme ?? ""} className={inputCls} />
        </Field>
        <Field label="Visi periode" className="sm:col-span-3">
          <textarea name="vision" rows={3} maxLength={2000} defaultValue={period?.vision ?? ""} className={inputCls} />
        </Field>
      </div>
      <label className="flex items-center gap-3 text-sm">
        <input type="checkbox" name="is_current" defaultChecked={period?.is_current ?? false} className="h-4 w-4 accent-brand-700" />
        <span>
          <strong>Periode saat ini</strong>, ditampilkan di beranda dan menu Pengurus
        </span>
      </label>
      <SubmitButton>{period ? "Simpan periode" : "Buat periode"}</SubmitButton>
    </ActionForm>
  );
}
