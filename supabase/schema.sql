-- =====================================================================
-- Website Mapala — skema database (Tahap 1)
-- Cara pakai: buka Supabase → SQL Editor → New query → tempel seluruh
-- isi file ini → klik Run. Jalankan SATU KALI saja pada proyek baru.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------- Tipe data ----------
create type public.member_status as enum ('aktif', 'alumni', 'luar_biasa', 'non_aktif');
create type public.admin_role as enum ('super_admin', 'pengurus');
create type public.submission_status as enum ('pending', 'approved', 'rejected');
create type public.submission_kind as enum ('baru', 'ubah');

-- ---------- Akun pengurus (admin panel) ----------
create table public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  full_name  text not null,
  email      text,
  role       public.admin_role not null default 'pengurus',
  created_at timestamptz not null default now()
);

create function public.is_admin() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

create function public.is_super_admin() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid() and role = 'super_admin');
$$;

create function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------- Pengaturan konten landing page (satu baris) ----------
create table public.site_settings (
  id            int primary key default 1 check (id = 1),
  org_name      text not null default 'Mapala',
  tagline       text not null default 'Mahasiswa Pecinta Alam',
  about         text not null default 'Tulis profil organisasi di panel admin → Konten Website.',
  vision        text not null default '',
  mission       text not null default '',
  history       text not null default '',
  founded_year  int,
  contact_email text not null default '',
  contact_phone text not null default '',
  whatsapp      text not null default '',
  instagram     text not null default '',
  address       text not null default '',
  hero_image_url text,
  updated_at    timestamptz not null default now()
);
insert into public.site_settings (id) values (1);
create trigger site_settings_touch before update on public.site_settings
  for each row execute function public.touch_updated_at();

