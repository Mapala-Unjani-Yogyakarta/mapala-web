# Website Mapala

Website organisasi Mapala: landing page, arsip anggota, periode kepengurusan, dan gallery kegiatan, dengan panel admin untuk pengurus.

**Teknologi:** Next.js (TypeScript) · Tailwind CSS · Supabase (database, login pengurus, penyimpanan foto).

## Fitur Tahap 1

| Bagian | Isi |
|---|---|
| Publik | Beranda, Pengurus, Arsip Periode, Gallery (album + pratinjau foto) |
| Anggota (tanpa login) | Formulir isi data `/isi-data`, ubah data lewat tautan pribadi `/ubah/…` |
| Panel admin `/admin` | Dashboard, Verifikasi, Anggota (cari, filter, impor/ekspor CSV), Periode & Pengurus, Gallery, Konten Website, Akun Pengurus |

Semua data dari anggota **masuk antrean verifikasi** dulu. Data sensitif (NIM, HP, golongan darah, alamat, kontak darurat) disimpan terpisah dan hanya bisa dilihat pengurus yang login.

---

## Cara menjalankan

### 1. Pasang Node.js
Unduh versi LTS dari <https://nodejs.org>, lalu di folder proyek ini jalankan:

```bash
npm install
```

### 2. Buat proyek Supabase (gratis)
1. Daftar di <https://supabase.com>. **Pakai email organisasi/bersama**, bukan email pribadi, supaya tidak terkunci saat pengurus berganti.
2. Klik **New project**, beri nama (mis. `mapala-web`), pilih region **Southeast Asia (Singapore)**, dan simpan *database password*.
3. Buka **SQL Editor → New query**, tempel seluruh isi [`supabase/schema.sql`](supabase/schema.sql), lalu klik **Run**. (Cukup sekali.)
4. Buka **Authentication → Sign In / Providers**, matikan **Allow new users to sign up**. Akun pengurus dibuat dari panel admin, bukan pendaftaran bebas.

### 3. Buat akun super admin pertama
1. Di Supabase buka **Authentication → Users → Add user → Create new user**. Isi email dan kata sandi, centang **Auto Confirm User**.
2. Buka **SQL Editor**, jalankan (ganti nama dan email):

```sql
insert into public.admins (user_id, full_name, email, role)
select id, 'Nama Kamu', email, 'super_admin'
from auth.users where email = 'email-yang-tadi@contoh.com';
```

### 4. Isi pengaturan
Salin `.env.example` menjadi `.env.local`, lalu isi dari **Project Settings → API** di Supabase:

| Variabel | Diambil dari |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon` / publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` / secret key (**rahasia**) |
| `NEXT_PUBLIC_SITE_URL` | Alamat website (di komputer: `http://localhost:3000`) |

### 5. Jalankan di komputer

```bash
npm run dev
```

Buka <http://localhost:3000>. Login pengurus di <http://localhost:3000/admin>.

### 6. Pasang di internet (Vercel, gratis)
1. Unggah proyek ke GitHub (sebaiknya ke *organization* milik organisasi).
2. Di <https://vercel.com> pilih **Add New → Project**, impor repositorinya.
3. Isi **Environment Variables** yang sama seperti `.env.local`, dengan `NEXT_PUBLIC_SITE_URL` berisi alamat website sebenarnya.
4. Klik **Deploy**. Domain sendiri bisa dipasang di **Settings → Domains**.

---

## Mengganti tampilan (tema)

Gaya: hero gunung berlapis di beranda dengan langit biru → hijau, navbar pil kaca, dan judul serif tipis. Halaman lain memakai kepala halaman ringan (langit lembut + siluet gunung).

Seluruh warna, bentuk, dan font terpusat di **satu file: [`src/app/globals.css`](src/app/globals.css)**. Komponen tidak memakai warna mentah, hanya nama bermakna.

| Ingin mengubah | Ubah |
|---|---|
| Warna hijau merek | `--color-brand-50 … 900` di `globals.css` |
| Warna langit (hero & kepala halaman) | `--color-sky-100 … 800` |
| Latar halaman, kartu, garis | `--color-canvas`, `--color-surface`, `--color-sunken`, `--color-line` |
| Warna teks | `--color-ink`, `--color-body`, `--color-muted`, `--color-faint` |
| Sudut membulat & bayangan | `--radius-*`, `--shadow-*` |
| Font | `--font-sans`, `--font-display` + impor font di `src/app/layout.tsx` |
| Gaya judul, kartu, kaca | blok `@utility` di `globals.css` (`page-title`, `card`, `glass`, …) |
| **Warna & bentuk gunung (hero beranda)** | objek `LAYERS` di `src/components/site/mountains.tsx` |
| **Adegan tiap bagian beranda & hero halaman** | `src/components/site/scenes.tsx` (warna ada di atribut `fill`); gradasi latar & urutan di `scene-section.tsx` |
| Warna waktu (senja, malam, fajar…) | `--color-dusk-*`, `--color-night-*`, `--color-dawn-*`, `--color-sand-*`, `--color-mist-*` |
| Kecepatan paralaks, posisi nama | atribut `data-depth` / `top-[..%]` di `src/components/site/hero.tsx` |

