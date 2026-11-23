-- =====================================================================
-- Migrasi 0005 — Inventaris alat & peminjaman (khusus pengurus)
-- Cara pakai: Supabase → SQL Editor → New query → tempel seluruh isi
-- file ini → Run. Jalankan SATU KALI, SESUDAH 0004_alumni_enrichment.sql,
-- dan SEBELUM men-deploy versi website yang memakainya.
-- Tidak ada data inventaris yang tampil publik: semuanya hanya untuk pengurus.
-- =====================================================================

create type public.item_condition as enum ('baik', 'perlu_perbaikan', 'rusak', 'hilang');
create type public.loan_borrower  as enum ('anggota', 'mapala_lain');

-- ---------- Alat ----------
create table public.inventory_items (
  id                      uuid primary key default gen_random_uuid(),
  code                    text,                                   -- nomor aset, mis. TND-001
  name                    text not null check (char_length(name) between 2 and 120),
  category                text not null check (category in (
    'Tenda & shelter', 'Tali & panjat', 'Navigasi & komunikasi', 'Masak & logistik',
    'Medis & keselamatan', 'Carrier & pakaian', 'Dokumentasi', 'Lainnya')),
  quantity                int  not null default 1 check (quantity between 1 and 9999),
  condition               public.item_condition not null default 'baik',
  location                text check (location is null or char_length(location) <= 120),
  purchase_date           date,
  service_interval_months int  check (service_interval_months is null or service_interval_months between 1 and 120),
  last_service_date       date,
  lendable_external       boolean not null default true,          -- boleh dipinjam mapala lain
  notes                   text check (notes is null or char_length(notes) <= 500),
  is_active               boolean not null default true,          -- false = diarsipkan
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  check (code is null or char_length(code) between 1 and 40)
);
create unique index inventory_items_code_uq on public.inventory_items (upper(code)) where code is not null;
create index inventory_items_name_idx on public.inventory_items (name);
create trigger inventory_items_touch before update on public.inventory_items
  for each row execute function public.touch_updated_at();

-- ---------- Peminjaman ----------
create table public.inventory_loans (
  id               uuid primary key default gen_random_uuid(),
  item_id          uuid not null references public.inventory_items (id) on delete cascade,
  qty              int  not null default 1 check (qty between 1 and 9999),
  borrower_kind    public.loan_borrower not null,
  member_id        uuid references public.members (id) on delete set null,
  borrower_name    text not null check (char_length(borrower_name) between 2 and 120),
  contact          text check (contact is null or char_length(contact) <= 60),
  purpose          text check (purpose is null or char_length(purpose) <= 300),
  loaned_at        date not null default current_date,
  due_at           date not null,
  returned_at      date,
  return_condition public.item_condition,
  return_notes     text check (return_notes is null or char_length(return_notes) <= 300),
  created_by       uuid references auth.users (id) on delete set null,
  created_at       timestamptz not null default now(),
  check (due_at >= loaned_at),
  check (returned_at is null or returned_at >= loaned_at),
  check (borrower_kind <> 'mapala_lain' or (contact is not null and char_length(contact) >= 5))
);
create index inventory_loans_item_idx on public.inventory_loans (item_id);
create index inventory_loans_open_idx on public.inventory_loans (due_at) where returned_at is null;

-- ---------- Aturan peminjaman (dijaga di database agar tidak bisa dilanggar) ----------
create function public.inventory_loans_guard() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  it public.inventory_items;
  used int;
begin
  if tg_op = 'INSERT' then
    select * into it from public.inventory_items where id = new.item_id for update;  -- kunci agar tidak balapan
    if not found then raise exception 'Alat tidak ditemukan'; end if;
    if not it.is_active then raise exception 'Alat ini sudah diarsipkan'; end if;
    if it.condition not in ('baik', 'perlu_perbaikan') then
      raise exception 'Alat berkondisi rusak/hilang tidak bisa dipinjam';
    end if;
    if new.borrower_kind = 'mapala_lain' and not it.lendable_external then
      raise exception 'Alat ini tidak boleh dipinjamkan ke mapala lain';
    end if;
    if new.borrower_kind = 'anggota' and new.member_id is null then
      raise exception 'Pilih anggota peminjam';
    end if;
    if new.returned_at is not null then
      raise exception 'Catat peminjaman baru sebagai belum dikembalikan';
    end if;
    select coalesce(sum(qty), 0) into used from public.inventory_loans where item_id = new.item_id and returned_at is null;
    if new.qty > it.quantity - used then
      raise exception 'Stok tidak cukup: tersedia % dari %', it.quantity - used, it.quantity;
    end if;
  else
    if new.item_id <> old.item_id or new.qty <> old.qty or new.borrower_kind <> old.borrower_kind
       or new.borrower_name <> old.borrower_name or new.loaned_at <> old.loaned_at then
      raise exception 'Data pokok peminjaman tidak bisa diubah. Hapus lalu catat ulang bila salah';
    end if;
    if old.returned_at is not null and new.returned_at is distinct from old.returned_at then
      raise exception 'Peminjaman yang sudah dikembalikan tidak bisa dibuka lagi';
    end if;
  end if;
  return new;
end;
$$;
create trigger inventory_loans_guard_trg before insert or update on public.inventory_loans
  for each row execute function public.inventory_loans_guard();

-- Jumlah alat tidak boleh dikurangi di bawah jumlah yang sedang dipinjam
create function public.inventory_items_guard() returns trigger
language plpgsql security definer set search_path = public as $$
declare used int;
begin
  select coalesce(sum(qty), 0) into used from public.inventory_loans where item_id = new.id and returned_at is null;
  if new.quantity < used then
    raise exception 'Jumlah tidak boleh kurang dari yang sedang dipinjam (%)', used;
  end if;
  if not new.is_active and used > 0 then
    raise exception 'Alat masih dipinjam, tidak bisa diarsipkan';
  end if;
  return new;
end;
$$;
create trigger inventory_items_guard_trg before update on public.inventory_items
  for each row execute function public.inventory_items_guard();

-- ---------- Keamanan: hanya pengurus ----------
alter table public.inventory_items enable row level security;
alter table public.inventory_loans enable row level security;
grant all on public.inventory_items, public.inventory_loans to authenticated, service_role;

create policy inventory_items_admin on public.inventory_items for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy inventory_loans_admin on public.inventory_loans for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
