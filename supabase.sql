-- Jalankan di Supabase SQL Editor (supabase.com -> SQL Editor -> New Query)
-- Data permanen: logout/ganti HP tetap ada

create table if not exists menus (
  id text primary key,
  nama text not null,
  harga integer not null,
  kategori text not null,
  foto text,
  stok text not null default 'tersedia',
  created_at timestamp with time zone default now()
);

create table if not exists orders (
  id text primary key,
  tipe text not null check (tipe in ('dinein','takeaway')),
  meja text,
  nama text,
  wa text,
  jam_ambil text,
  catatan text,
  items jsonb not null,
  subtotal integer not null,
  pajak integer not null,
  total integer not null,
  status text not null default 'baru' check (status in ('baru','dimasak','siap','lunas')),
  created_at timestamp with time zone default now()
);

-- Realtime (idempotent — aman di-Run ulang)
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='orders') then
    execute 'alter publication supabase_realtime add table orders';
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='menus') then
    execute 'alter publication supabase_realtime add table menus';
  end if;
end $$;

-- Buka akses anon (free tier simpel, aman karena tanpa data sensitif)
-- Untuk produksi bisa tambah RLS, ini mode cepat:
alter table menus enable row level security;
alter table orders enable row level security;
drop policy if exists "allow all menus" on menus;
drop policy if exists "allow all orders" on orders;
create policy "allow all menus" on menus for all using (true) with check (true);
create policy "allow all orders" on orders for all using (true) with check (true);

-- Seed menu awal
insert into menus (id,nama,harga,kategori,foto,stok) values
('m1','Ayam Bakar Galam',28000,'Makanan','https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400','tersedia'),
('m2','Nasi Goreng Kampung',22000,'Makanan','https://images.unsplash.com/photo-1603133872875-ca2a98a0c45d?w=400','tersedia'),
('m3','Soto Banjar',25000,'Makanan','https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400','tersedia'),
('m4','Es Teh Manis',6000,'Minuman','https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400','tersedia'),
('m5','Es Jeruk Peras',8000,'Minuman','https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400','tersedia'),
('m6','Pisang Goreng',12000,'Snack','https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400','tersedia')
on conflict (id) do nothing;

create table if not exists settings (
  id text primary key,
  nama text not null,
  alamat text not null,
  pajak integer not null default 0,
  jumlah_meja integer not null default 12,
  pin_kasir text not null,
  pin_admin text not null,
  updated_at timestamp with time zone default now()
);
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='settings') then
    execute 'alter publication supabase_realtime add table settings';
  end if;
end $$;
alter table settings enable row level security;
drop policy if exists "allow all settings" on settings;
create policy "allow all settings" on settings for all using (true) with check (true);
insert into settings (id,nama,alamat,pajak,jumlah_meja,pin_kasir,pin_admin) values
('default','Warung Sahabat','Jl. Sahabat No. 12, Banjarmasin',0,12,'1234','9999')
on conflict (id) do nothing;
