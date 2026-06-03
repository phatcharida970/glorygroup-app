-- ========== projects ==========
create table projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  customer_id uuid references customers(id) on delete set null,
  sale_price numeric(12,2) not null default 0,
  status text not null default 'active' check (status in ('active','done')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_projects_updated before update on projects
  for each row execute function set_updated_at();
create index projects_owner_idx on projects(owner_id);

-- ========== project_items (รายการค่าใช้จ่ายในงาน) ==========
create table project_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  amount numeric(12,2) not null default 0,
  dealer_id uuid references dealers(id) on delete set null,
  notes text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index project_items_project_idx on project_items(project_id);

-- ========== RLS ==========
alter table projects      enable row level security;
alter table project_items enable row level security;

create policy own_projects      on projects      for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy own_project_items on project_items for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
