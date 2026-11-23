"use client";

import { useState } from "react";
import { ActionForm, SubmitButton } from "@/components/form";
import { Field, inputCls } from "@/components/ui";
import { CATEGORIES, CONDITIONS, CONDITION_INFO, type Item } from "@/lib/inventory";
import { createLoan, deleteItem, deleteLoan, extendLoan, recordService, returnLoan, saveItem, setItemActive } from "./actions";

export function ItemForm({ item }: { item?: Item }) {
  return (
    <ActionForm action={saveItem} className="space-y-5">
      {item && <input type="hidden" name="id" value={item.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nama alat" required className="sm:col-span-2">
          <input name="name" required minLength={2} maxLength={120} defaultValue={item?.name ?? ""} className={inputCls} placeholder="mis. Tenda Dome 4 Orang" />
        </Field>
        <Field label="Kode / nomor aset" hint="Opsional, unik. Contoh: TND-001">
          <input name="code" maxLength={40} defaultValue={item?.code ?? ""} className={inputCls} />
        </Field>
        <Field label="Kategori" required>
          <select name="category" required defaultValue={item?.category ?? ""} className={inputCls}>
            <option value="" disabled>
              Pilih kategori…
            </option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Jumlah" required hint="Banyak unit yang sejenis dan kondisinya sama. Beda kondisi? Catat sebagai alat terpisah.">
          <input name="quantity" type="number" required min={1} max={9999} defaultValue={item?.quantity ?? 1} className={inputCls} inputMode="numeric" />
        </Field>
        <Field label="Kondisi" required>
          <select name="condition" required defaultValue={item?.condition ?? "baik"} className={inputCls}>
            {CONDITIONS.map((c) => (
              <option key={c} value={c}>
                {CONDITION_INFO[c].label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Lokasi simpan" hint="Mis. Lemari A, sekretariat">
          <input name="location" maxLength={120} defaultValue={item?.location ?? ""} className={inputCls} />
        </Field>
        <Field label="Tanggal beli">
          <input name="purchase_date" type="date" defaultValue={item?.purchase_date ?? ""} className={inputCls} />
        </Field>
        <Field label="Servis tiap … bulan" hint="Kosongkan bila tidak perlu servis berkala">
          <input name="service_interval_months" type="number" min={1} max={120} defaultValue={item?.service_interval_months ?? ""} className={inputCls} inputMode="numeric" />
        </Field>
        <Field label="Servis terakhir">
          <input name="last_service_date" type="date" defaultValue={item?.last_service_date ?? ""} className={inputCls} />
        </Field>
        <Field label="Catatan" className="sm:col-span-2">
          <textarea name="notes" rows={2} maxLength={500} defaultValue={item?.notes ?? ""} className={inputCls} />
        </Field>
        <label className="flex items-start gap-3 text-sm sm:col-span-2">
          <input type="checkbox" name="lendable_external" defaultChecked={item?.lendable_external ?? true} className="mt-0.5 h-4 w-4 accent-brand-700" />
          <span>
            <strong>Boleh dipinjam mapala lain.</strong> Matikan untuk alat yang hanya untuk anggota sendiri.
          </span>
        </label>
      </div>
      <SubmitButton>{item ? "Simpan perubahan" : "Tambah alat"}</SubmitButton>
    </ActionForm>
  );
}

export function LoanForm({ item, available, today, members }: { item: Item; available: number; today: string; members: { id: string; full_name: string; angkatan: string | null }[] }) {
  const [kind, setKind] = useState<"anggota" | "mapala_lain">("anggota");
  const externalBlocked = !item.lendable_external;
  return (
    <ActionForm action={createLoan} resetOnSuccess className="space-y-4">
      <input type="hidden" name="item_id" value={item.id} />
      <div className="grid gap-4 sm:grid-cols-2">
        <fieldset className="sm:col-span-2">
          <legend className="mb-1 text-sm font-medium text-ink">Peminjam</legend>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["anggota", "Anggota Mapala"],
                ["mapala_lain", "Mapala lain"],
              ] as const
            ).map(([k, label]) => (
              <label key={k} className={"cursor-pointer rounded-full border px-4 py-1.5 text-sm " + (kind === k ? "border-brand-700 bg-brand-700 text-white" : "border-line-strong bg-surface text-body") + (k === "mapala_lain" && externalBlocked ? " opacity-50" : "")}>
                <input type="radio" name="borrower_kind" value={k} checked={kind === k} disabled={k === "mapala_lain" && externalBlocked} onChange={() => setKind(k)} className="sr-only" />
                {label}
              </label>
            ))}
          </div>
          {externalBlocked && <span className="mt-1 block text-xs text-muted">Alat ini ditandai tidak boleh dipinjamkan ke mapala lain.</span>}
        </fieldset>

        {kind === "anggota" ? (
          <Field label="Anggota" required className="sm:col-span-2">
            <select name="member_id" required defaultValue="" className={inputCls}>
              <option value="" disabled>
                Pilih anggota…
              </option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name}
                  {m.angkatan ? ` (angkatan ${m.angkatan})` : ""}
                </option>
              ))}
            </select>
          </Field>
        ) : (
          <>
            <Field label="Nama mapala / organisasi" required>
              <input name="borrower_name" required minLength={2} maxLength={120} className={inputCls} placeholder="mis. Mapala Contoh Universitas X" />
            </Field>
            <Field label="Kontak penanggung jawab" required hint="HP / WhatsApp orang yang bertanggung jawab">
              <input name="contact" required minLength={5} maxLength={60} className={inputCls} />
            </Field>
          </>
        )}
        <Field label={`Jumlah (tersedia ${available})`} required>
          <input name="qty" type="number" required min={1} max={Math.max(available, 1)} defaultValue={1} className={inputCls} inputMode="numeric" />
        </Field>
        <Field label="Keperluan">
          <input name="purpose" maxLength={300} className={inputCls} placeholder="mis. Pendakian Gunung Lawu" />
        </Field>
        <Field label="Tanggal pinjam" required>
          <input name="loaned_at" type="date" required defaultValue={today} className={inputCls} />
        </Field>
        <Field label="Harus kembali" required>
          <input name="due_at" type="date" required min={today} className={inputCls} />
        </Field>
      </div>
      <SubmitButton pendingText="Mencatat…">Catat peminjaman</SubmitButton>
    </ActionForm>
  );
}

