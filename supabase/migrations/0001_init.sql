-- ========== EXTENSIONS ==========
create extension if not exists "pgcrypto";

-- ========== updated_at trigger ==========
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

-- ========== customers ==========
create table customers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  phone text, line_id text, project_name text, address text, budget text,
  style_tags text[] not null default '{}',
  color_material_tags text[] not null default '{}',
  dislikes text,
  rooms text[] not null default '{}',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_customers_updated before update on customers
  for each row execute function set_updated_at();
create index customers_owner_idx on customers(owner_id);

-- ========== dealers ==========
create table dealers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  rating numeric(2,1),
  categories text[] not null default '{}',
  phone text, line_id text, location_text text, map_url text,
  credit_terms text, shipping_note text, min_order text, hours text, notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_dealers_updated before update on dealers
  for each row execute function set_updated_at();
create index dealers_owner_idx on dealers(owner_id);

-- ========== items ==========
create table items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  unit text not null,
  category text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_items_updated before update on items
  for each row execute function set_updated_at();
create index items_owner_idx on items(owner_id);

-- ========== prices (เก็บประวัติ) ==========
create table prices (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  item_id uuid not null references items(id) on delete cascade,
  dealer_id uuid not null references dealers(id) on delete cascade,
  price numeric(12,2) not null,
  observed_at date not null default current_date,
  note text,
  created_at timestamptz not null default now()
);
create index prices_lookup_idx on prices(item_id, dealer_id, observed_at desc, created_at desc);
create index prices_owner_idx on prices(owner_id);

-- ========== attachments ==========
create table attachments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  entity_type text not null check (entity_type in ('customer','dealer')),
  entity_id uuid not null,
  storage_path text not null,
  caption text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index attachments_entity_idx on attachments(entity_type, entity_id);

-- ========== view: ราคาล่าสุดต่อ (item, dealer) ==========
create view latest_prices with (security_invoker = true) as
select distinct on (item_id, dealer_id)
  id, owner_id, item_id, dealer_id, price, observed_at, created_at
from prices
order by item_id, dealer_id, observed_at desc, created_at desc;

-- ========== RLS ==========
alter table customers enable row level security;
alter table dealers   enable row level security;
alter table items     enable row level security;
alter table prices    enable row level security;
alter table attachments enable row level security;

create policy own_customers on customers for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy own_dealers   on dealers   for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy own_items     on items     for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy own_prices    on prices    for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy own_attachments on attachments for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- ========== storage bucket + policies ==========
insert into storage.buckets (id, name, public) values ('attachments','attachments', false)
on conflict (id) do nothing;

-- ผู้ใช้เข้าถึงเฉพาะไฟล์ในโฟลเดอร์ {auth.uid()}/...
create policy "own files read"   on storage.objects for select using (bucket_id='attachments' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own files insert" on storage.objects for insert with check (bucket_id='attachments' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own files delete" on storage.objects for delete using (bucket_id='attachments' and (storage.foldername(name))[1] = auth.uid()::text);
