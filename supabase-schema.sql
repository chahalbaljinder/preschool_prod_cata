-- Run this in Supabase SQL Editor
create table if not exists products (
  id uuid default gen_random_uuid() primary key,
  cat text not null,
  name text not null,
  code text unique not null,
  size text default '',
  price numeric default 0,
  img text not null,
  notes text[] default '{}',
  created_at timestamptz default now()
);

alter table products enable row level security;

create policy "Products are viewable by everyone" on products
  for select using (true);

create policy "Service role full access" on products
  for all using (auth.role() = 'service_role');

create index if not exists idx_products_code on products(code);
create index if not exists idx_products_cat on products(cat);
