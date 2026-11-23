-- =====================================================================
-- Migrasi 0002 — Profil alumni, blog & berita, penulis
-- Cara pakai: Supabase → SQL Editor → New query → tempel seluruh isi
-- file ini → Run. Jalankan SATU KALI, SESUDAH supabase/schema.sql,
-- dan SEBELUM men-deploy versi website yang memakai fitur ini.
-- =====================================================================

-- ---------- 1. Profil alumni (kolom tambahan di `members`) ----------
-- Semua kolom ini bersifat PUBLIK (tampil di halaman Alumni). Anggota hanya
-- mengisi kontak yang memang ingin ditampilkan; NIM/HP/email pribadi tetap
-- di `member_private`.
alter table public.members
  add column if not exists profession       text,
  add column if not exists workplace        text,
  add column if not exists city             text,
  add column if not exists public_instagram text,
  add column if not exists public_linkedin  text,
  add column if not exists public_whatsapp  text;

alter table public.members
  add constraint members_profile_len check (
    char_length(coalesce(profession, ''))       <= 120 and
    char_length(coalesce(workplace, ''))        <= 120 and
    char_length(coalesce(city, ''))             <= 80  and
    char_length(coalesce(public_instagram, '')) <= 40  and
    char_length(coalesce(public_linkedin, ''))  <= 200 and
    char_length(coalesce(public_whatsapp, ''))  <= 20
  );

-- Persetujuan pengajuan kini ikut membawa kolom profil
create or replace function public.approve_submission(p_id uuid) returns uuid
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
    insert into public.members (full_name, nickname, angkatan, photo_url,
                                profession, workplace, city, public_instagram, public_linkedin, public_whatsapp)
    values (p->>'full_name', nullif(p->>'nickname', ''), nullif(p->>'angkatan', ''), s.photo_url,
            nullif(p->>'profession', ''), nullif(p->>'workplace', ''), nullif(p->>'city', ''),
            nullif(p->>'public_instagram', ''), nullif(p->>'public_linkedin', ''), nullif(p->>'public_whatsapp', ''))
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
      public_whatsapp  = nullif(p->>'public_whatsapp', '')
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

-- ---------- 2. Penulis & tulisan ----------
create type public.post_kind   as enum ('blog', 'berita');
create type public.post_status as enum ('draft', 'submitted', 'published', 'rejected');

-- Penulis = anggota yang diberi akses menulis oleh pengurus. Masuk lewat tautan email (tanpa kata sandi).
create table public.authors (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  member_id  uuid references public.members (id) on delete set null,
  full_name  text not null,
  email      text,
  created_at timestamptz not null default now()
);

create function public.is_author() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.authors where user_id = auth.uid());
$$;

create table public.posts (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique,
  kind           public.post_kind not null default 'blog',
  status         public.post_status not null default 'draft',
  title          text not null check (char_length(title) between 3 and 150),
  excerpt        text check (char_length(excerpt) <= 300),
  body           text not null default '' check (char_length(body) <= 60000),
  cover_url      text,
  author_user_id uuid references auth.users (id) on delete set null,
  author_name    text not null,
  review_note    text,
  published_at   timestamptz,
  reviewed_by    uuid references auth.users (id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index posts_published_idx on public.posts (status, published_at desc);
create index posts_author_idx on public.posts (author_user_id);
create trigger posts_touch before update on public.posts
  for each row execute function public.touch_updated_at();

-- Penjaga: penulis biasa tidak bisa menerbitkan, mengganti pemilik/jenis/slug, atau mengubah tulisan terbit.
-- Pengurus (is_admin) dan server (service role, auth.uid() kosong) bebas.
create function public.posts_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.status not in ('draft', 'submitted') then
      raise exception 'Penulis hanya boleh menyimpan draf atau mengajukan tulisan';
    end if;
    new.author_user_id := auth.uid();
    new.author_name    := (select full_name from public.authors where user_id = auth.uid());
    new.kind           := 'blog';
    new.published_at   := null;
    new.reviewed_by    := null;
    new.review_note    := null;
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
    new.author_user_id := old.author_user_id;
    new.author_name    := old.author_name;
    new.kind           := old.kind;
    new.slug           := old.slug;
    new.published_at   := old.published_at;
    new.reviewed_by    := old.reviewed_by;
    new.review_note    := old.review_note;
  end if;
  return new;
end;
$$;
create trigger posts_guard_trg before insert or update on public.posts
  for each row execute function public.posts_guard();

-- ---------- 3. Keamanan (RLS) ----------
alter table public.authors enable row level security;
alter table public.posts   enable row level security;

grant select on public.posts to anon;
grant all on public.authors, public.posts to authenticated, service_role;

create policy authors_read  on public.authors for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy authors_admin on public.authors for all    to authenticated using (public.is_admin()) with check (public.is_admin());

-- Publik hanya melihat tulisan yang sudah terbit
create policy posts_public_read on public.posts for select to anon, authenticated using (status = 'published');
create policy posts_admin_all   on public.posts for all    to authenticated using (public.is_admin()) with check (public.is_admin());
-- Penulis: lihat, buat, ubah, hapus tulisannya sendiri (sebatas draf/diajukan/ditolak)
create policy posts_author_read   on public.posts for select to authenticated using (author_user_id = auth.uid());
create policy posts_author_insert on public.posts for insert to authenticated
  with check (public.is_author() and author_user_id = auth.uid() and kind = 'blog' and status in ('draft', 'submitted'));
create policy posts_author_update on public.posts for update to authenticated
  using (public.is_author() and author_user_id = auth.uid() and status in ('draft', 'submitted', 'rejected'))
  with check (author_user_id = auth.uid() and status in ('draft', 'submitted'));
create policy posts_author_delete on public.posts for delete to authenticated
  using (public.is_author() and author_user_id = auth.uid() and status in ('draft', 'rejected'));

-- ---------- 4. Penyimpanan foto blog ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('blog', 'blog', true, 3145728, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Pengurus bebas; penulis hanya di folder bernama ID akunnya sendiri
create policy "kelola foto blog" on storage.objects for all to authenticated
  using (bucket_id = 'blog' and (public.is_admin() or (public.is_author() and (storage.foldername(name))[1] = auth.uid()::text)))
  with check (bucket_id = 'blog' and (public.is_admin() or (public.is_author() and (storage.foldername(name))[1] = auth.uid()::text)));
