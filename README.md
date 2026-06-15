# Momento (Mesin Waktu Pribadi) - React PWA

Momento adalah aplikasi jurnal visual harian yang membantu Anda mendokumentasikan perjalanan hidup melalui satu foto dan cerita singkat setiap hari. Aplikasi ini menampilkan kembali momen yang sama di masa lalu sebagai flashback tahunan.

Proyek ini dibangun menggunakan **Vite + React (JavaScript)** untuk frontend, **Supabase** untuk backend (Auth, Database, Storage), dan siap dideploy ke **Vercel**.

---

## 🚀 Cara Menjalankan Secara Lokal

### 1. Prasyarat
Pastikan Anda sudah menginstal [Node.js](https://nodejs.org/).

### 2. Instalasi Dependensi
Buka terminal di folder proyek ini dan jalankan:
```bash
npm install
```

### 3. Konfigurasi Lingkungan (Environment Variables)
1. Salin file `.env.example` dan ubah namanya menjadi `.env`:
   ```bash
   cp .env.example .env
   ```
2. Buka file `.env` baru tersebut, lalu masukkan URL proyek dan Anon Key Supabase Anda:
   ```env
   VITE_SUPABASE_URL=https://xxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```
   *(Kredensial ini dapat ditemukan di Dashboard Supabase -> Project Settings -> API)*

### 4. Jalankan Aplikasi
Jalankan perintah berikut untuk memulai server pengembangan lokal:
```bash
npm run dev
```
Buka browser dan akses alamat yang tertera (biasanya `http://localhost:5173`). Gunakan mode pengujian perangkat seluler (Ctrl+Shift+I -> klik ikon mobile) untuk melihat tampilan HP yang optimal.

---

## ⚡ Langkah Setup Supabase

### 1. Inisialisasi Database (SQL Editor)
Buka menu **SQL Editor** di dashboard Supabase Anda, klik **New Query**, tempelkan kode SQL berikut, lalu klik **Run**:

```sql
-- Buat tabel entri jurnal harian
create table public.entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  date date not null,
  caption text not null,
  photo_url text not null,
  mood varchar(10),
  is_sample boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, date) -- Maksimal 1 entri per hari per user
);

-- Aktifkan Row Level Security (RLS)
alter table public.entries enable row level security;

-- Kebijakan RLS
create policy "User hanya bisa melihat data mereka sendiri" on public.entries
  for select using (auth.uid() = user_id);
create policy "User hanya bisa menambah data mereka sendiri" on public.entries
  for insert with check (auth.uid() = user_id);
create policy "User hanya bisa mengubah data mereka sendiri" on public.entries
  for update using (auth.uid() = user_id);
create policy "User hanya bisa menghapus data mereka sendiri" on public.entries
  for delete using (auth.uid() = user_id);
```

### 2. Setup Storage Bucket (`photos`)
1. Buka menu **Storage** di dashboard Supabase Anda.
2. Buat bucket baru bernama **`photos`**.
3. Setel bucket tersebut sebagai **Public bucket** (Toggle ON).
4. Klik **SQL Editor** -> **New Query** -> jalankan kode berikut untuk memberi izin upload pada pengguna yang sudah login:
   ```sql
   create policy "Izinkan publik melihat foto" on storage.objects for select using (bucket_id = 'photos');
   create policy "Izinkan user terautentikasi mengunggah foto" on storage.objects for insert with check (bucket_id = 'photos' and auth.role() = 'authenticated');
   create policy "Izinkan pemilik mengubah atau menghapus foto mereka" on storage.objects for update using (bucket_id = 'photos' and auth.role() = 'authenticated');
   create policy "Izinkan pemilik menghapus foto mereka" on storage.objects for delete using (bucket_id = 'photos' and auth.role() = 'authenticated');
   ```

### 3. Setup Authentication (Email Magic Link)
1. Buka menu **Authentication** -> **Providers** -> **Email**.
2. Pastikan **Enable Email Provider** aktif (Toggle ON).
3. **Nonaktifkan Confirm email** (Toggle OFF) demi mempermudah uji coba lokal secara langsung tanpa konfirmasi inbox email.
4. Klik **Save**.

---

## ☁️ Deployment ke Vercel

1. Unggah kode proyek Anda ke repositori **GitHub** Anda sendiri (buat repositori privat atau publik).
2. Masuk ke [Vercel](https://vercel.com/) dan buat proyek baru dengan mengimpor repositori GitHub tersebut.
3. Pada tab **Environment Variables** di Vercel, tambahkan dua variabel berikut sesuai dengan isi `.env` Anda:
   * `VITE_SUPABASE_URL`
   * `VITE_SUPABASE_ANON_KEY`
4. Klik **Deploy**. Selesai! Aplikasi Anda sudah online dan dapat langsung diakses serta di-install (Add to Home Screen) ke ponsel pintar Anda.
