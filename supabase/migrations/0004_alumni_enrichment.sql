-- =====================================================================
-- Migrasi 0004 — Pengayaan jaringan alumni (profil kaya, sorotan, pendaftaran alumni)
-- Cara pakai: Supabase → SQL Editor → New query → tempel seluruh isi
-- file ini → Run. Jalankan SATU KALI, SESUDAH 0003_alumni_network_angkatan.sql,
-- dan SEBELUM men-deploy versi website yang memakainya.
-- =====================================================================

-- ---------- 1. Profil alumni yang lebih kaya (kolom PUBLIK, diisi sukarela) ----------
alter table public.members
  add column if not exists bio            text,
  add column if not exists skills         text[] not null default '{}',
  add column if not exists grad_year      int,
  add column if not exists website        text,
  add column if not exists spotlight_quote text,
  add column if not exists spotlight_at    timestamptz;   -- tidak NULL = sedang disorot

-- Keahlian: maksimal 8 label, masing-masing 1–30 karakter
create function public.skills_valid(s text[]) returns boolean
language sql immutable as $$
  select cardinality(s) <= 8
     and not exists (select 1 from unnest(s) x where char_length(x) not between 1 and 30);
$$;

alter table public.members
  add constraint members_bio_len     check (bio is null or char_length(bio) <= 280),
  add constraint members_skills_chk  check (public.skills_valid(skills)),
  add constraint members_gradyear_chk check (grad_year is null or grad_year between 1950 and 2100),
  add constraint members_website_chk check (website is null or (char_length(website) <= 200 and website ~ '^https://')),
  add constraint members_quote_len   check (spotlight_quote is null or char_length(spotlight_quote) <= 240);

-- ---------- 2. Sorotan alumni: hanya alumni, maksimal 3 ----------
create function public.members_spotlight_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- Status berubah dari alumni → sorotan dilepas otomatis
  if tg_op = 'UPDATE' and old.status = 'alumni' and new.status <> 'alumni' and new.spotlight_at is not null then
    new.spotlight_at := null;
    new.spotlight_quote := null;
  end if;

  if new.spotlight_at is not null and (tg_op = 'INSERT' or old.spotlight_at is null) then
    if new.status <> 'alumni' then
      raise exception 'Hanya alumni yang bisa disorot';
    end if;
    if (select count(*) from public.members where spotlight_at is not null and id <> new.id) >= 3 then
      raise exception 'Maksimal 3 alumni sorotan. Lepas salah satu terlebih dahulu';
    end if;
  end if;
  return new;
end;
$$;
create trigger members_spotlight_trg before insert or update on public.members
  for each row execute function public.members_spotlight_guard();

-- ---------- 3. Persetujuan pengajuan: bawa profil kaya + status "alumni" untuk pendaftar jaringan alumni ----------
create or replace function public.approve_submission(p_id uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  s public.member_submissions;
  p jsonb;
  v_member uuid;
  v_open text[];
  v_skills text[];
  v_status public.member_status;
begin
  if not public.is_admin() then
    raise exception 'Tidak diizinkan';
  end if;

  select * into s from public.member_submissions where id = p_id for update;
  if not found then raise exception 'Pengajuan tidak ditemukan'; end if;
  if s.status <> 'pending' then raise exception 'Pengajuan sudah diproses'; end if;
  p := s.payload;
  v_open   := coalesce(array(select jsonb_array_elements_text(coalesce(p->'open_to', '[]'::jsonb))), '{}');
  v_skills := coalesce(array(select jsonb_array_elements_text(coalesce(p->'skills',  '[]'::jsonb))), '{}');
  -- Hanya halaman "Gabung jaringan alumni" yang mengirim status_hint = alumni; selain itu anggota aktif
  v_status := case when p->>'status_hint' = 'alumni' then 'alumni'::public.member_status else 'aktif'::public.member_status end;

  if s.kind = 'baru' then
    insert into public.members (full_name, nickname, angkatan, photo_url, status,
                                profession, workplace, city, public_instagram, public_linkedin, public_whatsapp,
                                bidang, open_to, bio, skills, grad_year, website)
    values (p->>'full_name', nullif(p->>'nickname', ''), nullif(p->>'angkatan', ''), s.photo_url, v_status,
            nullif(p->>'profession', ''), nullif(p->>'workplace', ''), nullif(p->>'city', ''),
            nullif(p->>'public_instagram', ''), nullif(p->>'public_linkedin', ''), nullif(p->>'public_whatsapp', ''),
            nullif(p->>'bidang', ''), v_open,
            nullif(p->>'bio', ''), v_skills, nullif(p->>'grad_year', '')::int, nullif(p->>'website', ''))
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
      open_to          = v_open,
      bio              = nullif(p->>'bio', ''),
      skills           = v_skills,
      grad_year        = nullif(p->>'grad_year', '')::int,
      website          = nullif(p->>'website', '')
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