-- ---------- Anggota ----------
-- Tabel `members` HANYA berisi data yang boleh tampil publik.
-- Data sensitif dipisah di `member_private` (hanya bisa dibaca pengurus).
create table public.members (
  id            uuid primary key default gen_random_uuid(),
  full_name     text not null,
  nickname      text,                 -- nama lapangan
  member_number text,                 -- nomor anggota
  angkatan      text,
  status        public.member_status not null default 'aktif',
  photo_url     text,
  is_public     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index members_name_idx on public.members (full_name);
create trigger members_touch before update on public.members
  for each row execute function public.touch_updated_at();

create table public.member_private (
  member_id       uuid primary key references public.members (id) on delete cascade,
  nim             text,
  email           text,
  phone           text,
  blood_type      text,
  address         text,
  emergency_name  text,
  emergency_phone text,
  edit_token      text unique         -- untuk tautan pribadi ubah data
);

-- ---------- Periode kepengurusan ----------
create table public.periods (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  name       text not null,
  year_start int not null,
  year_end   int not null,
  theme      text,
  vision     text,
  is_current boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.positions (
  id         uuid primary key default gen_random_uuid(),
  period_id  uuid not null references public.periods (id) on delete cascade,
  member_id  uuid not null references public.members (id) on delete cascade,
  title      text not null,
  division   text,
  sort_order int not null default 100
);
create index positions_period_idx on public.positions (period_id);
create index positions_member_idx on public.positions (member_id);

-- ---------- Gallery ----------
create table public.albums (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  title        text not null,
  description  text,
  event_date   date,
  cover_url    text,
  is_published boolean not null default true,
  created_at   timestamptz not null default now()
);

create table public.photos (
  id         uuid primary key default gen_random_uuid(),
  album_id   uuid not null references public.albums (id) on delete cascade,
  url        text not null,
  path       text not null,
  caption    text,
  created_at timestamptz not null default now()
);
create index photos_album_idx on public.photos (album_id);

-- ---------- Pengajuan data anggota (menunggu verifikasi) ----------
create table public.member_submissions (
  id            uuid primary key default gen_random_uuid(),
  kind          public.submission_kind not null,
  status        public.submission_status not null default 'pending',
  member_id     uuid references public.members (id) on delete set null,
  payload       jsonb not null,
  photo_url     text,
  reject_reason text,
  submitted_at  timestamptz not null default now(),
  reviewed_at   timestamptz,
  reviewed_by   uuid references auth.users (id) on delete set null
);
create index submissions_status_idx on public.member_submissions (status, submitted_at desc);

-- ---------- Setujui pengajuan (satu transaksi) ----------
create function public.approve_submission(p_id uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  s public.member_submissions;
  p jsonb;
  v_member uuid;
begin
  if not public.is_admin() then
    raise exception 'Tidak diizinkan';
  end if;

  select * into s from public.member_submissions where id = p_id for update;
  if not found then raise exception 'Pengajuan tidak ditemukan'; end if;
  if s.status <> 'pending' then raise exception 'Pengajuan sudah diproses'; end if;
  p := s.payload;

  if s.kind = 'baru' then
    insert into public.members (full_name, nickname, angkatan, photo_url)
    values (p->>'full_name', nullif(p->>'nickname', ''), nullif(p->>'angkatan', ''), s.photo_url)
    returning id into v_member;
  else
    if s.member_id is null then
      raise exception 'Anggota untuk pengajuan ini sudah dihapus';
    end if;
    v_member := s.member_id;
    update public.members set
      full_name = p->>'full_name',
      nickname  = nullif(p->>'nickname', ''),
      angkatan  = nullif(p->>'angkatan', ''),
      photo_url = coalesce(s.photo_url, photo_url)
    where id = v_member;
  end if;

  insert into public.member_private (member_id, nim, email, phone, blood_type, address, emergency_name, emergency_phone)
  values (v_member, nullif(p->>'nim', ''), nullif(p->>'email', ''), nullif(p->>'phone', ''),
          nullif(p->>'blood_type', ''), nullif(p->>'address', ''),
          nullif(p->>'emergency_name', ''), nullif(p->>'emergency_phone', ''))
  on conflict (member_id) do update set
    nim = excluded.nim, email = excluded.email, phone = excluded.phone,
    blood_type = excluded.blood_type, address = excluded.address,
    emergency_name = excluded.emergency_name, emergency_phone = excluded.emergency_phone;

  update public.member_submissions
     set status = 'approved', reviewed_at = now(), reviewed_by = auth.uid(), member_id = v_member
   where id = p_id;

  return v_member;
end;
$$;

-- =====================================================================
-- Keamanan: Row Level Security
-- =====================================================================
alter table public.admins             enable row level security;
alter table public.site_settings      enable row level security;
alter table public.members            enable row level security;
alter table public.member_private     enable row level security;
alter table public.periods            enable row level security;
alter table public.positions          enable row level security;
alter table public.albums             enable row level security;
alter table public.photos             enable row level security;
alter table public.member_submissions enable row level security;

-- Hak akses tingkat tabel (RLS di bawah yang membatasi isinya)
grant usage on schema public to anon, authenticated, service_role;
grant select on public.site_settings, public.members, public.periods,
                public.positions, public.albums, public.photos to anon;
grant all on all tables in schema public to authenticated, service_role;
grant execute on function public.approve_submission(uuid) to authenticated;

-- Pengurus: baca daftar admin; ubah hanya super admin
create policy admins_select on public.admins for select to authenticated using (public.is_admin());
create policy admins_write  on public.admins for all    to authenticated using (public.is_super_admin()) with check (public.is_super_admin());

-- Konten situs
create policy settings_read  on public.site_settings for select to anon, authenticated using (true);
create policy settings_write on public.site_settings for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- Anggota: publik hanya melihat yang is_public; data privat hanya pengurus
create policy members_read  on public.members for select to anon, authenticated using (is_public or public.is_admin());
create policy members_write on public.members for all    to authenticated using (public.is_admin()) with check (public.is_admin());
create policy private_admin on public.member_private for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Periode dan jabatan
create policy periods_read   on public.periods   for select to anon, authenticated using (true);
create policy periods_write  on public.periods   for all    to authenticated using (public.is_admin()) with check (public.is_admin());
create policy positions_read  on public.positions for select to anon, authenticated using (true);
create policy positions_write on public.positions for all    to authenticated using (public.is_admin()) with check (public.is_admin());

-- Gallery
create policy albums_read  on public.albums for select to anon, authenticated using (is_published or public.is_admin());
create policy albums_write on public.albums for all    to authenticated using (public.is_admin()) with check (public.is_admin());
create policy photos_read  on public.photos for select to anon, authenticated
  using (public.is_admin() or exists (select 1 from public.albums a where a.id = album_id and a.is_published));
create policy photos_write on public.photos for all    to authenticated using (public.is_admin()) with check (public.is_admin());

-- Pengajuan: hanya pengurus. (Anggota mengirim lewat server, bukan langsung ke database.)
create policy submissions_admin on public.member_submissions for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- =====================================================================
-- Penyimpanan foto (Storage)
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('gallery', 'gallery', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('members', 'members', true, 2097152, array['image/jpeg', 'image/png', 'image/webp']),
  ('site',    'site',    true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "pengurus kelola foto" on storage.objects for all to authenticated
  using (bucket_id in ('gallery', 'members', 'site') and public.is_admin())
  with check (bucket_id in ('gallery', 'members', 'site') and public.is_admin());
