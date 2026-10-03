# Order Resto - 1 QR Universal

Gratis selamanya: Vercel + Supabase (Rp 0)

## Halaman
- / (index.html) - Pembeli: Dine In (dropdown meja) & Takeaway, Nota PDF
- /kasir.html - PIN Kasir, realtime + bunyi ting, Lunas -> rekap
- /admin.html - PIN Admin, CRUD menu/stok/meja/pajak, QR Universal, laporan

## Coba Lokal
python3 -m http.server 8000
# buka http://localhost:8000 , http://localhost:8000/kasir.html , http://localhost:8000/admin.html

Default:
- Nama: Warung Galam, 12 meja, Pajak 10%
- PIN Kasir 1234, PIN Admin 9999 (ganti di Admin -> Pengaturan -> Ganti PIN)

## Deploy Gratis (Vercel + Supabase)
1. Buat project di supabase.com -> SQL Editor -> paste supabase.sql -> Run
2. Copy Project URL & anon key -> isi di js/config.js (SUPABASE_URL & SUPABASE_ANON_KEY)
3. Push ke GitHub, import di vercel.com -> Deploy
4. 1 QR Universal ada di /admin.html -> tab QR Universal -> Print

Tanpa Supabase pun jalan (localStorage + BroadcastChannel realtime antar tab).