export function ReturnForm({ loanId, today, qtyMatches }: { loanId: string; today: string; qtyMatches: boolean }) {
  const [cond, setCond] = useState("baik");
  return (
    <ActionForm action={returnLoan} className="mt-3 space-y-3 rounded-control bg-sunken/60 p-3">
      <input type="hidden" name="id" value={loanId} />
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Tanggal kembali">
          <input name="returned_at" type="date" required defaultValue={today} max={today} className={inputCls} />
        </Field>
        <Field label="Kondisi saat kembali">
          <select name="return_condition" value={cond} onChange={(e) => setCond(e.target.value)} className={inputCls}>
            {CONDITIONS.map((c) => (
              <option key={c} value={c}>
                {CONDITION_INFO[c].label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Catatan">
          <input name="return_notes" maxLength={300} className={inputCls} placeholder="mis. kantong robek" />
        </Field>
      </div>
      {cond !== "baik" && (
        <label className="flex items-start gap-2 text-xs text-body">
          <input type="checkbox" name="apply_condition" defaultChecked={qtyMatches} className="mt-0.5 h-4 w-4 accent-brand-700" />
          <span>
            Perbarui kondisi alat menjadi “{CONDITION_INFO[cond as keyof typeof CONDITION_INFO].label}”.
            {!qtyMatches && " Hanya sebagian unit yang bermasalah? Biarkan tidak dicentang, lalu pisahkan sebagai alat tersendiri."}
          </span>
        </label>
      )}
      <SubmitButton pendingText="Mencatat…">Tandai sudah kembali</SubmitButton>
    </ActionForm>
  );
}

export function ExtendForm({ loanId, current, today }: { loanId: string; current: string; today: string }) {
  return (
    <ActionForm action={extendLoan} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="id" value={loanId} />
      <Field label="Perpanjang sampai">
        <input name="due_at" type="date" required min={today} defaultValue={current} className={inputCls} />
      </Field>
      <SubmitButton variant="ghost" pendingText="…">
        Simpan tenggat
      </SubmitButton>
    </ActionForm>
  );
}

export function DeleteLoanForm({ loanId }: { loanId: string }) {
  return (
    <ActionForm action={deleteLoan}>
      <input type="hidden" name="id" value={loanId} />
      <SubmitButton variant="danger" confirm="Hapus catatan peminjaman ini? Tidak bisa dibatalkan." pendingText="Menghapus…">
        Hapus catatan
      </SubmitButton>
    </ActionForm>
  );
}

export function ServiceForm({ itemId, today, needsAttention }: { itemId: string; today: string; needsAttention: boolean }) {
  return (
    <ActionForm action={recordService} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="id" value={itemId} />
      <Field label="Tanggal servis">
        <input name="service_date" type="date" required defaultValue={today} max={today} className={inputCls} />
      </Field>
      {needsAttention && (
        <label className="flex items-center gap-2 pb-2 text-sm text-body">
          <input type="checkbox" name="set_good" className="h-4 w-4 accent-brand-700" /> Kondisi jadi “Baik”
        </label>
      )}
      <SubmitButton variant="ghost">Catat servis</SubmitButton>
    </ActionForm>
  );
}

export function ArchiveForm({ item }: { item: Item }) {
  return (
    <div className="flex flex-wrap gap-3">
      <ActionForm action={setItemActive}>
        <input type="hidden" name="id" value={item.id} />
        <input type="hidden" name="active" value={item.is_active ? "0" : "1"} />
        <SubmitButton variant="ghost" confirm={item.is_active ? "Arsipkan alat ini? Alat tidak akan muncul di daftar aktif dan tidak bisa dipinjam." : undefined}>
          {item.is_active ? "Arsipkan alat" : "Aktifkan kembali"}
        </SubmitButton>
      </ActionForm>
      <ActionForm action={deleteItem}>
        <input type="hidden" name="id" value={item.id} />
        <SubmitButton variant="danger" confirm="Hapus alat ini beserta seluruh riwayat peminjamannya? Tidak bisa dibatalkan." pendingText="Menghapus…">
          Hapus alat
        </SubmitButton>
      </ActionForm>
    </div>
  );
}