Beranda berisi enam adegan berurutan mengikuti waktu (hero siang → pagi berkabut → siang keemasan → senja → malam → fajar). Pembatas antarbagian berwarna sama dengan warna awal bagian berikutnya sehingga transisinya menyatu; bagian yang kosong otomatis dilewati. Halaman Pengurus, Periode, dan Gallery punya hero ilustrasi sendiri (`SceneHero`).

Bagian situs publik ada di `src/components/site/`: `hero`, `mountains`, `scenes`, `scene-kit`, `scene-section`, `parallax`, `site-header` (navbar), `site-footer`, `page-hero`, `stats`, `album-card`, `person-card`. Pola dasar (tombol, input, label status) ada di `src/components/ui.tsx`.

**Aksesibilitas & performa:** animasi hero mati otomatis bila pengguna memilih "kurangi gerakan" di perangkatnya. Gunung dibuat dari SVG (tanpa gambar), jadi ringan dan tajam di semua layar. Untuk mengganti dengan foto sendiri, ganti isi `MountainLayer` pada `hero.tsx` dengan elemen `<img>` bertingkat.

**Aturan agar tetap rapi:** jangan menulis warna bawaan Tailwind (`gray-500`, `green-600`, dll.) atau kode warna `#xxxxxx` di komponen. Pakai token di atas.

## Alur kerja sehari-hari

- **Anggota baru:** bagikan tautan `…/isi-data`. Data masuk ke **Verifikasi**, pengurus klik *Setujui*.
- **Anggota lama ingin ubah data:** buka profilnya di **Anggota**, buat **tautan pribadi**, kirim lewat WhatsApp. Perubahan juga masuk **Verifikasi**.
- **Periode baru:** **Periode & Pengurus → Buat periode**, lalu tambahkan pengurusnya.
- **Gallery:** **Gallery → Buat album → Unggah foto** (boleh banyak sekaligus).
- **Impor anggota lama:** **Anggota → Impor**, unduh templat CSV, isi, lalu unggah.

## Catatan penting

- **Supabase gratis menjeda proyek** yang tidak aktif selama 1 minggu. Pencegahnya sudah dipasang: workflow `.github/workflows/keepalive.yml` memanggil `/api/health` (yang membaca database) tiap 3 hari. Alamat website diambil dari variabel repo `SITE_URL` (GitHub → Settings → Secrets and variables → Actions → **Variables**); perbarui bila domain berganti. Bisa dijalankan manual dari tab **Actions**.
- **Penyimpanan foto gratis 1 GB.** Foto otomatis dikecilkan di browser; sekitar 3.000 foto muat.
- **Captcha Turnstile (opsional, gratis):** aktifkan bila formulir publik kena spam.
  1. Buka dash.cloudflare.com → **Turnstile → Add widget**. Isi hostname dengan domain websitemu (dan `localhost` bila ingin menguji di komputer), mode **Managed**.
  2. Salin **Site key** dan **Secret key**.
  3. Di Vercel → Settings → Environment Variables tambahkan `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (Site key) dan `TURNSTILE_SECRET_KEY` (Secret key, tandai *Sensitive*), lalu **Redeploy**.
  4. Tanpa kedua variabel itu captcha otomatis mati; formulir tetap dilindungi kolom jebakan bot dan batas kiriman per jam.
- **Kelambatan halaman?** Buka `/api/health`: `region` adalah region fungsi Vercel dan `db_ms` lama kueri ke Supabase. Idealnya region fungsi sama dengan region proyek Supabase. Region fungsi diatur lewat `vercel.json` (`"regions": ["sin1"]` = Singapura). Ganti kodenya bila Supabase-mu di region lain (mis. `hnd1` Tokyo, `syd1` Sydney, `iad1` AS timur).
- **Serah terima kepengurusan:** pastikan minimal dua orang menjadi *Owner* di Supabase, Vercel, GitHub, dan registrar domain.
- Tautan pribadi anggota bersifat rahasia. Bila bocor, buat ulang atau cabut dari profil anggota.

## Struktur proyek

```
src/app/(public)/      halaman publik + formulir anggota
src/app/admin/         login + panel admin (halaman dan server action)
src/components/        komponen UI, formulir, unggah foto
src/components/site/   header, footer, hero, kartu situs publik
src/app/globals.css    TEMA: warna, bentuk, font, pola komponen
src/lib/               klien Supabase, validasi, akses data, util
supabase/schema.sql    skema database + aturan keamanan (RLS) + bucket foto
```

## Perintah

```bash
npm run dev     # jalankan mode pengembangan
npm run build   # build produksi
npm run lint    # cek kode
```
