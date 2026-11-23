-- =====================================================================
-- Migrasi 0003 — Jaringan alumni, profil angkatan, permintaan kenalan
-- Cara pakai: Supabase → SQL Editor → New query → tempel seluruh isi
-- file ini → Run. Jalankan SATU KALI, SESUDAH 0002_alumni_blog.sql,
-- dan SEBELUM men-deploy versi website yang memakainya.
-- =====================================================================

-- ---------- 1. Bidang & "terbuka untuk" (profil alumni) ----------
alter table public.members
  add column if not exists bidang  text,
  add column if not exists open_to text[] not null default '{}';

alter table public.members
  add constraint members_bidang_chk check (
    bidang is null or bidang in ('Kesehatan', 'Pendidikan', 'Teknologi', 'Lingkungan & Kehutanan',
                                 'Pemerintahan', 'Wirausaha', 'Media & Kreatif', 'Hukum', 'Lainnya')
  ),
  add constraint members_open_to_chk check (
    open_to <@ array['mentor', 'kolaborasi', 'rekrutmen', 'dukungan']::text[]
  );

-- ---------- 2. Profil angkatan ----------
create table public.angkatan (
  code        text primary key check (code ~ '^[IVXLCDM]+$'),  -- angka Romawi baku, mis. XV
  name        text check (char_length(name) <= 80),            -- julukan angkatan
  motto       text check (char_length(motto) <= 200),
  entry_year  int  check (entry_year between 1950 and 2100),
  photo_url   text,
  description text check (char_length(description) <= 1500),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger angkatan_touch before update on public.angkatan
  for each row execute function public.touch_updated_at();

-- ---------- 3. Permintaan dikenalkan (kontak alumni lewat pengurus) ----------
create type public.intro_status as enum ('baru', 'diteruskan', 'selesai');

create table public.intro_requests (
  id                uuid primary key default gen_random_uuid(),
  member_id         uuid not null references public.members (id) on delete cascade,
  requester_name    text not null check (char_length(requester_name) between 2 and 100),
  requester_contact text not null check (char_length(requester_contact) between 5 and 120),
  message           text not null check (char_length(message) between 20 and 600),
  status            public.intro_status not null default 'baru',
  note              text check (char_length(note) <= 500),
  created_at        timestamptz not null default now(),
  handled_at        timestamptz
);
create index intro_requests_status_idx on public.intro_requests (status, created_at desc);
create index intro_requests_member_idx on public.intro_requests (member_id);

-- ---------- 4. Tulisan terhubung ke profil anggota penulisnya ----------
alter table public.posts
  add column if not exists author_member_id uuid references public.members (id) on delete set null;
create index posts_author_member_idx on public.posts (author_member_id);

update public.posts p
   set author_member_id = a.member_id
  from public.authors a
 where a.user_id = p.author_user_id and p.author_member_id is null;

create or replace function public.posts_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.status not in ('draft', 'submitted') then
      raise exception 'Penulis hanya boleh menyimpan draf atau mengajukan tulisan';
    end if;
    new.author_user_id   := auth.uid();
    new.author_name      := (select full_name from public.authors where user_id = auth.uid());
    new.author_member_id := (select member_id from public.authors where user_id = auth.uid());
    new.kind             := 'blog';
    new.published_at     := null;
    new.reviewed_by      := null;
    new.review_note      := null;
  else
    if old.author_user_id is distinct from auth.uid() then
      raise exception 'Ini bukan tulisan Anda';
    end if;
    if old.status = 'published' then
      raise exception 'Tulisan yang sudah terbit hanya bisa diubah pengurus';
    end if;
    if new.status not in ('draft', 'submitted') then
      raise exception 'Status tidak diizinkan';
    end if;
    new.author_user_id   := old.author_user_id;
    new.author_name      := old.author_name;
    new.author_member_id := old.author_member_id;
    new.kind             := old.kind;
    new.slug             := old.slug;
    new.published_at     := old.published_at;
    new.reviewed_by      := old.reviewed_by;
    new.review_note      := old.review_note;
  end if;
  return new;
end;
$$;

-- ---------- 5. Persetujuan pengajuan ikut membawa bidang & terbuka-untuk ----------
create or replace function public.approve_submission(p_id uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  s public.member_submissions;
  p jsonb;
  v_member uuid;
  v_open text[];
begin
  if not public.is_admin() then
    raise exception 'Tidak diizinkan';
  end if;

  select * into s from public.member_submissions where id = p_id for update;
  if not found then raise exception 'Pengajuan tidak ditemukan'; end if;
  if s.status <> 'pending' then raise exception 'Pengajuan sudah diproses'; end if;
  p := s.payload;
  v_open := coalesce(array(select jsonb_array_elements_text(coalesce(p->'open_to', '[]'::jsonb))), '{}');

  if s.kind = 'baru' then
    insert into public.members (full_name, nickname, angkatan, photo_url,
                                profession, workplace, city, public_instagram, public_linkedin, public_whatsapp,
                                bidang, open_to)
    values (p->>'full_name', nullif(p->>'nickname', ''), nullif(p->>'angkatan', ''), s.photo_url,
            nullif(p->>'profession', ''), nullif(p->>'workplace', ''), nullif(p->>'city', ''),
            nullif(p->>'public_instagram', ''), nullif(p->>'public_linkedin', ''), nullif(p->>'public_whatsapp', ''),
            nullif(p->>'bidang', ''), v_open)
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
      photo_url = coalesce(s.photo_url, photo_url),
      profession       = nullif(p->>'profession', ''),
      workplace        = nullif(p->>'workplace', ''),
      city             = nullif(p->>'city', ''),
      public_instagram = nullif(p->>'public_instagram', ''),
      public_linkedin  = nullif(p->>'public_linkedin', ''),
      public_whatsapp  = nullif(p->>'public_whatsapp', ''),
      bidang           = nullif(p->>'bidang', ''),
      open_to          = v_open
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

-- ---------- 6. Keamanan (RLS) ----------
alter table public.angkatan       enable row level security;
alter table public.intro_requests enable row level security;

grant select on public.angkatan to anon;
grant all on public.angkatan, public.intro_requests to authenticated, service_role;

-- Profil angkatan: publik boleh membaca, pengurus mengelola
create policy angkatan_read  on public.angkatan for select to anon, authenticated using (true);
create policy angkatan_admin on public.angkatan for all    to authenticated using (public.is_admin()) with check (public.is_admin());

-- Permintaan kenalan: HANYA pengurus. Pengunjung mengirim lewat server (service role), tidak langsung ke database.
create policy intro_admin on public.intro_requests for all to authenticated using (public.is_admin()) with check (public.is_admin());
